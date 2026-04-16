import { FinanceSourceChannel } from "@prisma/client";

import { getFinanceCategories, resolveFinanceCategory } from "@/lib/finance/config";
import { prisma } from "@/lib/prisma";
import { suggestFinanceClassification } from "@/lib/finance/anthropic";
import { parseFinanceCommand } from "@/lib/finance/parser";
import { getCurrentPeriodKey } from "@/lib/finance/period";
import { getFinanceReport } from "@/lib/finance/reports";

function normalizeLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

async function applyMemoryRule(rawMessage: string, parsed: Extract<Awaited<ReturnType<typeof parseFinanceCommand>>, { kind: "transaction" }>) {
  const normalized = normalizeLookup(rawMessage);
  const rules = await prisma.financeMemoryRule.findMany({
    where: {
      isActive: true,
      type: parsed.type,
      OR: [{ owner: null }, { owner: parsed.owner }]
    },
    orderBy: [{ owner: "asc" }, { updatedAt: "desc" }]
  });

  const match = rules.find((rule) => normalized.includes(normalizeLookup(rule.alias)));
  if (!match) return parsed;

  return {
    ...parsed,
    alias: match.alias,
    category: match.category,
    memoryNote: match.notes ?? parsed.memoryNote,
    confidence: parsed.confidence > "0.950" ? parsed.confidence : "0.950"
  };
}

async function applyCategoryCatalog(
  rawMessage: string,
  parsed: Extract<Awaited<ReturnType<typeof parseFinanceCommand>>, { kind: "transaction" }>
) {
  const resolved = await resolveFinanceCategory({
    rawMessage,
    owner: parsed.owner,
    type: parsed.type,
    fallbackCategory: parsed.category
  });

  const numericConfidence = Number(parsed.confidence);
  const nextConfidence = Number.isFinite(numericConfidence)
    ? Math.min(0.999, numericConfidence + resolved.confidenceBoost).toFixed(3)
    : parsed.confidence;

  const needsReviewBecauseUnknown = !resolved.matched && parsed.status === "CONFIRMED" && parsed.type !== "SPECIAL";

  return {
    ...parsed,
    category: resolved.label,
    confidence: nextConfidence,
    status: needsReviewBecauseUnknown ? "NEEDS_REVIEW" : parsed.status,
    memoryNote: resolved.matched
      ? parsed.memoryNote
      : parsed.memoryNote ?? "Categoría fuera del catálogo oficial; revisar o crear categoría."
  };
}

async function applyClaudeSuggestion(rawMessage: string, parsed: Extract<Awaited<ReturnType<typeof parseFinanceCommand>>, { kind: "transaction" }>) {
  if (parsed.status !== "NEEDS_REVIEW" && parsed.confidence >= "0.900") {
    return parsed;
  }

  const memoryRules = await prisma.financeMemoryRule.findMany({
    where: {
      isActive: true,
      OR: [{ owner: null }, { owner: parsed.owner }]
    },
    orderBy: [{ updatedAt: "desc" }]
  });
  const categories = await getFinanceCategories();

  const suggestion = await suggestFinanceClassification({
    rawMessage,
    draft: {
      owner: parsed.owner,
      type: parsed.type,
      category: parsed.category,
      description: parsed.description,
      alias: parsed.alias,
      memoryNote: parsed.memoryNote,
      confidence: parsed.confidence,
      status: parsed.status
    },
    memoryRules: memoryRules.map((rule) => ({
      alias: rule.alias,
      category: rule.category,
      type: rule.type,
      owner: rule.owner,
      notes: rule.notes
    })),
    availableCategories: categories
      .filter((category) => category.owner === null || category.owner === parsed.owner)
      .map((category) => ({
        label: category.label,
        owner: category.owner
      }))
  });

  if (!suggestion?.owner || !suggestion?.type || !suggestion?.category) {
    return parsed;
  }

  return {
    ...parsed,
    owner: suggestion.owner,
    type: suggestion.type,
    category: suggestion.category,
    description: suggestion.description || parsed.description,
    alias: suggestion.alias || parsed.alias,
    memoryNote: suggestion.memoryNote || parsed.memoryNote,
    confidence: suggestion.confidence || parsed.confidence,
    status: suggestion.status || parsed.status
  };
}

export async function handleFinanceMessage(input: { rawMessage: string; chatId: string; telegramMessageId?: string }) {
  const parsed = parseFinanceCommand(input.rawMessage);

  await prisma.financeTelegramChat.upsert({
    where: { chatId: input.chatId },
    update: { lastSeenAt: new Date() },
    create: {
      chatId: input.chatId,
      lastSeenAt: new Date()
    }
  });

  if (parsed.kind === "report") {
    const report = await getFinanceReport({
      owner: parsed.owner,
      periodKey: parsed.periodKey,
      historical: parsed.historical
    });

    return {
      kind: "report" as const,
      report
    };
  }

  if (parsed.kind === "help") {
    return {
      kind: "help" as const,
      message: parsed.message
    };
  }

  const memoryEnriched = await applyMemoryRule(input.rawMessage, parsed);
  const catalogEnriched = await applyCategoryCatalog(input.rawMessage, memoryEnriched);
  const aiEnriched = await applyClaudeSuggestion(input.rawMessage, catalogEnriched);
  const enriched = await applyCategoryCatalog(input.rawMessage, aiEnriched);

  const transaction = await prisma.financeTransaction.create({
    data: {
      date: enriched.date,
      type: enriched.type,
      owner: enriched.owner,
      category: enriched.category,
      amount: enriched.amount,
      currency: enriched.currency,
      description: enriched.description,
      rawMessage: enriched.rawMessage,
      alias: enriched.alias,
      memoryNote: enriched.memoryNote,
      confidence: enriched.confidence,
      status: enriched.status,
      specialType: enriched.specialType,
      counterpartyName: enriched.counterpartyName,
      sourceChannel: FinanceSourceChannel.TELEGRAM,
      reportPeriodKey: getCurrentPeriodKey(enriched.date),
      telegramChatId: input.chatId,
      telegramMessageId: input.telegramMessageId
    }
  });

  return {
    kind: "transaction" as const,
    transaction
  };
}
