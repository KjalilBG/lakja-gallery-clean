import { prisma } from "@/lib/prisma";
import { sanitizeTextInput } from "@/lib/sanitize";
import { getDefaultLumepicMessageSettings } from "@/lib/lumepic/config";
import type { LumepicCustomEventInput, LumepicStoredConfig } from "@/lib/lumepic/types";

const LUMEPIC_CONFIG_OWNER_EMAIL = "lumepic-config@lakja.local";

function sanitizeOptionalText(value: string | undefined, maxLength = 5000) {
  const sanitized = sanitizeTextInput(value ?? "", {
    preserveNewlines: true,
    maxLength
  });

  return sanitized || undefined;
}

function sanitizeRequiredText(value: string | undefined, fallback = "", maxLength = 5000) {
  const sanitized = sanitizeOptionalText(value, maxLength);
  return sanitized ?? fallback;
}

function getDefaultActiveEvents(): LumepicCustomEventInput[] {
  return [
    { id: "active-event-1", name: "", eventUrl: "", selfieUrl: "" },
    { id: "active-event-2", name: "", eventUrl: "", selfieUrl: "" },
    { id: "active-event-3", name: "", eventUrl: "", selfieUrl: "" }
  ];
}

function normalizeActiveEvent(input: Partial<LumepicCustomEventInput> | undefined, index: number): LumepicCustomEventInput {
  const defaults = getDefaultActiveEvents()[index] ?? { id: `active-event-${index + 1}`, name: "", eventUrl: "", selfieUrl: "" };

  return {
    id: defaults.id,
    name: sanitizeRequiredText(input?.name, "", 120),
    eventUrl: sanitizeRequiredText(input?.eventUrl, "", 2048),
    selfieUrl: sanitizeOptionalText(input?.selfieUrl, 2048),
    instagramHandle: undefined,
    successMessageTemplates: undefined,
    noPhotosMessageTemplates: undefined
  };
}

function normalizeTemplates(input: unknown, fallbacks: string[]) {
  const rawTemplates = Array.isArray(input) ? input : [];

  return fallbacks.map((fallbackValue, index) => {
    const value = typeof rawTemplates[index] === "string" ? rawTemplates[index] : fallbackValue;
    return sanitizeRequiredText(value, fallbackValue, 5000);
  });
}

function getDefaultStoredConfig(): LumepicStoredConfig {
  const defaults = getDefaultLumepicMessageSettings();

  return {
    version: 1,
    activeEvents: getDefaultActiveEvents(),
    instagramHandle: defaults.instagramHandle,
    successMessageTemplates: [...defaults.successMessageTemplates],
    noPhotosMessageTemplates: [...defaults.noPhotosMessageTemplates]
  };
}

function parseStoredConfig(rawContent: string): LumepicStoredConfig {
  const defaults = getDefaultStoredConfig();
  const trimmedContent = rawContent.trim();

  if (!trimmedContent) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(trimmedContent) as Partial<LumepicStoredConfig>;

    return {
      version: 1,
      activeEvents: defaults.activeEvents.map((_, index) => normalizeActiveEvent(parsed.activeEvents?.[index], index)),
      instagramHandle: sanitizeRequiredText(parsed.instagramHandle, defaults.instagramHandle, 120),
      successMessageTemplates: normalizeTemplates(parsed.successMessageTemplates, defaults.successMessageTemplates),
      noPhotosMessageTemplates: normalizeTemplates(parsed.noPhotosMessageTemplates, defaults.noPhotosMessageTemplates)
    };
  } catch {
    return defaults;
  }
}

export async function getLumepicStoredConfig() {
  const record = await prisma.adminNotebook.findUnique({
    where: { ownerEmail: LUMEPIC_CONFIG_OWNER_EMAIL },
    select: {
      content: true,
      updatedAt: true
    }
  });

  return {
    ...parseStoredConfig(record?.content ?? ""),
    updatedAt: record?.updatedAt?.toISOString() ?? null
  };
}

export async function saveLumepicStoredConfig(input: LumepicStoredConfig) {
  const normalizedConfig = parseStoredConfig(JSON.stringify(input));

  const savedRecord = await prisma.adminNotebook.upsert({
    where: { ownerEmail: LUMEPIC_CONFIG_OWNER_EMAIL },
    create: {
      ownerEmail: LUMEPIC_CONFIG_OWNER_EMAIL,
      content: JSON.stringify(normalizedConfig)
    },
    update: {
      content: JSON.stringify(normalizedConfig)
    },
    select: {
      content: true,
      updatedAt: true
    }
  });

  return {
    ...parseStoredConfig(savedRecord.content),
    updatedAt: savedRecord.updatedAt.toISOString()
  };
}
