import path from "node:path";

import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";

import { getDownloadableAlbumPhotos, readPhotoBinary } from "@/lib/albums";

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
  const { slug } = await context.params;
  const album = await getDownloadableAlbumPhotos(slug);

  if (!album) {
    return NextResponse.json({ error: "Album no encontrado." }, { status: 404 });
  }

  const type = request.nextUrl.searchParams.get("type");
  const favoritesParam = request.nextUrl.searchParams.get("favorites");
  const favoriteIds = favoritesParam?.split(",").filter(Boolean) ?? [];

  if (type === "favorites" && !album.allowFavoritesDownload) {
    return NextResponse.json({ error: "La descarga de favoritas no esta habilitada." }, { status: 403 });
  }

  if (type === "all" && !album.allowFullDownload) {
    return NextResponse.json({ error: "La descarga completa no esta habilitada." }, { status: 403 });
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

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`
    }
  });
}
