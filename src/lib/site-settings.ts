import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/config/site";

export type SiteSettingsRecord = {
  shareTitle: string;
  shareDescription: string;
  shareImageUrl: string | null;
  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;
  whatsappMessage: string;
  downloadPopupTitle: string;
  downloadPopupBody: string;
  homeBadge: string;
  homeEyebrow: string;
  homeTitle: string;
  homeDescription: string;
};

function normalizeOptionalText(value: string | null | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

function normalizeRequiredText(value: string | null | undefined, fallbackValue: string) {
  return value?.trim() || fallbackValue;
}

function resolveAppUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? siteConfig.url;
  return rawUrl.replace(/\/$/, "");
}

export function resolveSiteShareImageUrl(input: string | null | undefined) {
  const normalizedValue = normalizeOptionalText(input);

  if (!normalizedValue) {
    return `${resolveAppUrl()}${siteConfig.shareImageUrl}`;
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  const normalizedPath = normalizedValue.startsWith("/") ? normalizedValue : `/${normalizedValue}`;
  return `${resolveAppUrl()}${normalizedPath}`;
}

function getDefaultSiteSettings(): SiteSettingsRecord {
  return {
    shareTitle: siteConfig.shareTitle,
    shareDescription: siteConfig.shareDescription,
    shareImageUrl: siteConfig.shareImageUrl,
    instagramUrl: siteConfig.instagramUrl,
    facebookUrl: siteConfig.facebookUrl,
    whatsappNumber: siteConfig.whatsappNumber,
    whatsappMessage: siteConfig.whatsappMessage,
    downloadPopupTitle: siteConfig.downloadPopupTitle,
    downloadPopupBody: siteConfig.downloadPopupBody,
    homeBadge: siteConfig.homeBadge,
    homeEyebrow: siteConfig.homeEyebrow,
    homeTitle: siteConfig.homeTitle,
    homeDescription: siteConfig.homeDescription
  };
}

export async function getSiteSettings(): Promise<SiteSettingsRecord> {
  const defaults = getDefaultSiteSettings();
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      shareTitle: true,
      shareDescription: true,
      shareImageUrl: true,
      instagramUrl: true,
      facebookUrl: true,
      whatsappNumber: true,
      whatsappMessage: true,
      downloadPopupTitle: true,
      downloadPopupBody: true,
      homeBadge: true,
      homeEyebrow: true,
      homeTitle: true,
      homeDescription: true
    }
  });

  if (!settings) {
    return defaults;
  }

  return {
    shareTitle: normalizeRequiredText(settings.shareTitle, defaults.shareTitle),
    shareDescription: normalizeRequiredText(settings.shareDescription, defaults.shareDescription),
    shareImageUrl: normalizeOptionalText(settings.shareImageUrl),
    instagramUrl: normalizeRequiredText(settings.instagramUrl, defaults.instagramUrl),
    facebookUrl: normalizeRequiredText(settings.facebookUrl, defaults.facebookUrl),
    whatsappNumber: normalizeRequiredText(settings.whatsappNumber, defaults.whatsappNumber),
    whatsappMessage: normalizeRequiredText(settings.whatsappMessage, defaults.whatsappMessage),
    downloadPopupTitle: normalizeRequiredText(settings.downloadPopupTitle, defaults.downloadPopupTitle),
    downloadPopupBody: normalizeRequiredText(settings.downloadPopupBody, defaults.downloadPopupBody),
    homeBadge: normalizeRequiredText(settings.homeBadge, defaults.homeBadge),
    homeEyebrow: normalizeRequiredText(settings.homeEyebrow, defaults.homeEyebrow),
    homeTitle: normalizeRequiredText(settings.homeTitle, defaults.homeTitle),
    homeDescription: normalizeRequiredText(settings.homeDescription, defaults.homeDescription)
  };
}

export async function upsertSiteSettings(input: SiteSettingsRecord) {
  return prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      shareTitle: input.shareTitle.trim(),
      shareDescription: input.shareDescription.trim(),
      shareImageUrl: normalizeOptionalText(input.shareImageUrl),
      instagramUrl: input.instagramUrl.trim(),
      facebookUrl: input.facebookUrl.trim(),
      whatsappNumber: input.whatsappNumber.trim(),
      whatsappMessage: input.whatsappMessage.trim(),
      downloadPopupTitle: input.downloadPopupTitle.trim(),
      downloadPopupBody: input.downloadPopupBody.trim(),
      homeBadge: input.homeBadge.trim(),
      homeEyebrow: input.homeEyebrow.trim(),
      homeTitle: input.homeTitle.trim(),
      homeDescription: input.homeDescription.trim()
    },
    update: {
      shareTitle: input.shareTitle.trim(),
      shareDescription: input.shareDescription.trim(),
      shareImageUrl: normalizeOptionalText(input.shareImageUrl),
      instagramUrl: input.instagramUrl.trim(),
      facebookUrl: input.facebookUrl.trim(),
      whatsappNumber: input.whatsappNumber.trim(),
      whatsappMessage: input.whatsappMessage.trim(),
      downloadPopupTitle: input.downloadPopupTitle.trim(),
      downloadPopupBody: input.downloadPopupBody.trim(),
      homeBadge: input.homeBadge.trim(),
      homeEyebrow: input.homeEyebrow.trim(),
      homeTitle: input.homeTitle.trim(),
      homeDescription: input.homeDescription.trim()
    }
  });
}
