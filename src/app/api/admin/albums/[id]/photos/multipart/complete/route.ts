import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { saveAlbumPhotoFromStorage } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { isR2Configured, readFromR2, removeFromR2, uploadToR2 } from "@/lib/r2";

export const maxDuration = 60;

const completeSchema = z.object({
  albumId: z.string().cuid(),
  uploadId: z.string().min(1),
  objectKey: z.string().min(1),
  storageKey: z.string().min(1),
  fileName: z.string().trim().min(1),
  sizeBytes: z.number().int().nonnegative(),
  contentType: z.string().trim().optional(),
  lastModified: z.number().int().nonnegative().optional(),
  parts: z.array(
    z.object({
      partNumber: z.number().int().min(1),
      chunkKey: z.string().min(1)
    })
  ).min(1)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  if (!isR2Configured()) {
    return NextResponse.json({ ok: false, error: "R2 no esta configurado." }, { status: 501 });
  }

  const { id } = await params;
  const body = completeSchema.parse(await request.json());

  if (body.albumId !== id) {
    return NextResponse.json({ ok: false, error: "Album invalido." }, { status: 400 });
  }

  try {
    const chunkBuffers = await Promise.all(
      body.parts
        .slice()
        .sort((left, right) => left.partNumber - right.partNumber)
        .map(async (part) => {
          const { body: chunkBuffer } = await readFromR2(part.chunkKey);
          return chunkBuffer;
        })
    );

    const originalBuffer = Buffer.concat(chunkBuffers);

    await uploadToR2({
      bucket: "originals",
      key: body.objectKey,
      body: originalBuffer,
      contentType: body.contentType || "application/octet-stream"
    });

    await saveAlbumPhotoFromStorage({
      albumId: body.albumId,
      filename: body.fileName,
      originalStorageKey: body.storageKey,
      sizeBytes: body.sizeBytes,
      contentType: body.contentType,
      lastModified: body.lastModified
    });

    await Promise.all(body.parts.map((part) => removeFromR2(part.chunkKey).catch(() => undefined)));
  } catch (error) {
    await Promise.all(body.parts.map((part) => removeFromR2(part.chunkKey).catch(() => undefined)));

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo completar la foto." },
      { status: 500 }
    );
  }

  revalidatePath(`/admin/albums/${body.albumId}`);
  revalidatePath("/admin/albums");
  revalidatePath("/admin");

  return NextResponse.json({ ok: true });
}
