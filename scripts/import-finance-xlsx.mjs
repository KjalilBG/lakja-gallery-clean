import XLSX from "xlsx";
import { PrismaClient, FinanceOwner, FinanceSourceChannel, FinanceSpecialType, FinanceTransactionStatus, FinanceTransactionType } from "@prisma/client";

process.loadEnvFile?.(".env");

const prisma = new PrismaClient();

const workbookPath = process.argv[2] || "C:/Users/KJALIL BEYRUTI/Downloads/Finanzas Personales.xlsx";
const includePending = process.argv.includes("--include-pending");

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function toOwner(value) {
  const normalized = normalizeLower(value);
  if (normalized === "lakja") return FinanceOwner.LAKJA;
  if (normalized === "kjalil") return FinanceOwner.KJALIL;
  if (normalized === "k&k" || normalized === "k y k" || normalized === "kk") return FinanceOwner.KK;
  return null;
}

function inferSpecialType(row) {
  const combined = normalizeLower(`${row.Category || ""} ${row.Description || ""} ${row.Raw_Message || ""}`);
  if (combined.includes("prestamo") && (combined.includes("pagado") || combined.includes("devol") || combined.includes("recuper"))) {
    return FinanceSpecialType.PRESTAMO_RECUPERADO;
  }
  if (combined.includes("prestamo")) {
    return FinanceSpecialType.PRESTAMO_DADO;
  }
  if (combined.includes("reembolso") || combined.includes("devol")) {
    return FinanceSpecialType.REEMBOLSO;
  }
  if (combined.includes("transfer")) {
    return FinanceSpecialType.TRANSFERENCIA;
  }
  if (combined.includes("inversion")) {
    return FinanceSpecialType.OTRO;
  }
  return null;
}

function inferType(row) {
  const normalized = normalizeLower(row.Type);
  const normalizedCategory = normalizeLower(row.Category);
  const combined = normalizeLower(`${row.Category || ""} ${row.Description || ""} ${row.Raw_Message || ""}`);
  const owner = toOwner(row.Owner);

  if (normalizedCategory.includes("honorarios")) {
    if (combined.includes("kjalil")) return FinanceTransactionType.HONORARIOS_KJALIL;
    return FinanceTransactionType.HONORARIOS_TERCEROS;
  }

  const specialType = inferSpecialType(row);
  if (specialType) return FinanceTransactionType.SPECIAL;

  if (normalized === "income") {
    return owner === FinanceOwner.LAKJA ? FinanceTransactionType.INCOME : FinanceTransactionType.SPECIAL;
  }

  if (normalized === "expense") return FinanceTransactionType.EXPENSE;
  return FinanceTransactionType.SPECIAL;
}

function toStatus(row, sheetName) {
  if (sheetName === "pending_transactions" && normalizeLower(row.Pending_Status) === "waiting_owner") {
    return FinanceTransactionStatus.NEEDS_REVIEW;
  }
  if (normalizeLower(row.Owner) === "unknown") return FinanceTransactionStatus.NEEDS_REVIEW;
  return FinanceTransactionStatus.CONFIRMED;
}

function toDate(value) {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toAmount(value) {
  if (value == null || value === "") return 0;
  const normalized = String(value).replace(/,/g, "").trim();
  const amount = Number(normalized);
  return Number.isNaN(amount) ? 0 : amount;
}

function getPeriodKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function sheetObjects(workbook, name) {
  const sheet = workbook.Sheets[name];
  return sheet ? XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false }) : [];
}

function selectPendingRows(rows) {
  const groups = new Map();

  for (const row of rows) {
    const transactionId = normalizeText(row.Transaction_ID);
    const key =
      transactionId ||
      JSON.stringify({
        rawMessage: normalizeText(row.Raw_Message),
        amount: normalizeText(row.Amount),
        date: normalizeText(row.Date)
      });

    const current = groups.get(key);
    const score =
      (normalizeLower(row.Pending_Status) === "resolved" ? 100 : 0) +
      (normalizeLower(row.Status) === "confirmed" ? 50 : 0) +
      (toOwner(row.Owner) ? 25 : 0);

    if (!current || score >= current.score) {
      groups.set(key, { row, score });
    }
  }

  return Array.from(groups.values()).map((entry) => entry.row);
}

function inferCounterparty(row) {
  const combined = `${row.Description || ""} ${row.Raw_Message || ""}`;
  const match = combined.match(/(?:honorarios(?: pagados)?(?: a)?|-\s)([A-Za-zÁÉÍÓÚÑáéíóúñ]+)\b/);
  return match?.[1] || null;
}

async function importTransactions(workbook) {
  await prisma.financeTransaction.deleteMany({
    where: { sourceChannel: FinanceSourceChannel.IMPORT }
  });

  const sheets = [["transactions", sheetObjects(workbook, "transactions")]];

  if (includePending) {
    sheets.push(["pending_transactions", selectPendingRows(sheetObjects(workbook, "pending_transactions"))]);
  }

  let imported = 0;

  for (const [sheetName, rows] of sheets) {
    let rowIndex = 0;

    for (const row of rows) {
      rowIndex += 1;
      const date = toDate(row.Date);
      const owner = toOwner(row.Owner) ?? FinanceOwner.KJALIL;
      const type = inferType(row);
      const status = toStatus(row, sheetName);
      const specialType = type === FinanceTransactionType.SPECIAL ? inferSpecialType(row) : null;
      const rawMessage = row.Raw_Message || `Importado desde ${sheetName}`;
      const description = row.Description || row.Category || "Movimiento importado";
      const amount = toAmount(row.Amount);
      const currency = row.Currency || "MXN";
      const counterpartyName = inferCounterparty(row);

      if (!amount) continue;

      await prisma.financeTransaction.create({
        data: {
          date,
          type,
          owner,
          category: String(row.Category || "otros"),
          amount: amount.toFixed(2),
          currency: String(currency),
          description: String(description),
          rawMessage: String(rawMessage),
          alias: row.Alias ? String(row.Alias) : null,
          memoryNote: row.Memory_Note ? String(row.Memory_Note) : null,
          confidence: Number(row.Confidence || 1).toFixed(3),
          status,
          specialType,
          counterpartyName,
          sourceChannel: FinanceSourceChannel.IMPORT,
          reportPeriodKey: getPeriodKey(date),
          telegramChatId: row.Chat_ID ? String(row.Chat_ID) : null,
          metadata: {
            importSheet: sheetName,
            importRow: rowIndex,
            originalStatus: row.Status,
            pendingStatus: row.Pending_Status || null,
            originalOwner: row.Owner,
            originalType: row.Type,
            originalCategory: row.Category,
            originalAmount: row.Amount,
            originalCurrency: row.Currency,
            originalDescription: row.Description
          }
        }
      });

      imported += 1;
    }
  }

  return imported;
}

async function importMemoryRules(workbook) {
  await prisma.financeMemoryRule.deleteMany({
    where: { source: FinanceSourceChannel.IMPORT }
  });

  const rows = sheetObjects(workbook, "memory_rules");
  let imported = 0;

  for (const row of rows) {
    const alias = String(row.Alias || "").trim();
    if (!alias) continue;

    await prisma.financeMemoryRule.create({
      data: {
        alias,
        category: String(row.Category || "otros"),
        type: normalizeLower(row.Type) === "income" ? FinanceTransactionType.INCOME : FinanceTransactionType.EXPENSE,
        notes: row.Notes ? String(row.Notes) : null,
        source: FinanceSourceChannel.IMPORT
      }
    });

    imported += 1;
  }

  return imported;
}

async function main() {
  const workbook = XLSX.readFile(workbookPath, { cellDates: true });
  const importedTransactions = await importTransactions(workbook);
  const importedRules = await importMemoryRules(workbook);

  console.log(
    JSON.stringify(
      {
        workbookPath,
        includePending,
        importedTransactions,
        importedRules
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
