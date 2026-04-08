import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { createSignedMultipartPartUrl, isR2Configured } from "@/lib/r2";
import { sanitizeJsonValue } from "@/lib/sanitize";
import { MAX_PHOTO_CHUNK_SIZE_BYTES } from "@/lib/upload-security";

export const maxDuration = 60;

const paramsSchema = z.object({
  albumId: z.string().cuid(),
  uploadId: z.string().min(1),
  objectKey: z.string().min(1),
  partNumber: z.number().int().min(1)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-upload-multipart-part",
    maxRequests: 3000,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  if (!isR2Configured()) {
    return NextResponse.json({ ok: false, error: "R2 no esta configurado." }, { status: 501 });
  }

  try {
    const { id } = await params;
    const body = paramsSchema.parse(sanitizeJsonValue(await request.json()));

    if (body.albumId !== id) {
      return NextResponse.json({ ok: false, error: "Album invalido." }, { status: 400 });
    }

    const signedUrl = await createSignedMultipartPartUrl({
      bucket: "originals",
      key: body.objectKey,
      uploadId: body.uploadId,
      partNumber: body.partNumber
    });

    return NextResponse.json({
      ok: true,
      signedUrl,
      maxChunkSizeBytes: MAX_PHOTO_CHUNK_SIZE_BYTES
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage("No se pudo firmar el fragmento.", error) },
      { status: 400 }
    );
  }
}
