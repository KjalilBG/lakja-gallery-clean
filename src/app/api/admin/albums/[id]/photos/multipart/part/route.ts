import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { buildR2StorageKey, isR2Configured, uploadToR2 } from "@/lib/r2";

export const maxDuration = 60;

const paramsSchema = z.object({
  albumId: z.string().cuid(),
  uploadId: z.string().min(1),
  objectKey: z.string().min(1),
  partNumber: z.coerce.number().int().min(1)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  if (!isR2Configured()) {
    return NextResponse.json({ ok: false, error: "R2 no esta configurado." }, { status: 501 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const body = paramsSchema.parse({
    albumId: formData.get("albumId"),
    uploadId: formData.get("uploadId"),
    objectKey: formData.get("objectKey"),
    partNumber: formData.get("partNumber")
  });

  if (body.albumId !== id) {
    return NextResponse.json({ ok: false, error: "Album invalido." }, { status: 400 });
  }

  const chunk = formData.get("chunk");

  if (!(chunk instanceof File) || chunk.size === 0) {
    return NextResponse.json({ ok: false, error: "No llego el fragmento." }, { status: 400 });
  }

  const chunkKey = `tmp/${body.albumId}/${body.uploadId}/${String(body.partNumber).padStart(4, "0")}.part`;

  await uploadToR2({
    bucket: "originals",
    key: chunkKey,
    body: Buffer.from(await chunk.arrayBuffer()),
    contentType: "application/octet-stream"
  });

  return NextResponse.json({ ok: true, chunkKey: buildR2StorageKey("originals", chunkKey) });
}
