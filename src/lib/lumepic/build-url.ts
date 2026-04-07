import type { LumepicEventConfig } from "@/lib/lumepic/types";

function assertLumepicEventUrl(eventUrl: string) {
  const url = new URL(eventUrl);

  if (!/(\.|^)lumepic\.com$/i.test(url.hostname)) {
    throw new Error("El link del evento debe apuntar a lumepic.com.");
  }

  if (!url.searchParams.get("ownerId")) {
    throw new Error("El link del evento debe incluir ownerId.");
  }

  return url;
}

export function buildLumepicEventUrl(event: Pick<LumepicEventConfig, "eventUrl">) {
  const url = assertLumepicEventUrl(event.eventUrl);
  url.searchParams.delete("tagValue");
  return url.toString();
}

export function buildLumepicResultUrl(event: Pick<LumepicEventConfig, "eventUrl">, bibNumber: string) {
  const url = new URL(buildLumepicEventUrl(event));
  url.searchParams.set("tagValue", bibNumber);
  return url.toString();
}

export function resolveLumepicSelfieUrl(event: Pick<LumepicEventConfig, "eventUrl" | "selfieUrl">) {
  return event.selfieUrl ?? buildLumepicEventUrl(event);
}
