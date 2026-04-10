import { prisma } from "@/lib/prisma";
import { resolveAppUrl } from "@/lib/site-settings";

export const SHORT_LINK_PATH_PREFIX = "l";

const RESERVED_SHORT_LINK_SLUGS = new Set([
  "_next",
  "api",
  "appfotos",
  "g",
  "home-preview",
  SHORT_LINK_PATH_PREFIX,
  "links",
  "login",
  "lumepic",
  "robots",
  "sitemap",
  "vercel"
]);

export type ShortLinkRecord = {
  id: string;
  slug: string;
  destinationUrl: string;
  title: string | null;
  note: string | null;
  isActive: boolean;
  clicks: number;
  lastClickedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
};

export type ShortLinkAnalyticsSource = {
  label: string;
  count: number;
};

export type ShortLinkAnalyticsDay = {
  date: string;
  count: number;
};

export type ShortLinkDashboardItem = ShortLinkRecord & {
  recentClicks: number;
  topSources: ShortLinkAnalyticsSource[];
};

export type ShortLinksDashboardData = {
  shortLinks: ShortLinkDashboardItem[];
  overview: {
    totalLinks: number;
    activeLinks: number;
    pausedLinks: number;
    totalClicks: number;
    last7DaysClicks: number;
    topSources: ShortLinkAnalyticsSource[];
    clicksByDay: ShortLinkAnalyticsDay[];
  };
};

type ShortLinkRecentClickGroup = {
  shortLinkId: string;
  _count: {
    _all: number;
  };
};

type ShortLinkSourceGroup = {
  shortLinkId: string;
  utmSource: string | null;
  sourceHost: string | null;
  _count: {
    _all: number;
  };
};

function normalizeOptionalText(value: string | null | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDayKey(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function getSourceLabel(input: { utmSource?: string | null; sourceHost?: string | null }) {
  const utmSource = input.utmSource?.trim();
  if (utmSource) {
    return `utm:${utmSource}`;
  }

  const sourceHost = input.sourceHost?.trim();
  if (sourceHost) {
    return sourceHost;
  }

  return "Directo";
}

export function normalizeShortLinkSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isReservedShortLinkSlug(slug: string) {
  return RESERVED_SHORT_LINK_SLUGS.has(slug.toLowerCase());
}

export function validateShortLinkSlug(slug: string) {
  if (!slug) return "Escribe un slug para el enlace corto.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "Usa solo letras, numeros y guiones.";
  if (slug.length < 2) return "El slug debe tener al menos 2 caracteres.";
  if (isReservedShortLinkSlug(slug)) return "Ese slug esta reservado por la web.";
  return null;
}

export function normalizeShortLinkDestination(input: string) {
  const value = input.trim();
  if (!value) return "";
  if (value.startsWith("/")) return value;
  return value.replace(/\s+/g, "");
}

export function validateShortLinkDestination(destinationUrl: string) {
  if (!destinationUrl) return "Agrega la URL de destino.";
  if (destinationUrl.startsWith("/")) return null;
  if (!/^https?:\/\//i.test(destinationUrl)) return "Usa una URL absoluta con http/https o una ruta que empiece con /.";

  try {
    new URL(destinationUrl);
    return null;
  } catch {
    return "La URL de destino no es valida.";
  }
}

export function buildShortLinkUrl(slug: string) {
  return `${resolveAppUrl()}/${SHORT_LINK_PATH_PREFIX}/${slug}`;
}

export function buildLegacyShortLinkUrl(slug: string) {
  return `${resolveAppUrl()}/${slug}`;
}

export function resolveShortLinkDestination(destinationUrl: string) {
  if (destinationUrl.startsWith("/")) {
    return `${resolveAppUrl()}${destinationUrl}`;
  }

  return destinationUrl;
}

export function mergeDestinationWithSearchParams(destinationUrl: string, requestUrl: URL) {
  const targetUrl = new URL(resolveShortLinkDestination(destinationUrl));

  requestUrl.searchParams.forEach((value, key) => {
    if (!targetUrl.searchParams.has(key)) {
      targetUrl.searchParams.append(key, value);
    }
  });

  return targetUrl.toString();
}

export async function listShortLinks() {
  return prisma.shortLink.findMany({
    orderBy: [{ clicks: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      destinationUrl: true,
      title: true,
      note: true,
      isActive: true,
      clicks: true,
      lastClickedAt: true,
      createdAt: true,
      updatedAt: true,
      createdById: true
    }
  });
}

export async function getShortLinksDashboardData(): Promise<ShortLinksDashboardData> {
  const shortLinks = await listShortLinks();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [recentClicks, sourceBreakdown, recentEvents] = await Promise.all([
    prisma.shortLinkClick.groupBy({
      by: ["shortLinkId"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { _all: true }
    }),
    prisma.shortLinkClick.groupBy({
      by: ["shortLinkId", "utmSource", "sourceHost"],
      _count: { _all: true }
    }),
    prisma.shortLinkClick.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: {
        shortLinkId: true,
        createdAt: true,
        utmSource: true,
        sourceHost: true
      }
    })
  ]) as [
    ShortLinkRecentClickGroup[],
    ShortLinkSourceGroup[],
    Array<{
      shortLinkId: string;
      createdAt: Date;
      utmSource: string | null;
      sourceHost: string | null;
    }>
  ];

  const recentClicksMap = new Map<string, number>(recentClicks.map((entry) => [entry.shortLinkId, entry._count._all]));

  const sourceMap = new Map<string, ShortLinkAnalyticsSource[]>();
  for (const entry of sourceBreakdown) {
    const list = sourceMap.get(entry.shortLinkId) ?? [];
    list.push({
      label: getSourceLabel(entry),
      count: entry._count._all
    });
    sourceMap.set(entry.shortLinkId, list);
  }

  for (const [shortLinkId, list] of sourceMap.entries()) {
    sourceMap.set(
      shortLinkId,
      list
        .sort((left, right) => right.count - left.count)
        .filter((item, index, array) => array.findIndex((candidate) => candidate.label === item.label) === index)
        .slice(0, 3)
    );
  }

  const clicksByDayMap = new Map<string, number>();
  const overviewSourceMap = new Map<string, number>();

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    clicksByDayMap.set(toDayKey(date), 0);
  }

  for (const event of recentEvents) {
    const dayKey = toDayKey(event.createdAt);
    clicksByDayMap.set(dayKey, (clicksByDayMap.get(dayKey) ?? 0) + 1);

    const sourceLabel = getSourceLabel(event);
    overviewSourceMap.set(sourceLabel, (overviewSourceMap.get(sourceLabel) ?? 0) + 1);
  }

  return {
    shortLinks: shortLinks.map((shortLink) => ({
      ...shortLink,
      recentClicks: recentClicksMap.get(shortLink.id) ?? 0,
      topSources: sourceMap.get(shortLink.id) ?? []
    })),
    overview: {
      totalLinks: shortLinks.length,
      activeLinks: shortLinks.filter((item) => item.isActive).length,
      pausedLinks: shortLinks.filter((item) => !item.isActive).length,
      totalClicks: shortLinks.reduce((total, item) => total + item.clicks, 0),
      last7DaysClicks: recentEvents.length,
      topSources: Array.from(overviewSourceMap.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 5),
      clicksByDay: Array.from(clicksByDayMap.entries()).map(([date, count]) => ({ date, count }))
    }
  };
}

export async function createShortLink(input: {
  slug: string;
  destinationUrl: string;
  title?: string | null;
  note?: string | null;
  createdById?: string | null;
}) {
  return prisma.shortLink.create({
    data: {
      slug: input.slug,
      destinationUrl: input.destinationUrl,
      title: normalizeOptionalText(input.title),
      note: normalizeOptionalText(input.note),
      createdById: input.createdById ?? null
    }
  });
}

export async function updateShortLink(
  id: string,
  input: {
    slug: string;
    destinationUrl: string;
    title?: string | null;
    note?: string | null;
    isActive?: boolean;
  }
) {
  return prisma.shortLink.update({
    where: { id },
    data: {
      slug: input.slug,
      destinationUrl: input.destinationUrl,
      title: normalizeOptionalText(input.title),
      note: normalizeOptionalText(input.note),
      ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {})
    }
  });
}

export async function deleteShortLink(id: string) {
  return prisma.shortLink.delete({ where: { id } });
}

export async function toggleShortLinkActive(id: string, isActive: boolean) {
  return prisma.shortLink.update({
    where: { id },
    data: { isActive }
  });
}

export async function findShortLinkBySlug(slug: string): Promise<ShortLinkRecord | null> {
  return prisma.shortLink.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      destinationUrl: true,
      title: true,
      note: true,
      isActive: true,
      clicks: true,
      lastClickedAt: true,
      createdAt: true,
      updatedAt: true,
      createdById: true
    }
  });
}

export async function registerShortLinkClick(input: {
  shortLinkId: string;
  referer?: string | null;
  sourceHost?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  country?: string | null;
  city?: string | null;
  userAgent?: string | null;
}) {
  await prisma.$transaction([
    prisma.shortLink.update({
      where: { id: input.shortLinkId },
      data: {
        clicks: {
          increment: 1
        },
        lastClickedAt: new Date()
      }
    }),
    prisma.shortLinkClick.create({
      data: {
        shortLinkId: input.shortLinkId,
        referer: normalizeOptionalText(input.referer),
        sourceHost: normalizeOptionalText(input.sourceHost),
        utmSource: normalizeOptionalText(input.utmSource),
        utmMedium: normalizeOptionalText(input.utmMedium),
        utmCampaign: normalizeOptionalText(input.utmCampaign),
        country: normalizeOptionalText(input.country),
        city: normalizeOptionalText(input.city),
        userAgent: normalizeOptionalText(input.userAgent)
      }
    })
  ]);
}
