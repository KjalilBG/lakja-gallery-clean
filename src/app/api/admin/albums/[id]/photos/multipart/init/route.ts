import path from "node:path";

import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { buildR2StorageKey, isR2Configured } from "@/lib/r2";

export const maxDuration = 60;

const initSchema = z.object({
  albumId: z.string().cuid(),
  fileName: z.string().trim().min(1),
  contentType: z.string().trim().optional()
});

function sanitizeFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, extension);
  const normalized = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${normalized || "foto"}${extension || ".jpg"}`;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  if (!isR2Configured()) {
    return NextResponse.json({ ok: false, error: "R2 no esta configurado." }, { status: 501 });
  }

  const { id } = await params;
  const body = initSchema.parse(await request.json());

  if (body.albumId !== id) {
    return NextResponse.json({ ok: false, error: "Album invalido." }, { status: 400 });
  }

  const safeName = sanitizeFileName(body.fileName);
  const uniqueBaseName = `${Date.now()}-${crypto.randomUUID()}-${path.parse(safeName).name}`;
  const objectKey = `albums/${body.albumId}/originals/${uniqueBaseName}${path.extname(safeName) || ".jpg"}`;
  const uploadId = crypto.randomUUID();

  return NextResponse.json({
    ok: true,
    uploadId,
    objectKey,
    storageKey: buildR2StorageKey("originals", objectKey),
    chunkSizeBytes: 3 * 1024 * 1024
  });
}
