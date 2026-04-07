import path from "node:path";

import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";

import { getDownloadableAlbumPhotos, readPhotoBinary, recordAlbumDownload } from "@/lib/albums";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { sanitizeTextInput } from "@/lib/sanitize";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function cleanZipName(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

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
      return NextResponse.json({ error: "Album no encontrado." }, { status: 404 });
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

    if (type === "single") {
      if (!album.allowSingleDownload) {
        return NextResponse.json({ error: "La descarga individual no esta habilitada." }, { status: 403 });
      }

      if (!photoId) {
        return NextResponse.json({ error: "No se encontro la foto solicitada." }, { status: 400 });
      }

      const photo = album.photos.find((item) => item.id === photoId);

      if (!photo) {
        return NextResponse.json({ error: "No se encontro la foto solicitada." }, { status: 404 });
      }

      const file = await readPhotoBinary(photo.originalKey);
      const extension = path.extname(photo.filename) || ".jpg";
      const downloadName = `${buildDownloadPhotoName(album.title, photo.sortOrder)}${extension}`;

      if (sessionId) {
        await recordAlbumDownload({
          slug,
          sessionId,
          type: "SINGLE",
          photoId: photo.id
        });
      }

      return new NextResponse(new Uint8Array(file.body), {
        headers: {
          "Content-Type": file.contentType,
          "Content-Disposition": `attachment; filename="${downloadName}"`
        }
      });
    }

    const selectedPhotos =
      type === "favorites" ? album.photos.filter((photo) => favoriteIds.includes(photo.id)) : album.photos;

    if (selectedPhotos.length === 0) {
      return NextResponse.json({ error: "No hay fotos para descargar." }, { status: 400 });
    }

    const zip = new JSZip();

    for (const [index, photo] of selectedPhotos.entries()) {
      const fileBuffer = await readPhotoBinary(photo.originalKey);
      const extension = path.extname(photo.filename) || ".jpg";
      const albumBasedName = `${index + 1} - ${album.title}${extension}`;

      zip.file(albumBasedName, fileBuffer.body);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipName = `${cleanZipName(album.title)}-${type === "favorites" ? "favoritas" : "album"}.zip`;

    if (sessionId) {
      await recordAlbumDownload({
        slug,
        sessionId,
        type: type === "favorites" ? "FAVORITES_ZIP" : "FULL_ZIP"
      });
    }

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: getSafeErrorMessage("No se pudo preparar la descarga.", error) }, { status: 500 });
  }
}

function buildDownloadPhotoName(albumTitle: string, sortOrder: number) {
  return `${sortOrder + 1} - ${albumTitle}`;
}
