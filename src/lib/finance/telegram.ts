import { FinanceOwner, FinanceTransactionType } from "@prisma/client";

import { financeOwnerLabels } from "@/lib/finance/constants";
import { getFinanceBotSettings, renderFinanceTemplate } from "@/lib/finance/config";

function getTelegramApiBase() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("Falta configurar TELEGRAM_BOT_TOKEN.");
  }

  return `https://api.telegram.org/bot${token}`;
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const response = await fetch(`${getTelegramApiBase()}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram devolvió ${response.status}.`);
  }
}

export async function buildTransactionConfirmation(input: { owner: FinanceOwner; type: FinanceTransactionType; amount: string; description: string }) {
  const settings = await getFinanceBotSettings();
  const values = {
    amount: input.amount,
    description: input.description || financeOwnerLabels[input.owner],
    ownerLabel: financeOwnerLabels[input.owner]
  };

  if (input.type === FinanceTransactionType.HONORARIOS_KJALIL) {
    return renderFinanceTemplate(settings.transactionHonorariosKjalilTemplate, values);
  }

  if (input.type === FinanceTransactionType.HONORARIOS_TERCEROS) {
    return renderFinanceTemplate(settings.transactionHonorariosTercerosTemplate, values);
  }

  if (input.type === FinanceTransactionType.EXPENSE && input.owner === FinanceOwner.LAKJA) {
    return renderFinanceTemplate(settings.transactionLakjaExpenseTemplate, values);
  }

  return renderFinanceTemplate(settings.transactionDefaultTemplate, values);
}

export async function buildReportTelegramMessage(report: Awaited<ReturnType<typeof import("./reports").getFinanceReport>>) {
  const settings = await getFinanceBotSettings();
  const header = renderFinanceTemplate(settings.reportHeaderTemplate, {
    ownerLabel: report.ownerLabel,
    periodLabel: report.periodLabel
  });
  const lines = [header, `Movimientos: ${report.totals.totalTransactions}`];

  if (!report.owner || report.owner === FinanceOwner.LAKJA) {
    lines.push(`Ingresos LaKja: ${report.totals.lakjaIncome.toFixed(2)} MXN`);
    lines.push(`Gasto operativo LaKja: ${report.totals.lakjaOperationalExpense.toFixed(2)} MXN`);
    lines.push(`Honorarios Kjalil: ${report.totals.lakjaHonorariosKjalil.toFixed(2)} MXN`);
    lines.push(`Honorarios terceros: ${report.totals.lakjaHonorariosTerceros.toFixed(2)} MXN`);
    lines.push(`Balance LaKja: ${report.totals.lakjaBalance.toFixed(2)} MXN`);
  }

  if (!report.owner || report.owner === FinanceOwner.KJALIL) {
    lines.push(`Gasto Kjalil: ${report.totals.kjalilExpense.toFixed(2)} MXN`);
  }

  if (!report.owner || report.owner === FinanceOwner.KK) {
    lines.push(`Gasto K&K: ${report.totals.kkExpense.toFixed(2)} MXN`);
  }

  lines.push(`Especiales: ${report.totals.special.toFixed(2)} MXN`);
  if (report.totals.needsReview > 0) {
    lines.push(`Revisar: ${report.totals.needsReview}`);
  }

  if (settings.reportFooterTemplate?.trim()) {
    lines.push(renderFinanceTemplate(settings.reportFooterTemplate, { ownerLabel: report.ownerLabel, periodLabel: report.periodLabel }));
  }

  return lines.join("\n");
}
