import { FinanceOwner, FinanceSpecialType, FinanceTransactionStatus, FinanceTransactionType } from "@prisma/client";

import { parseSpanishMonthPeriod, getCurrentPeriodKey } from "@/lib/finance/period";

export type ParsedFinanceCommand =
  | {
      kind: "report";
      owner?: FinanceOwner;
      periodKey?: string;
      historical: boolean;
      rawMessage: string;
    }
  | {
      kind: "help";
      rawMessage: string;
      message: string;
    }
  | {
      kind: "transaction";
      rawMessage: string;
      date: Date;
      type: FinanceTransactionType;
      owner: FinanceOwner;
      category: string;
      amount: string;
      currency: string;
      description: string;
      alias?: string;
      memoryNote?: string;
      confidence: string;
      status: FinanceTransactionStatus;
      specialType?: FinanceSpecialType;
      counterpartyName?: string;
    };

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLower(value: string) {
  return normalizeText(value).toLowerCase();
}

function containsAny(normalized: string, phrases: string[]) {
  return phrases.some((phrase) => normalized.includes(normalizeLower(phrase)));
}

function detectOwner(normalized: string) {
  if (normalized.includes("k&k") || normalized.includes("k y k") || normalized.includes("kk")) {
    return FinanceOwner.KK;
  }

  if (normalized.includes("lakja") || normalized.includes("la kja")) {
    return FinanceOwner.LAKJA;
  }

  if (normalized.includes("kjalil")) {
    return FinanceOwner.KJALIL;
  }

  return null;
}

function extractAmount(rawMessage: string) {
  const match = rawMessage.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
  return match ? match[1] : null;
}

function cleanDescription(rawMessage: string, owner: FinanceOwner, amount: string) {
  return rawMessage
    .replace(new RegExp(amount.replace(".", "\\."), "g"), "")
    .replace(/lakja/gi, "")
    .replace(/kjalil/gi, "")
    .replace(/k&k/gi, "")
    .replace(/k y k/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCounterparty(normalized: string) {
  const honorariosMatch = normalized.match(/honorarios a ([a-z0-9 ]+)/i);
  if (honorariosMatch?.[1]) {
    return honorariosMatch[1].trim().replace(/\b(lakja|kjalil|k&k|kk)\b/gi, "").trim();
  }

  const devolvioMatch = normalized.match(/^([a-z0-9 ]+?) me devolvio\b/i);
  if (devolvioMatch?.[1]) {
    return devolvioMatch[1].trim();
  }

  return undefined;
}

function extractHonorariosCounterparty(normalized: string) {
  const patterns = [
    /honorarios a ([a-z0-9 ]+?)(?=\s+\d|\s+mxn|\s+lakja|\s+la kja|\s+kjalil|\s+k&k|\s+kk|$)/i,
    /(?:pague|pague|pago|registre|registre|registro|registr[eé]|deposit[eé]|deposite|di|dimos)?\s*honorarios\s+([a-z0-9 ]+?)(?=\s+\d|\s+mxn|\s+lakja|\s+la kja|\s+kjalil|\s+k&k|\s+kk|$)/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const candidate = match?.[1]
      ?.replace(/\b(a|de|para|honorarios)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (candidate) {
      return candidate;
    }
  }

  return undefined;
}

function isSelfHonorarios(normalized: string) {
  if (!normalized.includes("honorarios")) return false;

  return containsAny(normalized, [
    "me pague",
    "me pagué",
    "retiro de honorarios",
    "retire honorarios",
    "retiré honorarios",
    "honorarios kjalil",
    "para mi",
    "para mí",
    "a kjalil"
  ]);
}

export function parseFinanceCommand(rawMessage: string): ParsedFinanceCommand {
  const normalized = normalizeLower(rawMessage);

  if (!normalized) {
    return {
      kind: "help",
      rawMessage,
      message: "Escríbeme algo como: `Gaste 300 en super K&K`, `Me pague 15000 de honorarios LaKja` o `report LaKja`."
    };
  }

  if (normalized.startsWith("report")) {
    const tail = normalized.replace(/^report\s*/, "").trim();
    if (!tail) {
      return { kind: "report", periodKey: getCurrentPeriodKey(), historical: false, rawMessage };
    }

    if (tail === "general") {
      return { kind: "report", historical: true, rawMessage };
    }

    const owner = detectOwner(tail);
    if (owner) {
      return {
        kind: "report",
        owner,
        periodKey: getCurrentPeriodKey(),
        historical: false,
        rawMessage
      };
    }

    const periodKey = parseSpanishMonthPeriod(tail);
    if (periodKey) {
      return { kind: "report", periodKey, historical: false, rawMessage };
    }

    return {
      kind: "help",
      rawMessage,
      message: "No entendí ese reporte. Usa `report`, `report general`, `report LaKja`, `report K&K` o `report enero 2026`."
    };
  }

  const owner = detectOwner(normalized);
  if (!owner) {
    return {
      kind: "help",
      rawMessage,
      message: "Necesito que indiques bolsa: `LaKja`, `Kjalil` o `K&K`."
    };
  }

  const amount = extractAmount(rawMessage);
  if (!amount) {
    return {
      kind: "help",
      rawMessage,
      message: "No encontré monto. Ejemplo: `Gaste 250 K&K desayuno`."
    };
  }

  const counterpartyName = extractCounterparty(normalized);
  const description = cleanDescription(rawMessage, owner, amount);

  if (normalized.includes("honorarios") && isSelfHonorarios(normalized)) {
    return {
      kind: "transaction",
      rawMessage,
      date: new Date(),
      type: FinanceTransactionType.HONORARIOS_KJALIL,
      owner: FinanceOwner.LAKJA,
      category: "honorarios_kjalil",
      amount,
      currency: "MXN",
      description,
      alias: "honorarios_kjalil",
      confidence: "0.980",
      status: FinanceTransactionStatus.CONFIRMED,
      counterpartyName: "Kjalil"
    };
  }

  if (normalized.includes("honorarios")) {
    const thirdParty = extractHonorariosCounterparty(normalized) ?? counterpartyName;
    return {
      kind: "transaction",
      rawMessage,
      date: new Date(),
      type: FinanceTransactionType.HONORARIOS_TERCEROS,
      owner: FinanceOwner.LAKJA,
      category: "honorarios_terceros",
      amount,
      currency: "MXN",
      description: cleanDescription(rawMessage, FinanceOwner.LAKJA, amount),
      alias: "honorarios_terceros",
      confidence: thirdParty ? "0.975" : "0.930",
      status: FinanceTransactionStatus.CONFIRMED,
      counterpartyName: thirdParty
    };
  }

  if (/\b(me devolvio|reembolso|reembolsaron|transferencia|transferi|transferi a|prestamo|ajuste)\b/i.test(normalized)) {
    let specialType: FinanceSpecialType = FinanceSpecialType.OTRO;
    let alias = "movimiento_especial";

    if (normalized.includes("me devolvio") || normalized.includes("reembolso") || normalized.includes("reembolsaron")) {
      specialType = FinanceSpecialType.REEMBOLSO;
      alias = "reembolso";
    } else if (normalized.includes("transfer")) {
      specialType = FinanceSpecialType.TRANSFERENCIA;
      alias = "transferencia";
    } else if (normalized.includes("prestamo")) {
      specialType = normalized.includes("recuper") ? FinanceSpecialType.PRESTAMO_RECUPERADO : FinanceSpecialType.PRESTAMO_DADO;
      alias = specialType === FinanceSpecialType.PRESTAMO_RECUPERADO ? "prestamo_recuperado" : "prestamo_dado";
    } else if (normalized.includes("ajuste")) {
      specialType = FinanceSpecialType.AJUSTE;
      alias = "ajuste";
    }

    return {
      kind: "transaction",
      rawMessage,
      date: new Date(),
      type: FinanceTransactionType.SPECIAL,
      owner,
      category: alias,
      amount,
      currency: "MXN",
      description,
      alias,
      confidence: "0.900",
      status: FinanceTransactionStatus.CONFIRMED,
      specialType,
      counterpartyName
    };
  }

  if (/\b(cobre|cobro|me pagaron|ingreso|venta|vendi|vendimos|entraron)\b/i.test(normalized)) {
    return {
      kind: "transaction",
      rawMessage,
      date: new Date(),
      type: FinanceTransactionType.INCOME,
      owner,
      category: owner === FinanceOwner.LAKJA ? "ingreso_operativo" : "ingreso_no_operativo",
      amount,
      currency: "MXN",
      description,
      alias: owner === FinanceOwner.LAKJA ? "ingreso_operativo" : "ingreso_no_operativo",
      confidence: owner === FinanceOwner.LAKJA ? "0.920" : "0.650",
      status: owner === FinanceOwner.LAKJA ? FinanceTransactionStatus.CONFIRMED : FinanceTransactionStatus.NEEDS_REVIEW,
      memoryNote: owner === FinanceOwner.LAKJA ? undefined : "Los ingresos operativos válidos deben quedarse en LaKja."
    };
  }

  if (/\b(gaste|pague|pagu[eé]|compre|compre|pago)\b/i.test(normalized)) {
    const isLakja = owner === FinanceOwner.LAKJA;
    return {
      kind: "transaction",
      rawMessage,
      date: new Date(),
      type: FinanceTransactionType.EXPENSE,
      owner,
      category: isLakja ? "gasto_operativo" : "gasto_general",
      amount,
      currency: "MXN",
      description,
      alias: isLakja ? "gasto_operativo" : "gasto_general",
      confidence: "0.890",
      status: FinanceTransactionStatus.CONFIRMED
    };
  }

  return {
    kind: "transaction",
    rawMessage,
    date: new Date(),
    type: FinanceTransactionType.SPECIAL,
    owner,
    category: "movimiento_por_revisar",
    amount,
    currency: "MXN",
    description,
    alias: "movimiento_por_revisar",
    confidence: "0.550",
    status: FinanceTransactionStatus.NEEDS_REVIEW,
    specialType: FinanceSpecialType.OTRO,
    memoryNote: "No cayó en una regla fuerte; revisar clasificación."
  };
}
