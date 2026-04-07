"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSuperAdminSession } from "@/lib/auth-guard";
import { getSiteSettings, upsertSiteSettings } from "@/lib/site-settings";

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\//i.test(value) || value.startsWith("/"), "Usa una URL absoluta o una ruta que empiece con /.");

const siteSettingsSchema = z.object({
  shareTitle: z.string().trim().min(3, "Agrega al menos un titulo corto."),
  shareDescription: z.string().trim().min(6, "Agrega una descripcion breve para compartir."),
  shareImageUrl: optionalUrlSchema,
  instagramUrl: z.string().trim().url("Agrega una URL valida para Instagram."),
  facebookUrl: z.string().trim().url("Agrega una URL valida para Facebook."),
  whatsappNumber: z
    .string()
    .trim()
    .min(8, "Agrega un numero de WhatsApp valido.")
    .regex(/^\d+$/, "Usa solo numeros en el telefono de WhatsApp."),
  whatsappMessage: z.string().trim().min(4, "Agrega un mensaje corto para WhatsApp."),
  maintenanceTitle: z.string().trim().min(4, "Agrega un titulo corto para mantenimiento."),
  maintenanceMessage: z.string().trim().min(8, "Agrega un mensaje breve para mantenimiento."),
  downloadPopupTitle: z.string().trim().min(3, "Agrega un titulo corto para el popup."),
  downloadPopupBody: z.string().trim().min(6, "Agrega un mensaje breve para el popup."),
  homeBadge: z.string().trim().min(2, "Agrega una insignia corta para la home."),
  homeEyebrow: z.string().trim().min(2, "Agrega un texto superior corto para la home."),
  homeTitle: z.string().trim().min(6, "Agrega un titulo principal un poco mas claro."),
  homeDescription: z.string().trim().min(8, "Agrega una descripcion principal breve."),
  featuredAlbumIds: z.array(z.string().trim()).default([]),
  maintenanceMode: z.boolean(),
  showWhatsAppFloat: z.boolean(),
  downloadsEnabled: z.boolean(),
  favoritesEnabled: z.boolean(),
  downloadPopupEnabled: z.boolean()
});

export async function saveSiteSettingsAction(formData: FormData) {
  await requireSuperAdminSession("/appfotos/admin/site");

  const currentSettings = await getSiteSettings();
  const activeTab = String(formData.get("tab") ?? "general");

  function getTextValue(name: string, fallback: string) {
    const rawValue = formData.get(name);
    if (typeof rawValue !== "string") {
      return fallback;
    }

    return rawValue;
  }

  function getCheckboxValue(name: string, fallback: boolean) {
    if (!formData.has(name)) {
      return fallback;
    }

    return formData
      .getAll(name)
      .map((value) => String(value).toLowerCase())
      .some((value) => value === "on" || value === "true");
  }

  const featuredAlbumIds = formData.getAll("featuredAlbumIds");

  const parsedInput = siteSettingsSchema.safeParse({
    shareTitle: getTextValue("shareTitle", currentSettings.shareTitle),
    shareDescription: getTextValue("shareDescription", currentSettings.shareDescription),
    shareImageUrl: getTextValue("shareImageUrl", currentSettings.shareImageUrl ?? ""),
    instagramUrl: getTextValue("instagramUrl", currentSettings.instagramUrl),
    facebookUrl: getTextValue("facebookUrl", currentSettings.facebookUrl),
    whatsappNumber: getTextValue("whatsappNumber", currentSettings.whatsappNumber),
    whatsappMessage: getTextValue("whatsappMessage", currentSettings.whatsappMessage),
    maintenanceTitle: getTextValue("maintenanceTitle", currentSettings.maintenanceTitle),
    maintenanceMessage: getTextValue("maintenanceMessage", currentSettings.maintenanceMessage),
    downloadPopupTitle: getTextValue("downloadPopupTitle", currentSettings.downloadPopupTitle),
    downloadPopupBody: getTextValue("downloadPopupBody", currentSettings.downloadPopupBody),
    homeBadge: getTextValue("homeBadge", currentSettings.homeBadge),
    homeEyebrow: getTextValue("homeEyebrow", currentSettings.homeEyebrow),
    homeTitle: getTextValue("homeTitle", currentSettings.homeTitle),
    homeDescription: getTextValue("homeDescription", currentSettings.homeDescription),
    featuredAlbumIds: formData.has("featuredAlbumIdsIntent")
      ? featuredAlbumIds.map((value) => String(value).trim()).filter(Boolean)
      : currentSettings.featuredAlbumIds,
    maintenanceMode: getCheckboxValue("maintenanceMode", currentSettings.maintenanceMode),
    showWhatsAppFloat: getCheckboxValue("showWhatsAppFloat", currentSettings.showWhatsAppFloat),
    downloadsEnabled: getCheckboxValue("downloadsEnabled", currentSettings.downloadsEnabled),
    favoritesEnabled: getCheckboxValue("favoritesEnabled", currentSettings.favoritesEnabled),
    downloadPopupEnabled: getCheckboxValue("downloadPopupEnabled", currentSettings.downloadPopupEnabled)
  });

  if (!parsedInput.success) {
    const encodedMessage = encodeURIComponent(parsedInput.error.issues[0]?.message ?? "No se pudo guardar la configuracion.");
    redirect(`/appfotos/admin/site?error=${encodedMessage}`);
  }

  await upsertSiteSettings({
    shareTitle: parsedInput.data.shareTitle,
    shareDescription: parsedInput.data.shareDescription,
    shareImageUrl: parsedInput.data.shareImageUrl ?? null,
    instagramUrl: parsedInput.data.instagramUrl,
    facebookUrl: parsedInput.data.facebookUrl,
    whatsappNumber: parsedInput.data.whatsappNumber,
    whatsappMessage: parsedInput.data.whatsappMessage,
    maintenanceMode: parsedInput.data.maintenanceMode,
    maintenanceTitle: parsedInput.data.maintenanceTitle,
    maintenanceMessage: parsedInput.data.maintenanceMessage,
    showWhatsAppFloat: parsedInput.data.showWhatsAppFloat,
    downloadsEnabled: parsedInput.data.downloadsEnabled,
    favoritesEnabled: parsedInput.data.favoritesEnabled,
    downloadPopupEnabled: parsedInput.data.downloadPopupEnabled,
    featuredAlbumIds: parsedInput.data.featuredAlbumIds,
    downloadPopupTitle: parsedInput.data.downloadPopupTitle,
    downloadPopupBody: parsedInput.data.downloadPopupBody,
    homeBadge: parsedInput.data.homeBadge,
    homeEyebrow: parsedInput.data.homeEyebrow,
    homeTitle: parsedInput.data.homeTitle,
    homeDescription: parsedInput.data.homeDescription
  });

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/g/[slug]", "page");
  revalidatePath("/appfotos/g/[slug]", "page");
  revalidatePath("/appfotos/admin/site");

  redirect(`/appfotos/admin/site?tab=${encodeURIComponent(activeTab)}&saved=1`);
}
