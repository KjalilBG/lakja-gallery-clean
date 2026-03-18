"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSuperAdminSession } from "@/lib/auth-guard";
import { upsertSiteSettings } from "@/lib/site-settings";

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\//i.test(value) || value.startsWith("/"), "Usa una URL absoluta o una ruta que empiece con /.");

const siteSettingsSchema = z.object({
  shareTitle: z.string().trim().min(8, "Agrega un titulo un poco mas descriptivo."),
  shareDescription: z.string().trim().min(12, "Agrega una descripcion mas clara para compartir."),
  shareImageUrl: optionalUrlSchema,
  instagramUrl: z.string().trim().url("Agrega una URL valida para Instagram."),
  facebookUrl: z.string().trim().url("Agrega una URL valida para Facebook."),
  whatsappNumber: z
    .string()
    .trim()
    .min(8, "Agrega un numero de WhatsApp valido.")
    .regex(/^\d+$/, "Usa solo numeros en el telefono de WhatsApp."),
  whatsappMessage: z.string().trim().min(12, "Agrega un mensaje de WhatsApp mas claro."),
  maintenanceTitle: z.string().trim().min(10, "Agrega un titulo mas claro para mantenimiento."),
  maintenanceMessage: z.string().trim().min(20, "Agrega un mensaje mas claro para mantenimiento."),
  downloadPopupTitle: z.string().trim().min(8, "Agrega un titulo mas descriptivo para el popup."),
  downloadPopupBody: z.string().trim().min(16, "Agrega un mensaje mas claro para el popup."),
  homeBadge: z.string().trim().min(4, "Agrega un texto corto para la insignia de la home."),
  homeEyebrow: z.string().trim().min(4, "Agrega un texto superior para la home."),
  homeTitle: z.string().trim().min(12, "Agrega un titulo principal mas descriptivo."),
  homeDescription: z.string().trim().min(20, "Agrega una descripcion principal mas completa."),
  featuredAlbumIds: z.array(z.string().trim()).default([]),
  maintenanceMode: z.boolean(),
  showWhatsAppFloat: z.boolean(),
  downloadsEnabled: z.boolean(),
  favoritesEnabled: z.boolean(),
  downloadPopupEnabled: z.boolean()
});

export async function saveSiteSettingsAction(formData: FormData) {
  await requireSuperAdminSession("/admin/site");

  const parsedInput = siteSettingsSchema.safeParse({
    shareTitle: String(formData.get("shareTitle") ?? ""),
    shareDescription: String(formData.get("shareDescription") ?? ""),
    shareImageUrl: String(formData.get("shareImageUrl") ?? ""),
    instagramUrl: String(formData.get("instagramUrl") ?? ""),
    facebookUrl: String(formData.get("facebookUrl") ?? ""),
    whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
    whatsappMessage: String(formData.get("whatsappMessage") ?? ""),
    maintenanceTitle: String(formData.get("maintenanceTitle") ?? ""),
    maintenanceMessage: String(formData.get("maintenanceMessage") ?? ""),
    downloadPopupTitle: String(formData.get("downloadPopupTitle") ?? ""),
    downloadPopupBody: String(formData.get("downloadPopupBody") ?? ""),
    homeBadge: String(formData.get("homeBadge") ?? ""),
    homeEyebrow: String(formData.get("homeEyebrow") ?? ""),
    homeTitle: String(formData.get("homeTitle") ?? ""),
    homeDescription: String(formData.get("homeDescription") ?? ""),
    featuredAlbumIds: formData
      .getAll("featuredAlbumIds")
      .map((value) => String(value).trim())
      .filter(Boolean),
    maintenanceMode: formData.get("maintenanceMode") === "on",
    showWhatsAppFloat: formData.get("showWhatsAppFloat") === "on",
    downloadsEnabled: formData.get("downloadsEnabled") === "on",
    favoritesEnabled: formData.get("favoritesEnabled") === "on",
    downloadPopupEnabled: formData.get("downloadPopupEnabled") === "on"
  });

  if (!parsedInput.success) {
    const encodedMessage = encodeURIComponent(parsedInput.error.issues[0]?.message ?? "No se pudo guardar la configuracion.");
    redirect(`/admin/site?error=${encodedMessage}`);
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
  revalidatePath("/admin/site");

  redirect("/admin/site?saved=1");
}
