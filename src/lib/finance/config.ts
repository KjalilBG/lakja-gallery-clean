import { FinanceCategoryDirection, FinanceOwner, FinanceTransactionType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const financeCategorySynonyms: Record<string, string[]> = {
  carros: ["gasolina", "gas", "caseta", "casetas", "estacionamiento", "lavado", "auto", "coche", "carro"],
  casa: ["cfe", "megacable", "internet", "limpieza", "clarita", "hogar", "toallitas", "papel bano", "papel de bano"],
  comida: ["desayuno", "cena", "almuerzo", "queso", "quesito", "pollo", "pizza", "restaurante", "cafennio", "cafecito"],
  supermercado: ["super", "walmart", "costco", "cotsco", "soriana", "chedraui", "aurrera", "despensa", "mercado"],
  salud: ["medicamento", "medicamentos", "farmacia", "doctor", "medico", "dentista", "nutriologa", "nutrióloga", "masaje", "seguro"],
  viajes: ["uber", "vuelo", "avion", "avión", "bus", "autobus", "autobús", "hotel", "airbnb", "esim"],
  ocio: ["cine", "netflix", "bar", "billar", "concierto", "helado", "esquites", "starbucks", "subway"],
  regalos: ["flores", "regalo", "regalito", "propina boda"],
  herramientas: ["adobe", "canva", "hostinger", "dominio", "tripie", "tripié", "flash", "lente", "filtros uv", "laptop"],
  tecnologia: ["chatgpt", "anthropic", "hostinger", "amazon", "web", "hosting", "software", "app"],
  oficina: ["office depot", "hojas", "opalina", "papeleria", "papelería"],
  marketing: ["facebook", "publicidad", "ads", "meta ads", "anuncio"],
  perritas: ["petco", "nexgard", "perritas", "perrita", "veterinaria"],
  honorarios: ["honorarios", "contador", "contador", "diego", "luis"]
};

export async function getFinanceBotSettings() {
  return prisma.financeBotSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" }
  });
}

export async function getFinanceCategories() {
  return prisma.financeCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }]
  });
}

export function inferDirectionFromType(type: FinanceTransactionType) {
  if (type === FinanceTransactionType.INCOME) return FinanceCategoryDirection.INCOME;
  if (type === FinanceTransactionType.SPECIAL) return FinanceCategoryDirection.SPECIAL;
  return FinanceCategoryDirection.EXPENSE;
}

export function renderFinanceTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => values[key] ?? "");
}

export function normalizeCategorySlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

export function normalizeFinanceLookup(input: string) {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function filterCategoriesForContext(input: {
  categories: Array<{
    direction: FinanceCategoryDirection;
    owner: FinanceOwner | null;
    label: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
  }>;
  owner?: FinanceOwner;
  type?: FinanceTransactionType;
}) {
  const direction = input.type ? inferDirectionFromType(input.type) : null;

  return input.categories.filter((category) => {
    const directionMatch = direction ? category.direction === direction : true;
    const ownerMatch = input.owner ? category.owner === null || category.owner === input.owner : true;
    return directionMatch && ownerMatch;
  });
}

function tokenize(value: string) {
  return normalizeFinanceLookup(value)
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
}

function containsLookupPhrase(haystack: string, needle: string) {
  const normalizedHaystack = ` ${normalizeFinanceLookup(haystack)} `;
  const normalizedNeedle = ` ${normalizeFinanceLookup(needle)} `;
  return normalizedNeedle.trim().length > 0 && normalizedHaystack.includes(normalizedNeedle);
}

function scoreCategoryAgainstText(input: {
  category: { label: string; slug: string; description: string | null; icon: string | null };
  text: string;
}) {
  const haystack = normalizeFinanceLookup(input.text);
  if (!haystack) return 0;

  const label = normalizeFinanceLookup(input.category.label);
  const slug = normalizeFinanceLookup(input.category.slug.replace(/_/g, " "));
  const description = normalizeFinanceLookup(input.category.description ?? "");
  const icon = normalizeFinanceLookup(input.category.icon ?? "");

  let score = 0;

  if (label && containsLookupPhrase(haystack, label)) score += 120;
  if (slug && containsLookupPhrase(haystack, slug)) score += 100;
  if (description && containsLookupPhrase(haystack, description)) score += 50;
  if (icon && containsLookupPhrase(haystack, icon)) score += 35;

  for (const token of tokenize(input.category.label)) {
    if (token.length >= 3 && containsLookupPhrase(haystack, token)) score += 18;
  }

  for (const token of tokenize(input.category.description ?? "")) {
    if (token.length >= 4 && containsLookupPhrase(haystack, token)) score += 10;
  }

  const normalizedLabel = normalizeFinanceLookup(input.category.label);
  const synonymEntry =
    Object.entries(financeCategorySynonyms).find(([key]) => normalizedLabel.includes(key))?.[1] ?? [];

  for (const synonym of synonymEntry) {
    const normalizedSynonym = normalizeFinanceLookup(synonym);
    if (normalizedSynonym && containsLookupPhrase(haystack, normalizedSynonym)) score += 85;
  }

  return score;
}

export async function resolveFinanceCategory(input: {
  rawMessage: string;
  owner: FinanceOwner;
  type: FinanceTransactionType;
  fallbackCategory?: string;
}) {
  const categories = await getFinanceCategories();
  const available = filterCategoriesForContext({
    categories,
    owner: input.owner,
    type: input.type
  });

  if (!available.length) {
    return { label: input.fallbackCategory ?? "otros", matched: false, confidenceBoost: 0 };
  }

  const normalizedFallback = normalizeFinanceLookup(input.fallbackCategory ?? "");
  if (normalizedFallback) {
    const exactFallback = available.find((category) => normalizeFinanceLookup(category.label) === normalizedFallback);
    if (exactFallback) {
      return { label: exactFallback.label, matched: true, confidenceBoost: 0.03 };
    }
  }

  const ranked = available
    .map((category) => ({
      category,
      score: scoreCategoryAgainstText({
        category: {
          label: category.label,
          slug: category.slug,
          description: category.description ?? null,
          icon: category.icon ?? null
        },
        text: `${input.rawMessage} ${input.fallbackCategory ?? ""}`
      })
    }))
    .sort((a, b) => b.score - a.score);

  if (ranked[0] && ranked[0].score >= 70) {
    return {
      label: ranked[0].category.label,
      matched: true,
      confidenceBoost: ranked[0].score >= 120 ? 0.08 : 0.05
    };
  }

  if (normalizedFallback) {
    const slugFallback = normalizeCategorySlug(input.fallbackCategory ?? "");
    const slugMatch = available.find((category) => category.slug === slugFallback || category.slug.startsWith(`${slugFallback}__`));
    if (slugMatch) {
      return { label: slugMatch.label, matched: true, confidenceBoost: 0.03 };
    }
  }

  return { label: input.fallbackCategory ?? available[0]?.label ?? "otros", matched: false, confidenceBoost: 0 };
}
