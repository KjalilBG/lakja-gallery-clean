import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { saveAlbumPhotoFromStorage } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { abortMultipartUpload, completeMultipartUpload, isR2Configured, removeFromR2 } from "@/lib/r2";
import { sanitizeJsonValue } from "@/lib/sanitize";
import { assertValidImageUpload } from "@/lib/upload-security";

export const maxDuration = 60;

const completeSchema = z.object({
  albumId: z.string().cuid(),
  uploadId: z.string().min(1),
  objectKey: z.string().min(1),
  fileName: z.string().trim().min(1),
  sizeBytes: z.number().int().nonnegative(),
  contentType: z.string().trim().optional(),
  lastModified: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  parts: z.array(
    z.object({
      partNumber: z.number().int().min(1),
      etag: z.string().min(1)
    })
  ).min(1)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-upload-multipart-complete",
    maxRequests: 300,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  if (!isR2Configured()) {
    return NextResponse.json({ ok: false, error: "R2 no esta configurado." }, { status: 501 });
  }

  let parsedBody: z.infer<typeof completeSchema> | null = null;
  let completedStorageKey: string | null = null;

  try {
    const { id } = await params;
    const body = completeSchema.parse(sanitizeJsonValue(await request.json()));
    parsedBody = body;

    if (body.albumId !== id) {
      return NextResponse.json({ ok: false, error: "Album invalido." }, { status: 400 });
    }

    assertValidImageUpload({
      fileName: body.fileName,
      contentType: body.contentType,
      sizeBytes: body.sizeBytes
    });

    completedStorageKey = await completeMultipartUpload({
      bucket: "originals",
      key: body.objectKey,
      uploadId: body.uploadId,
      parts: body.parts
    });

    await saveAlbumPhotoFromStorage({
      albumId: body.albumId,
      filename: body.fileName,
      originalStorageKey: completedStorageKey,
      sizeBytes: body.sizeBytes,
      contentType: body.contentType,
      lastModified: body.lastModified,
      sortOrder: body.sortOrder
    });

    revalidatePath(`/appfotos/admin/albums/${body.albumId}`);
    revalidatePath("/appfotos/admin/albums");
    revalidatePath("/appfotos/admin");

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (parsedBody) {
      if (completedStorageKey) {
        await removeFromR2(completedStorageKey).catch(() => undefined);
      } else {
        await abortMultipartUpload({
          bucket: "originals",
          key: parsedBody.objectKey,
          uploadId: parsedBody.uploadId
        }).catch(() => undefined);
      }
    }

    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage("No se pudo completar la foto.", error) },
      { status: 400 }
    );
  }
}
