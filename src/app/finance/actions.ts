"use server";

import {
  FinanceCategoryDirection,
  FinanceOwner,
  FinanceSourceChannel,
  FinanceSpecialType,
  FinanceTransactionStatus,
  FinanceTransactionType
} from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireStaffSession } from "@/lib/auth-guard";
import { normalizeCategorySlug } from "@/lib/finance/config";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriodKey } from "@/lib/finance/period";

const ownerSchema = z.nativeEnum(FinanceOwner);
const ownerNullableSchema = z.nativeEnum(FinanceOwner).nullable();
const categoryDirectionSchema = z.nativeEnum(FinanceCategoryDirection);
const typeSchema = z.nativeEnum(FinanceTransactionType);
const statusSchema = z.nativeEnum(FinanceTransactionStatus);
const specialTypeSchema = z.nativeEnum(FinanceSpecialType).nullable();

function parseDecimal(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "")
    .replace(/,/g, "")
    .trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value: FormDataEntryValue | null) {
  const input = String(value ?? "").trim();
  if (!input) return new Date();
  const date = new Date(`${input}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getReturnTo(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "/finance");
  return returnTo.startsWith("/finance") ? returnTo : "/finance";
}

function normalizeOptional(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
}

export async function createFinanceTransactionAction(formData: FormData) {
  await requireStaffSession("/finance");

  const date = parseDate(formData.get("date"));
  const owner = ownerSchema.parse(formData.get("owner"));
  const type = typeSchema.parse(formData.get("type"));
  const category = String(formData.get("category") ?? "").trim() || "otros";
  const description = String(formData.get("description") ?? "").trim() || "Movimiento desde dashboard";
  const amount = parseDecimal(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "MXN").trim() || "MXN";
  const rawMessage = String(formData.get("rawMessage") ?? description).trim() || description;
  const status = statusSchema.parse(formData.get("status") ?? FinanceTransactionStatus.CONFIRMED);
  const specialType =
    type === FinanceTransactionType.SPECIAL
      ? specialTypeSchema.parse(normalizeOptional(formData.get("specialType")))
      : null;

  if (!amount) {
    redirect(getReturnTo(formData));
  }

  await prisma.financeTransaction.create({
    data: {
      date,
      owner,
      type,
      category,
      amount: amount.toFixed(2),
      currency,
      description,
      rawMessage,
      alias: normalizeOptional(formData.get("alias")),
      memoryNote: normalizeOptional(formData.get("memoryNote")),
      confidence: "1.000",
      status,
      specialType,
      counterpartyName: normalizeOptional(formData.get("counterpartyName")),
      sourceChannel: FinanceSourceChannel.DASHBOARD,
      reportPeriodKey: getCurrentPeriodKey(date)
    }
  });

  redirect(getReturnTo(formData));
}

export async function updateFinanceTransactionAction(formData: FormData) {
  await requireStaffSession("/finance");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect(getReturnTo(formData));

  const date = parseDate(formData.get("date"));
  const owner = ownerSchema.parse(formData.get("owner"));
  const type = typeSchema.parse(formData.get("type"));
  const status = statusSchema.parse(formData.get("status"));
  const category = String(formData.get("category") ?? "").trim() || "otros";
  const description = String(formData.get("description") ?? "").trim() || "Movimiento";
  const amount = parseDecimal(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "MXN").trim() || "MXN";
  const specialType =
    type === FinanceTransactionType.SPECIAL
      ? specialTypeSchema.parse(normalizeOptional(formData.get("specialType")))
      : null;

  await prisma.financeTransaction.update({
    where: { id },
    data: {
      date,
      owner,
      type,
      status,
      category,
      description,
      amount: amount.toFixed(2),
      currency,
      rawMessage: String(formData.get("rawMessage") ?? description).trim() || description,
      alias: normalizeOptional(formData.get("alias")),
      memoryNote: normalizeOptional(formData.get("memoryNote")),
      counterpartyName: normalizeOptional(formData.get("counterpartyName")),
      specialType,
      reportPeriodKey: getCurrentPeriodKey(date)
    }
  });

  redirect(getReturnTo(formData));
}

export async function bulkUpdateFinanceTransactionsAction(formData: FormData) {
  await requireStaffSession("/finance");

  const ids = formData.getAll("ids").map((value) => String(value).trim());
  const descriptions = formData.getAll("descriptions").map((value) => String(value).trim());
  const categories = formData.getAll("categories").map((value) => String(value).trim());

  const updates = ids
    .map((id, index) => ({
      id,
      description: descriptions[index] || "Movimiento",
      category: categories[index] || "otros"
    }))
    .filter((item) => item.id);

  if (!updates.length) {
    redirect(getReturnTo(formData));
  }

  await prisma.$transaction(
    updates.map((item) =>
      prisma.financeTransaction.update({
        where: { id: item.id },
        data: {
          description: item.description,
          category: item.category
        }
      })
    )
  );

  redirect(getReturnTo(formData));
}

export async function confirmFinanceTransactionAction(formData: FormData) {
  await requireStaffSession("/finance");

  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await prisma.financeTransaction.update({
      where: { id },
      data: { status: FinanceTransactionStatus.CONFIRMED }
    });
  }

  redirect(getReturnTo(formData));
}

export async function deleteFinanceTransactionAction(formData: FormData) {
  await requireStaffSession("/finance");

  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await prisma.financeTransaction.delete({
      where: { id }
    });
  }

  redirect(getReturnTo(formData));
}

export async function createFinanceCategoryAction(formData: FormData) {
  await requireStaffSession("/finance");

  const label = String(formData.get("label") ?? "").trim();
  if (!label) redirect(getReturnTo(formData));

  const direction = categoryDirectionSchema.parse(formData.get("direction"));
  const owner = ownerNullableSchema.parse(normalizeOptional(formData.get("owner")));
  const providedSlug = normalizeOptional(formData.get("slug"));
  const slug = normalizeCategorySlug(providedSlug ?? label);

  await prisma.financeCategory.upsert({
    where: { slug },
    update: {
      label,
      direction,
      owner,
      description: normalizeOptional(formData.get("description")),
      color: normalizeOptional(formData.get("color")),
      icon: normalizeOptional(formData.get("icon")),
      sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
      isActive: String(formData.get("isActive") ?? "true") !== "false"
    },
    create: {
      slug,
      label,
      direction,
      owner,
      description: normalizeOptional(formData.get("description")),
      color: normalizeOptional(formData.get("color")),
      icon: normalizeOptional(formData.get("icon")),
      sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
      isActive: String(formData.get("isActive") ?? "true") !== "false"
    }
  });

  redirect(getReturnTo(formData));
}

export async function updateFinanceCategoryAction(formData: FormData) {
  await requireStaffSession("/finance");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect(getReturnTo(formData));

  const label = String(formData.get("label") ?? "").trim();
  const direction = categoryDirectionSchema.parse(formData.get("direction"));
  const owner = ownerNullableSchema.parse(normalizeOptional(formData.get("owner")));
  const providedSlug = normalizeOptional(formData.get("slug"));
  const slug = normalizeCategorySlug(providedSlug ?? label);

  await prisma.financeCategory.update({
    where: { id },
    data: {
      slug,
      label,
      direction,
      owner,
      description: normalizeOptional(formData.get("description")),
      color: normalizeOptional(formData.get("color")),
      icon: normalizeOptional(formData.get("icon")),
      sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
      isActive: String(formData.get("isActive") ?? "true") !== "false"
    }
  });

  redirect(getReturnTo(formData));
}

export async function updateFinanceTelegramTemplatesAction(formData: FormData) {
  await requireStaffSession("/finance");

  await prisma.financeBotSettings.upsert({
    where: { id: "default" },
    update: {
      transactionDefaultTemplate: String(formData.get("transactionDefaultTemplate") ?? "").trim(),
      transactionLakjaExpenseTemplate: String(formData.get("transactionLakjaExpenseTemplate") ?? "").trim(),
      transactionHonorariosKjalilTemplate: String(formData.get("transactionHonorariosKjalilTemplate") ?? "").trim(),
      transactionHonorariosTercerosTemplate: String(formData.get("transactionHonorariosTercerosTemplate") ?? "").trim(),
      reportHeaderTemplate: String(formData.get("reportHeaderTemplate") ?? "").trim(),
      reportFooterTemplate: normalizeOptional(formData.get("reportFooterTemplate"))
    },
    create: {
      id: "default",
      transactionDefaultTemplate: String(formData.get("transactionDefaultTemplate") ?? "").trim(),
      transactionLakjaExpenseTemplate: String(formData.get("transactionLakjaExpenseTemplate") ?? "").trim(),
      transactionHonorariosKjalilTemplate: String(formData.get("transactionHonorariosKjalilTemplate") ?? "").trim(),
      transactionHonorariosTercerosTemplate: String(formData.get("transactionHonorariosTercerosTemplate") ?? "").trim(),
      reportHeaderTemplate: String(formData.get("reportHeaderTemplate") ?? "").trim(),
      reportFooterTemplate: normalizeOptional(formData.get("reportFooterTemplate"))
    }
  });

  redirect(getReturnTo(formData));
}

export async function mergeFinanceCategoryAction(formData: FormData) {
  await requireStaffSession("/finance");

  const fromCategory = String(formData.get("fromCategory") ?? "").trim();
  const toCategory = String(formData.get("toCategory") ?? "").trim();

  if (!fromCategory || !toCategory || fromCategory === toCategory) {
    redirect(getReturnTo(formData));
  }

  await prisma.$transaction([
    prisma.financeTransaction.updateMany({
      where: { category: fromCategory },
      data: { category: toCategory }
    }),
    prisma.financeMemoryRule.updateMany({
      where: { category: fromCategory },
      data: { category: toCategory }
    }),
    prisma.financeCategory.updateMany({
      where: { label: fromCategory },
      data: { isActive: false }
    })
  ]);

  redirect(getReturnTo(formData));
}
