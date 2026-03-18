import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { saveAlbumPhotoFromStorage } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { isR2Configured, readFromR2, removeFromR2, uploadToR2 } from "@/lib/r2";
import { assertValidImageUpload } from "@/lib/upload-security";

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

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-upload-multipart-complete",
    maxRequests: 60,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  if (!isR2Configured()) {
    return NextResponse.json({ ok: false, error: "R2 no esta configurado." }, { status: 501 });
  }

  let parsedBody: z.infer<typeof completeSchema> | null = null;

  try {
    const { id } = await params;
    const body = completeSchema.parse(await request.json());
    parsedBody = body;

    if (body.albumId !== id) {
      return NextResponse.json({ ok: false, error: "Album invalido." }, { status: 400 });
    }

    assertValidImageUpload({
      fileName: body.fileName,
      contentType: body.contentType,
      sizeBytes: body.sizeBytes
    });

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

    if (originalBuffer.byteLength !== body.sizeBytes) {
      throw new Error("El archivo ensamblado no coincide con el tamano esperado.");
    }

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

    revalidatePath(`/admin/albums/${body.albumId}`);
    revalidatePath("/admin/albums");
    revalidatePath("/admin");

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (parsedBody) {
      await Promise.all(parsedBody.parts.map((part) => removeFromR2(part.chunkKey).catch(() => undefined)));
    }

    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage("No se pudo completar la foto.", error) },
      { status: 400 }
    );
  }
}
