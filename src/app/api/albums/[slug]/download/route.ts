import { NextRequest, NextResponse } from "next/server";
import path from "node:path";

import {
  buildBrandedPhotoFileName,
  getDownloadableAlbumPhotos,
  getOrCreateAlbumDownloadArchive,
  getSignedPhotoDownloadUrl,
  recordAlbumDownload
} from "@/lib/albums";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { sanitizeJsonValue, sanitizeTextInput } from "@/lib/sanitize";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const rateLimitResponse = checkRateLimit(request, {
    label: "album-download",
    maxRequests: 8,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { slug } = await context.params;
    const album = await getDownloadableAlbumPhotos(slug);

    if (!album) {
      return NextResponse.json({ error: "Álbum no encontrado." }, { status: 404 });
    }

    const type = sanitizeTextInput(request.nextUrl.searchParams.get("type") ?? "");
    const favoritesParam = sanitizeTextInput(request.nextUrl.searchParams.get("favorites") ?? "", { maxLength: 5000 });
    const photoId = sanitizeTextInput(request.nextUrl.searchParams.get("photoId") ?? "");
    const sessionId = sanitizeTextInput(request.nextUrl.searchParams.get("sessionId") ?? "");
    const favoriteIds = favoritesParam
      ? favoritesParam
          .split(",")
          .map((value) => sanitizeTextInput(value))
          .filter(Boolean)
      : [];

    if (type === "favorites" && !album.allowFavoritesDownload) {
      return NextResponse.json({ error: "La descarga de favoritas no esta habilitada." }, { status: 403 });
    }

    if (type === "all" && !album.allowFullDownload) {
      return NextResponse.json({ error: "La descarga completa no esta habilitada." }, { status: 403 });
    }

    if (type === "all" && album.fullDownloadPasswordHash) {
      return NextResponse.json(
        { error: "Esta descarga completa necesita una contraseña y debe iniciarse desde la galería." },
        { status: 401 }
      );
    }

    if (type === "single") {
      if (!album.allowSingleDownload) {
        return NextResponse.json({ error: "La descarga individual no esta habilitada." }, { status: 403 });
      }

      if (!photoId) {
        return NextResponse.json({ error: "No se encontró la foto solicitada." }, { status: 400 });
      }

      const photo = album.photos.find((item) => item.id === photoId);

      if (!photo) {
        return NextResponse.json({ error: "No se encontró la foto solicitada." }, { status: 404 });
      }
      const extension = path.extname(photo.filename) || ".jpg";
      const downloadName = buildBrandedPhotoFileName(`${photo.sortOrder + 1} - ${album.title}`, extension);
      const signedUrl = await getSignedPhotoDownloadUrl(photo.originalKey, downloadName);

      if (sessionId) {
        await recordAlbumDownload({
          slug,
          sessionId,
          type: "SINGLE",
          photoId: photo.id
        });
      }

      return NextResponse.redirect(signedUrl, { status: 302 });
    }

    const selectedPhotos =
      type === "favorites" ? album.photos.filter((photo) => favoriteIds.includes(photo.id)) : album.photos;

    if (selectedPhotos.length === 0) {
      return NextResponse.json({ error: "No hay fotos para descargar." }, { status: 400 });
    }
    const archive = await getOrCreateAlbumDownloadArchive({
      albumId: album.id,
      albumTitle: album.title,
      type: type === "favorites" ? "favorites" : "all",
      photos: selectedPhotos
    });

    if (sessionId) {
      await recordAlbumDownload({
        slug,
        sessionId,
        type: type === "favorites" ? "FAVORITES_ZIP" : "FULL_ZIP"
      });
    }

    return NextResponse.redirect(archive.signedUrl, { status: 302 });
  } catch (error) {
    return NextResponse.json({ error: getSafeErrorMessage("No se pudo preparar la descarga.", error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimitResponse = checkRateLimit(request, {
    label: "album-download-post",
    maxRequests: 8,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { slug } = await context.params;
    const album = await getDownloadableAlbumPhotos(slug);

    if (!album) {
      return NextResponse.json({ error: "Álbum no encontrado." }, { status: 404 });
    }

    const body = sanitizeJsonValue(await request.json()) as Record<string, unknown>;
    const rawType = typeof body.type === "string" ? body.type : "";
    const rawSessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const rawDownloadPassword = typeof body.downloadPassword === "string" ? body.downloadPassword : "";
    const type = sanitizeTextInput(rawType);
    const sessionId = sanitizeTextInput(rawSessionId);
    const downloadPassword = sanitizeTextInput(rawDownloadPassword, { maxLength: 200 });

    if (type !== "all") {
      return NextResponse.json({ error: "Tipo de descarga no soportado." }, { status: 400 });
    }

    if (!album.allowFullDownload) {
      return NextResponse.json({ error: "La descarga completa no esta habilitada." }, { status: 403 });
    }

    if (album.fullDownloadPasswordHash) {
      if (!downloadPassword) {
        return NextResponse.json({ error: "Escribe la contraseña para descargar el álbum completo." }, { status: 401 });
      }

      if (!verifyPassword(downloadPassword, album.fullDownloadPasswordHash)) {
        return NextResponse.json({ error: "La contraseña de descarga no es correcta." }, { status: 403 });
      }
    }

    if (album.photos.length === 0) {
      return NextResponse.json({ error: "No hay fotos para descargar." }, { status: 400 });
    }

    const archive = await getOrCreateAlbumDownloadArchive({
      albumId: album.id,
      albumTitle: album.title,
      type: "all",
      photos: album.photos
    });

    if (sessionId) {
      await recordAlbumDownload({
        slug,
        sessionId,
        type: "FULL_ZIP"
      });
    }

    return NextResponse.json({ ok: true, signedUrl: archive.signedUrl });
  } catch (error) {
    return NextResponse.json({ error: getSafeErrorMessage("No se pudo preparar la descarga.", error) }, { status: 500 });
  }
}
