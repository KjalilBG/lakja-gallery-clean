import { FinanceOwner, FinanceTransactionStatus, FinanceTransactionType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { financeOwnerLabels } from "@/lib/finance/constants";
import { formatPeriodLabel, getCurrentPeriodKey, getPeriodDateRange } from "@/lib/finance/period";

type FinanceReportScope = "general" | "owner";

function toNumber(value: Prisma.Decimal | number) {
  return Number(value);
}

function sumAmounts(rows: Array<{ amount: Prisma.Decimal }>) {
  return rows.reduce((total, row) => total + toNumber(row.amount), 0);
}

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function buildWhere(periodKey?: string, owner?: FinanceOwner): Prisma.FinanceTransactionWhereInput {
  if (!periodKey && !owner) return {};

  return {
    ...(owner ? { owner } : {}),
    ...(periodKey ? (() => {
      const { start, end } = getPeriodDateRange(periodKey);
      return { date: { gte: start, lt: end } };
    })() : {})
  };
}

function buildCategoryRollup(rows: Array<{ category: string; amount: Prisma.Decimal; description?: string }>) {
  const bucket = new Map<string, { label: string; amount: number; details: Array<{ description: string; amount: number }> }>();

  for (const row of rows) {
    const normalized = normalizeLabel(row.category);
    const current = bucket.get(normalized);
    const nextAmount = (current?.amount ?? 0) + toNumber(row.amount);
    const details = current?.details ?? [];

    if (row.description?.trim()) {
      details.push({
        description: row.description.trim(),
        amount: toNumber(row.amount)
      });
    }

    bucket.set(normalized, {
      label: current?.label ?? row.category,
      amount: nextAmount,
      details
    });
  }

  return Array.from(bucket.values())
    .map((item) => ({
      ...item,
      details: item.details.sort((a, b) => b.amount - a.amount).slice(0, 5)
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
}

function buildLabelRollup(rows: Array<{ label: string; amount: Prisma.Decimal | number; description?: string }>) {
  const bucket = new Map<string, { label: string; amount: number; details: Array<{ description: string; amount: number }> }>();

  for (const row of rows) {
    const normalized = normalizeLabel(row.label);
    const current = bucket.get(normalized);
    const nextAmount = (current?.amount ?? 0) + toNumber(row.amount);
    const details = current?.details ?? [];

    if (row.description?.trim()) {
      details.push({
        description: row.description.trim(),
        amount: toNumber(row.amount)
      });
    }

    bucket.set(normalized, {
      label: current?.label ?? row.label,
      amount: nextAmount,
      details
    });
  }

  return Array.from(bucket.values())
    .map((item) => ({
      ...item,
      details: item.details.sort((a, b) => b.amount - a.amount).slice(0, 5)
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
}

function buildMonthlyTrend(rows: Array<{ date: Date; amount: Prisma.Decimal; owner: FinanceOwner; type: FinanceTransactionType }>) {
  const months = new Map<
    string,
    { periodKey: string; incomeLakja: number; expenseLakja: number; expenseKjalil: number; expenseKK: number; special: number }
  >();

  for (const row of rows) {
    const periodKey = `${row.date.getUTCFullYear()}-${String(row.date.getUTCMonth() + 1).padStart(2, "0")}`;
    const current =
      months.get(periodKey) ??
      { periodKey, incomeLakja: 0, expenseLakja: 0, expenseKjalil: 0, expenseKK: 0, special: 0 };
    const amount = toNumber(row.amount);

    if (row.owner === FinanceOwner.LAKJA && row.type === FinanceTransactionType.INCOME) current.incomeLakja += amount;
    if (row.owner === FinanceOwner.LAKJA && row.type === FinanceTransactionType.EXPENSE) current.expenseLakja += amount;
    if (row.owner === FinanceOwner.KJALIL && row.type === FinanceTransactionType.EXPENSE) current.expenseKjalil += amount;
    if (row.owner === FinanceOwner.KK && row.type === FinanceTransactionType.EXPENSE) current.expenseKK += amount;
    if (row.type === FinanceTransactionType.SPECIAL) current.special += amount;

    months.set(periodKey, current);
  }

  return Array.from(months.values()).sort((a, b) => a.periodKey.localeCompare(b.periodKey)).slice(-6);
}

export async function getFinanceReport(input?: { periodKey?: string; owner?: FinanceOwner; historical?: boolean }) {
  const scope: FinanceReportScope = input?.owner ? "owner" : "general";
  const periodKey = input?.historical ? undefined : input?.periodKey ?? getCurrentPeriodKey();
  const where = buildWhere(periodKey, input?.owner);

  const transactions = await prisma.financeTransaction.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });

  const confirmedTransactions = transactions.filter((item) => item.status === FinanceTransactionStatus.CONFIRMED);
  const reviewTransactions = transactions.filter((item) => item.status === FinanceTransactionStatus.NEEDS_REVIEW);

  const lakjaTransactions = confirmedTransactions.filter((item) => item.owner === FinanceOwner.LAKJA);
  const kjalilTransactions = confirmedTransactions.filter((item) => item.owner === FinanceOwner.KJALIL);
  const kkTransactions = confirmedTransactions.filter((item) => item.owner === FinanceOwner.KK);
  const specialTransactions = confirmedTransactions.filter((item) => item.type === FinanceTransactionType.SPECIAL);

  const lakjaIncome = lakjaTransactions.filter((item) => item.type === FinanceTransactionType.INCOME);
  const lakjaExpense = lakjaTransactions.filter((item) => item.type === FinanceTransactionType.EXPENSE);
  const lakjaHonorariosKjalil = lakjaTransactions.filter((item) => item.type === FinanceTransactionType.HONORARIOS_KJALIL);
  const lakjaHonorariosTerceros = lakjaTransactions.filter((item) => item.type === FinanceTransactionType.HONORARIOS_TERCEROS);

  const topCategories = buildCategoryRollup(confirmedTransactions);

  const topCounterparties = Object.entries(
    lakjaTransactions.reduce<Record<string, number>>((acc, item) => {
      if (!item.counterpartyName) return acc;
      acc[item.counterpartyName] = (acc[item.counterpartyName] ?? 0) + toNumber(item.amount);
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  const topIncomeSources = Object.entries(
    lakjaIncome.reduce<Record<string, number>>((acc, item) => {
      const key = item.counterpartyName || item.description || item.category;
      acc[key] = (acc[key] ?? 0) + toNumber(item.amount);
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, amount]) => ({ label, amount }));

  const lakjaIncomeCategories = buildCategoryRollup(lakjaIncome);
  const lakjaExpenseCategories = buildLabelRollup([
    ...lakjaExpense.map((item) => ({ label: item.category, amount: item.amount, description: item.description })),
    ...lakjaHonorariosKjalil.map((item) => ({ label: "Honorarios Kjalil", amount: item.amount, description: item.description })),
    ...lakjaHonorariosTerceros.map((item) => ({ label: "Honorarios terceros", amount: item.amount, description: item.description }))
  ]);

  const response = {
    scope,
    owner: input?.owner ?? null,
    ownerLabel: input?.owner ? financeOwnerLabels[input.owner] : "General",
    periodKey: periodKey ?? "historico",
    periodLabel: periodKey ? formatPeriodLabel(periodKey) : "histórico completo",
    totals: {
      totalTransactions: confirmedTransactions.length,
      lakjaIncome: sumAmounts(lakjaIncome),
      lakjaOperationalExpense: sumAmounts(lakjaExpense),
      lakjaHonorariosKjalil: sumAmounts(lakjaHonorariosKjalil),
      lakjaHonorariosTerceros: sumAmounts(lakjaHonorariosTerceros),
      lakjaBalance:
        sumAmounts(lakjaIncome) -
        sumAmounts(lakjaExpense) -
        sumAmounts(lakjaHonorariosKjalil) -
        sumAmounts(lakjaHonorariosTerceros),
      kjalilExpense: sumAmounts(kjalilTransactions.filter((item) => item.type === FinanceTransactionType.EXPENSE)),
      kkExpense: sumAmounts(kkTransactions.filter((item) => item.type === FinanceTransactionType.EXPENSE)),
      special: sumAmounts(specialTransactions),
      needsReview: reviewTransactions.length
    },
    sections: {
      lakja: {
        ingresos: lakjaIncome,
        gastoOperativo: lakjaExpense,
        honorariosKjalil: lakjaHonorariosKjalil,
        honorariosTerceros: lakjaHonorariosTerceros,
        proveedoresPrincipales: topCounterparties
      },
      kjalil: {
        gastos: kjalilTransactions.filter((item) => item.type === FinanceTransactionType.EXPENSE),
        especiales: kjalilTransactions.filter((item) => item.type === FinanceTransactionType.SPECIAL)
      },
      kk: {
        gastos: kkTransactions.filter((item) => item.type === FinanceTransactionType.EXPENSE),
        especiales: kkTransactions.filter((item) => item.type === FinanceTransactionType.SPECIAL)
      },
      especiales: specialTransactions
    },
    insights: {
      topCategories,
      monthlyTrend: buildMonthlyTrend(confirmedTransactions),
      topIncomeSources,
      lakjaIncomeCategories,
      lakjaExpenseCategories,
      classificationHealth:
        confirmedTransactions.length === 0 && reviewTransactions.length === 0
          ? "Sin movimientos aún."
          : reviewTransactions.length > 0
            ? "Hay movimientos que conviene revisar manualmente."
            : "La clasificación del periodo se ve consistente."
    },
    transactions,
    reviewTransactions
  };

  return response;
}

export async function getFinancePeriods() {
  const rows = await prisma.financeTransaction.findMany({
    select: { reportPeriodKey: true },
    distinct: ["reportPeriodKey"],
    orderBy: { reportPeriodKey: "desc" }
  });

  return rows
    .map((row) => row.reportPeriodKey)
    .filter((value): value is string => Boolean(value));
}
