import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { saveAlbumPhotos } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { sanitizeTextInput } from "@/lib/sanitize";
import { assertValidImageUpload, MAX_PHOTOS_PER_REQUEST } from "@/lib/upload-security";

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-upload-direct",
    maxRequests: 40,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id } = await params;
    const formData = await request.formData();
    const albumId = z.string().cuid().parse(sanitizeTextInput(String(formData.get("albumId") ?? "")));

    if (albumId !== id) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const photos = formData
      .getAll("photos")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (photos.length === 0) {
      return NextResponse.json({ ok: false, error: "No hay fotos para subir." }, { status: 400 });
    }

    if (photos.length > MAX_PHOTOS_PER_REQUEST) {
      return NextResponse.json({ ok: false, error: "Reduce la cantidad de fotos por carga." }, { status: 400 });
    }

    for (const photo of photos) {
      assertValidImageUpload({
        fileName: photo.name,
        contentType: photo.type,
        sizeBytes: photo.size
      });
    }
    await saveAlbumPhotos(albumId, photos);

    revalidatePath(`/appfotos/admin/albums/${albumId}`);
    revalidatePath("/appfotos/admin/albums");
    revalidatePath("/appfotos/admin");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: getSafeErrorMessage("No se pudo completar la carga.", error) }, { status: 400 });
  }
}
