import type { LumepicDetectionConfig, LumepicEventConfig, LumepicEventOption } from "@/lib/lumepic/types";

const defaultDetectionConfig: LumepicDetectionConfig = {
  emptyStateTexts: [
    "No encontramos coincidencias con tu numero",
    "No encontramos coincidencias con tu número",
    "No se encontraron fotos"
  ],
  thumbnailUrlSubstrings: ["spotted-images-public.s3.amazonaws.com", "/thumbnails/"],
  navigationTimeoutMs: 45_000,
  networkIdleTimeoutMs: 15_000
};

const defaultSuccessMessageTemplates = [
  `¡Muchas felicidades! Te comparto tus fotos con mucho gusto:
{resultUrl}

Y si te gustó el trabajo, me encantará que me sigas en Instagram: {instagramHandle}`,
  `Con mucho gusto te comparto tus fotos:
{resultUrl}

Si te gustó el resultado, me encantará verte también en Instagram: {instagramHandle}`,
  `¡Qué gusto encontrarte en las fotos! Aquí te dejo tu link:
{resultUrl}

Y si quieres seguir mi trabajo, estoy en Instagram como {instagramHandle}`
];

const defaultNoPhotosMessageTemplates = [
  `Mil disculpas, por el momento no logramos encontrar fotos con tu número. Te invitamos a buscarte con una selfie aquí:
{selfieUrl}

Y si gustas, también puedes seguirme en Instagram: {instagramHandle}`,
  `Por ahora no encontramos fotos asociadas a tu número. Puedes intentar buscarte con una selfie aquí:
{selfieUrl}

También me encuentras en Instagram como {instagramHandle}`,
  `Una disculpa, de momento no aparecieron resultados con ese número. Te recomiendo probar la búsqueda por selfie en este link:
{selfieUrl}

Si quieres seguir mi trabajo, estoy en Instagram como {instagramHandle}`
];

const defaultInstagramHandle = "@LaKja.top";

export const lumepicEvents: LumepicEventConfig[] = [];

export function getLumepicEventConfig(eventId?: string) {
  if (eventId) {
    return lumepicEvents.find((event) => event.id === eventId) ?? null;
  }

  return lumepicEvents.length === 1 ? lumepicEvents[0] : null;
}

export function getLumepicEventOptions(): LumepicEventOption[] {
  return lumepicEvents.map((event) => ({
    id: event.id,
    name: event.name,
    source: "configured"
  }));
}

export function getDefaultLumepicEventId() {
  return lumepicEvents.length > 0 ? lumepicEvents[0].id : null;
}

export function getLumepicInstagramHandle(event: LumepicEventConfig) {
  return event.instagramHandle ?? defaultInstagramHandle;
}

export function getLumepicSuccessTemplate(event: LumepicEventConfig) {
  return event.successMessageTemplates ?? defaultSuccessMessageTemplates;
}

export function getLumepicNoPhotosTemplate(event: LumepicEventConfig) {
  return event.noPhotosMessageTemplates ?? defaultNoPhotosMessageTemplates;
}

export function getLumepicDetectionConfig(event: LumepicEventConfig): LumepicDetectionConfig {
  return {
    emptyStateTexts: event.detection?.emptyStateTexts ?? defaultDetectionConfig.emptyStateTexts,
    thumbnailUrlSubstrings: event.detection?.thumbnailUrlSubstrings ?? defaultDetectionConfig.thumbnailUrlSubstrings,
    navigationTimeoutMs: event.detection?.navigationTimeoutMs ?? defaultDetectionConfig.navigationTimeoutMs,
    networkIdleTimeoutMs: event.detection?.networkIdleTimeoutMs ?? defaultDetectionConfig.networkIdleTimeoutMs
  };
}

export function getDefaultLumepicMessageSettings() {
  return {
    instagramHandle: defaultInstagramHandle,
    successMessageTemplates: defaultSuccessMessageTemplates,
    noPhotosMessageTemplates: defaultNoPhotosMessageTemplates
  };
}
