import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

import { getLumepicDetectionConfig, getLumepicEventConfig } from "@/lib/lumepic/config";
import { buildLumepicEventUrl, buildLumepicResultUrl, resolveLumepicSelfieUrl } from "@/lib/lumepic/build-url";
import { buildLumepicNoPhotosMessage, buildLumepicSuccessMessage } from "@/lib/lumepic/message-builder";
import type { LumepicCheckResult, LumepicCustomEventInput, LumepicEventConfig } from "@/lib/lumepic/types";

type LumepicCacheEntry = {
  expiresAt: number;
  result: LumepicCheckResult;
};

const LUMEPIC_RESULT_TTL_MS = 5 * 60 * 1000;

const globalForLumepicCheck = globalThis as typeof globalThis & {
  __lakjaLumepicResultCache?: Map<string, LumepicCacheEntry>;
  __lakjaLumepicInflightChecks?: Map<string, Promise<LumepicCheckResult>>;
};

const resultCache = globalForLumepicCheck.__lakjaLumepicResultCache ?? new Map<string, LumepicCacheEntry>();
const inflightChecks = globalForLumepicCheck.__lakjaLumepicInflightChecks ?? new Map<string, Promise<LumepicCheckResult>>();

if (!globalForLumepicCheck.__lakjaLumepicResultCache) {
  globalForLumepicCheck.__lakjaLumepicResultCache = resultCache;
}

if (!globalForLumepicCheck.__lakjaLumepicInflightChecks) {
  globalForLumepicCheck.__lakjaLumepicInflightChecks = inflightChecks;
}

const localBrowserCandidates = [
  process.env.LUMEPIC_BROWSER_EXECUTABLE_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
].filter(Boolean) as string[];

async function resolveBrowserExecutablePath() {
  for (const candidate of localBrowserCandidates) {
    try {
      const fs = await import("node:fs/promises");
      await fs.access(candidate);
      return {
        executablePath: candidate,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true as const,
        useDefaultArgs: false
      };
    } catch {}
  }

  const executablePath = await chromium.executablePath();
  return {
    executablePath,
    args: chromium.args,
    headless: "shell" as const,
    useDefaultArgs: true
  };
}

function normalizeVisibleText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildCustomEventConfig(customEvent: LumepicCustomEventInput): LumepicEventConfig {
  return {
    id: customEvent.id,
    name: customEvent.name,
    eventUrl: buildLumepicEventUrl({ eventUrl: customEvent.eventUrl }),
    selfieUrl: customEvent.selfieUrl,
    instagramHandle: customEvent.instagramHandle,
    successMessageTemplates: customEvent.successMessageTemplates,
    noPhotosMessageTemplates: customEvent.noPhotosMessageTemplates
  };
}

function resolveEventConfig(eventId?: string, customEvent?: LumepicCustomEventInput) {
  if (customEvent) {
    return buildCustomEventConfig(customEvent);
  }

  return eventId ? getLumepicEventConfig(eventId) : null;
}

function pruneExpiredLumepicCache(now: number) {
  for (const [key, entry] of resultCache.entries()) {
    if (entry.expiresAt <= now) {
      resultCache.delete(key);
    }
  }
}

function buildLumepicCacheKey(event: LumepicEventConfig, bibNumber: string) {
  const detection = getLumepicDetectionConfig(event);

  return JSON.stringify({
    eventId: event.id,
    eventUrl: event.eventUrl,
    selfieUrl: event.selfieUrl ?? "",
    bibNumber,
    detection
  });
}

export async function checkLumepicByBib(params: {
  eventId?: string;
  customEvent?: LumepicCustomEventInput;
  bibNumber: string;
}): Promise<LumepicCheckResult> {
  const event = resolveEventConfig(params.eventId, params.customEvent);
  const bibNumber = params.bibNumber;

  if (!event) {
    return {
      success: false,
      status: "error",
      hasPhotos: null,
      bibNumber,
      eventId: params.eventId ?? params.customEvent?.id ?? "",
      eventName: null,
      resultUrl: null,
      selfieUrl: null,
      message: null,
      reason: "No existe configuracion para el evento solicitado.",
      errorCode: "EVENT_NOT_FOUND"
    };
  }

  const resultUrl = buildLumepicResultUrl(event, bibNumber);
  const selfieUrl = resolveLumepicSelfieUrl(event);
  const detection = getLumepicDetectionConfig(event);
  const now = Date.now();
  const cacheKey = buildLumepicCacheKey(event, bibNumber);

  pruneExpiredLumepicCache(now);

  const cachedEntry = resultCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return cachedEntry.result;
  }

  const inflightCheck = inflightChecks.get(cacheKey);

  if (inflightCheck) {
    return inflightCheck;
  }

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  const checkPromise = (async () => {
    try {
    const browserConfig = await resolveBrowserExecutablePath();
    browser = await puppeteer.launch({
      executablePath: browserConfig.executablePath,
      args: browserConfig.useDefaultArgs
        ? puppeteer.defaultArgs({
            args: browserConfig.args,
            headless: browserConfig.headless
          })
        : browserConfig.args,
      headless: browserConfig.headless
    });

    const page = await browser.newPage();
    await page.goto(resultUrl, {
      waitUntil: "domcontentloaded",
      timeout: detection.navigationTimeoutMs
    });

    try {
      await page.waitForNetworkIdle({
        idleTime: 800,
        timeout: detection.networkIdleTimeoutMs
      });
    } catch {}

    const visibleState = await page.evaluate(() => {
      const text = document.body.innerText || "";
      const images = Array.from(document.images)
        .map((image) => image.currentSrc || image.src)
        .filter(Boolean);

      return {
        visibleText: text,
        imageUrls: images
      };
    });

    const normalizedVisibleText = normalizeVisibleText(visibleState.visibleText);
    const matchedEmptyStateText = detection.emptyStateTexts.find((text) =>
      normalizedVisibleText.includes(normalizeVisibleText(text))
    );
    const thumbnailUrls = visibleState.imageUrls.filter((url) =>
      detection.thumbnailUrlSubstrings.every((substring) => url.includes(substring))
    );

    await page.close();

    if (thumbnailUrls.length > 0) {
      const result = {
        success: true,
        status: "found",
        hasPhotos: true,
        bibNumber,
        eventId: event.id,
        eventName: event.name,
        resultUrl,
        selfieUrl,
        message: buildLumepicSuccessMessage(event, bibNumber, resultUrl, selfieUrl),
        reason: "Se detectaron miniaturas visibles en Lumepic."
      } satisfies LumepicCheckResult;

      resultCache.set(cacheKey, {
        result,
        expiresAt: Date.now() + LUMEPIC_RESULT_TTL_MS
      });

      return result;
    }

    const result = {
      success: true,
      status: "not_found",
      hasPhotos: false,
      bibNumber,
      eventId: event.id,
      eventName: event.name,
      resultUrl,
      selfieUrl,
      message: buildLumepicNoPhotosMessage(event, bibNumber, resultUrl, selfieUrl),
      reason: matchedEmptyStateText
        ? `Lumepic mostro el estado sin resultados: "${matchedEmptyStateText}".`
        : "No se detectaron miniaturas visibles para el numero consultado."
    } satisfies LumepicCheckResult;

    resultCache.set(cacheKey, {
      result,
      expiresAt: Date.now() + LUMEPIC_RESULT_TTL_MS
    });

    return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido al consultar Lumepic.";

      return {
        success: false,
        status: "error",
        hasPhotos: null,
        bibNumber,
        eventId: event.id,
        eventName: event.name,
        resultUrl,
        selfieUrl,
        message: null,
        reason: message,
        errorCode: "CHECK_FAILED"
      } satisfies LumepicCheckResult;
    } finally {
      inflightChecks.delete(cacheKey);

      if (browser) {
        await browser.close();
      }
    }
  })();

  inflightChecks.set(cacheKey, checkPromise);
  return checkPromise;
}
