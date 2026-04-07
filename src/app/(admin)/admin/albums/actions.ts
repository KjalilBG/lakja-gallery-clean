"use server";

import { AlbumStatus, AlbumVisibility, CoverPosition, FavoriteSelectionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createAlbum,
  deleteAlbum,
  deleteAlbumPhoto,
  deleteFavoriteSelection,
  getAlbumPasswordMetaById,
  moveAlbumPhoto,
  processAlbumBibRecognition,
  processSinglePhotoBibRecognition,
  saveAlbumPhotos,
  setAlbumCoverPhoto,
  updateFavoriteSelectionStatus,
  updatePhotoBibsManually,
  updateAlbum
} from "@/lib/albums";
import { requireAdminSession } from "@/lib/auth-guard";
import { hashPassword } from "@/lib/password";

const albumSchema = z.object({
  title: z.string().trim().min(3, "Agrega un nombre para el album."),
  clientName: z.string().trim().min(2, "Agrega el nombre del cliente o evento."),
  description: z.string().trim().optional(),
  eventDate: z.string().optional(),
  status: z.nativeEnum(AlbumStatus),
  visibility: z.nativeEnum(AlbumVisibility),
  coverPosition: z.nativeEnum(CoverPosition).optional(),
  coverFocusX: z.coerce.number().min(0).max(100).optional(),
  coverFocusY: z.coerce.number().min(0).max(100).optional(),
  password: z.string().trim().optional(),
  allowSingleDownload: z.boolean(),
  allowFavoritesDownload: z.boolean(),
  allowFullDownload: z.boolean(),
  bibRecognitionEnabled: z.boolean()
});

export async function createAlbumAction(formData: FormData) {
  await requireAdminSession("/appfotos/admin/albums/new");
  const parsed = albumSchema.parse({
    title: formData.get("title"),
    clientName: formData.get("clientName"),
    description: formData.get("description"),
    eventDate: formData.get("eventDate") || undefined,
    status: formData.get("status"),
    visibility: formData.get("visibility"),
    coverPosition: formData.get("coverPosition") || undefined,
    coverFocusX: formData.get("coverFocusX") || undefined,
    coverFocusY: formData.get("coverFocusY") || undefined,
    password: formData.get("password") || undefined,
    allowSingleDownload: formData.get("allowSingleDownload") === "on",
    allowFavoritesDownload: formData.get("allowFavoritesDownload") === "on",
    allowFullDownload: formData.get("allowFullDownload") === "on",
    bibRecognitionEnabled: formData.get("bibRecognitionEnabled") === "on"
  });

  if (parsed.visibility === AlbumVisibility.PASSWORD && (!parsed.password || parsed.password.length < 4)) {
    throw new Error("La contrasena del album debe tener al menos 4 caracteres.");
  }

  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const album = await createAlbum({
    ...parsed,
    passwordHash: parsed.visibility === AlbumVisibility.PASSWORD && parsed.password ? hashPassword(parsed.password) : null
  });

  if (photos.length > 0) {
    await saveAlbumPhotos(album.id, photos);
  }

  revalidatePath("/appfotos/admin");
  revalidatePath("/appfotos/admin/albums");
  revalidatePath("/");
  redirect(`/appfotos/admin/albums/${album.id}`);
}

export async function uploadAlbumPhotosAction(formData: FormData) {
  await requireAdminSession("/appfotos/admin/albums");
  const albumId = z.string().cuid().parse(formData.get("albumId"));
  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (photos.length === 0) {
    redirect(`/appfotos/admin/albums/${albumId}`);
  }

  await saveAlbumPhotos(albumId, photos);

  revalidatePath(`/appfotos/admin/albums/${albumId}`);
  revalidatePath("/appfotos/admin/albums");
  revalidatePath("/appfotos/admin");
  redirect(`/appfotos/admin/albums/${albumId}?uploaded=1`);
}

export async function setAlbumCoverAction(formData: FormData) {
  await requireAdminSession("/appfotos/admin/albums");
  const albumId = z.string().cuid().parse(formData.get("albumId"));
  const photoId = z.string().cuid().parse(formData.get("photoId"));
  const slug = z.string().parse(formData.get("slug"));

  await setAlbumCoverPhoto(albumId, photoId);

  revalidatePath(`/appfotos/admin/albums/${albumId}`);
  revalidatePath("/appfotos/admin/albums");
  revalidatePath("/appfotos/admin");
  revalidatePath(`/appfotos/g/${slug}`);
  redirect(`/appfotos/admin/albums/${albumId}?saved=1`);
}

export async function moveAlbumPhotoAction(formData: FormData) {
  await requireAdminSession("/appfotos/admin/albums");
  const albumId = z.string().cuid().parse(formData.get("albumId"));
  const photoId = z.string().cuid().parse(formData.get("photoId"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));

  await moveAlbumPhoto(albumId, photoId, direction);

  revalidatePath(`/appfotos/admin/albums/${albumId}`);
  revalidatePath("/appfotos/admin/albums");
  revalidatePath(`/appfotos/g/${formData.get("slug")}`);
  redirect(`/appfotos/admin/albums/${albumId}?saved=1`);
}

export async function updateAlbumAction(formData: FormData) {
  await requireAdminSession("/appfotos/admin/albums");
  const albumId = z.string().cuid().parse(formData.get("albumId"));
  const previousSlug = z.string().parse(formData.get("slug"));
  const parsed = albumSchema.parse({
    title: formData.get("title"),
    clientName: formData.get("clientName"),
    description: formData.get("description"),
    eventDate: formData.get("eventDate") || undefined,
    status: formData.get("status"),
    visibility: formData.get("visibility"),
    coverPosition: formData.get("coverPosition") || undefined,
    coverFocusX: formData.get("coverFocusX") || undefined,
    coverFocusY: formData.get("coverFocusY") || undefined,
    password: formData.get("password") || undefined,
    allowSingleDownload: formData.get("allowSingleDownload") === "on",
    allowFavoritesDownload: formData.get("allowFavoritesDownload") === "on",
    allowFullDownload: formData.get("allowFullDownload") === "on",
    bibRecognitionEnabled: formData.get("bibRecognitionEnabled") === "on"
  });

  const currentAlbum = await getAlbumPasswordMetaById(albumId);

  if (!currentAlbum) {
    redirect("/appfotos/admin/albums");
  }

  if (parsed.visibility === AlbumVisibility.PASSWORD && !currentAlbum.passwordHash && (!parsed.password || parsed.password.length < 4)) {
    throw new Error("La contrasena del album debe tener al menos 4 caracteres.");
  }

  const album = await updateAlbum(albumId, {
    ...parsed,
    passwordHash:
      parsed.visibility === AlbumVisibility.PASSWORD
        ? parsed.password && parsed.password.length >= 4
          ? hashPassword(parsed.password)
          : undefined
        : null
  });

  revalidatePath(`/appfotos/admin/albums/${albumId}`);
  revalidatePath("/appfotos/admin/albums");
  revalidatePath("/appfotos/admin");
  revalidatePath("/");
  revalidatePath(`/appfotos/g/${previousSlug}`);
  revalidatePath(`/appfotos/g/${album.slug}`);
  redirect(`/appfotos/admin/albums/${albumId}?saved=1`);
}

export async function processAlbumBibRecognitionAction(formData: FormData) {
  await requireAdminSession("/appfotos/admin/albums");
  const albumId = z.string().cuid().parse(formData.get("albumId"));
  try {
    const result = await processAlbumBibRecognition(albumId);

    revalidatePath(`/appfotos/admin/albums/${albumId}`);
    revalidatePath("/appfotos/admin/albums");
    revalidatePath("/appfotos/admin");
    revalidatePath(`/appfotos/g/${result.slug}`);
    redirect(
      `/appfotos/admin/albums/${albumId}?ocr=1&recognized=${result.recognizedCount}&processed=${result.processedCount}&failed=${result.failedCount}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar OCR.";
    redirect(`/appfotos/admin/albums/${albumId}?ocrError=${encodeURIComponent(message)}`);
  }
}

export async function deleteAlbumPhotoAction(formData: FormData) {
  await requireAdminSession("/appfotos/admin/albums");
  const albumId = z.string().cuid().parse(formData.get("albumId"));
  const photoId = z.string().cuid().parse(formData.get("photoId"));
  const slug = z.string().parse(formData.get("slug"));

  await deleteAlbumPhoto(albumId, photoId);

  revalidatePath(`/appfotos/admin/albums/${albumId}`);
  revalidatePath("/appfotos/admin/albums");
  revalidatePath("/appfotos/admin");
  revalidatePath(`/appfotos/g/${slug}`);
  redirect(`/appfotos/admin/albums/${albumId}?photoDeleted=1`);
}

export async function deleteAlbumAction(formData: FormData) {
  await requireAdminSession("/appfotos/admin/albums");
  const albumId = z.string().cuid().parse(formData.get("albumId"));

  const deletedAlbum = await deleteAlbum(albumId);

  revalidatePath("/appfotos/admin");
  revalidatePath("/appfotos/admin/albums");
  revalidatePath("/");

  if (deletedAlbum) {
    revalidatePath(`/appfotos/g/${deletedAlbum.slug}`);
  }

  redirect("/appfotos/admin/albums");
}

export async function deleteFavoriteSelectionAction(formData: FormData) {
  await requireAdminSession("/appfotos/admin/albums");
  const albumId = z.string().cuid().parse(formData.get("albumId"));
  const selectionId = z.string().cuid().parse(formData.get("selectionId"));

  await deleteFavoriteSelection(selectionId, albumId);

  revalidatePath(`/appfotos/admin/albums/${albumId}`);
  revalidatePath("/appfotos/admin/albums");
  revalidatePath("/appfotos/admin");
  redirect(`/appfotos/admin/albums/${albumId}?saved=1`);
}

export async function updateFavoriteSelectionStatusAction(formData: FormData) {
  await requireAdminSession("/appfotos/admin/albums");
  const albumId = z.string().cuid().parse(formData.get("albumId"));
  const selectionId = z.string().cuid().parse(formData.get("selectionId"));
  const status = z.nativeEnum(FavoriteSelectionStatus).parse(formData.get("status"));

  await updateFavoriteSelectionStatus(selectionId, albumId, status);

  revalidatePath(`/appfotos/admin/albums/${albumId}`);
  revalidatePath("/appfotos/admin/albums");
  revalidatePath("/appfotos/admin");
  redirect(`/appfotos/admin/albums/${albumId}?saved=1`);
}

export async function processPhotoBibRecognitionAction(formData: FormData) {
  await requireAdminSession("/appfotos/admin/albums");
  const albumId = z.string().cuid().parse(formData.get("albumId"));
  const photoId = z.string().cuid().parse(formData.get("photoId"));

  try {
    const result = await processSinglePhotoBibRecognition(albumId, photoId);
    revalidatePath(`/appfotos/admin/albums/${albumId}`);
    revalidatePath(`/appfotos/g/${result.slug}`);
    redirect(`/appfotos/admin/albums/${albumId}?ocrPhoto=1`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo reintentar OCR en la foto.";
    redirect(`/appfotos/admin/albums/${albumId}?ocrError=${encodeURIComponent(message)}`);
  }
}

export async function updatePhotoBibsManualAction(formData: FormData) {
  await requireAdminSession("/appfotos/admin/albums");
  const albumId = z.string().cuid().parse(formData.get("albumId"));
  const photoId = z.string().cuid().parse(formData.get("photoId"));
  const rawValue = formData.get("manualBibs");
  const rawBibs = typeof rawValue === "string" ? rawValue : "";

  try {
    const result = await updatePhotoBibsManually(
      albumId,
      photoId,
      rawBibs
        .split(/[,\s]+/)
        .map((value) => value.trim())
        .filter(Boolean)
    );
    revalidatePath(`/appfotos/admin/albums/${albumId}`);
    revalidatePath(`/appfotos/g/${result.slug}`);
    redirect(`/appfotos/admin/albums/${albumId}?ocrManual=1`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el bib manual.";
    redirect(`/appfotos/admin/albums/${albumId}?ocrError=${encodeURIComponent(message)}`);
  }
}
