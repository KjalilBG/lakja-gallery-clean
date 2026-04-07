import {
  getLumepicInstagramHandle,
  getLumepicNoPhotosTemplate,
  getLumepicSuccessTemplate
} from "@/lib/lumepic/config";
import type { LumepicEventConfig, LumepicMessageTemplateVariables } from "@/lib/lumepic/types";

function applyTemplate(template: string, variables: LumepicMessageTemplateVariables) {
  return template.replace(/\{(\w+)\}/g, (_, key: keyof LumepicMessageTemplateVariables) => variables[key] ?? "");
}

function pickRandomTemplate(templates: string[]) {
  const validTemplates = templates.map((template) => template.trim()).filter(Boolean);

  if (validTemplates.length === 0) {
    return "";
  }

  const index = Math.floor(Math.random() * validTemplates.length);
  return validTemplates[index];
}

function getTemplateVariables(event: LumepicEventConfig, bibNumber: string, resultUrl: string, selfieUrl: string) {
  return {
    eventName: event.name,
    bibNumber,
    resultUrl,
    selfieUrl,
    instagramHandle: getLumepicInstagramHandle(event)
  } satisfies LumepicMessageTemplateVariables;
}

export function buildLumepicSuccessMessage(event: LumepicEventConfig, bibNumber: string, resultUrl: string, selfieUrl: string) {
  return applyTemplate(pickRandomTemplate(getLumepicSuccessTemplate(event)), getTemplateVariables(event, bibNumber, resultUrl, selfieUrl));
}

export function buildLumepicNoPhotosMessage(event: LumepicEventConfig, bibNumber: string, resultUrl: string, selfieUrl: string) {
  return applyTemplate(pickRandomTemplate(getLumepicNoPhotosTemplate(event)), getTemplateVariables(event, bibNumber, resultUrl, selfieUrl));
}
