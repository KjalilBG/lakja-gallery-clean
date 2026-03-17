import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { saveAlbumPhotos } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const { id } = await params;
  const formData = await request.formData();
  const albumId = z.string().cuid().parse(formData.get("albumId"));

  if (albumId !== id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (photos.length === 0) {
    return NextResponse.json({ ok: false, error: "No hay fotos para subir." }, { status: 400 });
  }

  await saveAlbumPhotos(albumId, photos);

  revalidatePath(`/admin/albums/${albumId}`);
  revalidatePath("/admin/albums");
  revalidatePath("/admin");

  return NextResponse.json({ ok: true });
}
