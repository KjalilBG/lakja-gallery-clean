import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import sharp from "sharp";
import { NextResponse } from "next/server";

import { ensureSuperAdminApiRequest } from "@/lib/auth-guard";
import { isR2Configured, toMediaRoute, uploadToR2 } from "@/lib/r2";
import { assertValidImageUpload } from "@/lib/upload-security";

export const maxDuration = 60;

function sanitizeFileName(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export async function POST(request: Request) {
  const unauthorizedResponse = await ensureSuperAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("Selecciona una imagen valida.");
    }

    assertValidImageUpload({
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size
    });

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const optimizedBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({ width: 1600, height: 900, fit: "cover", withoutEnlargement: false })
      .jpeg({ quality: 88 })
      .toBuffer();

    const fileBaseName = sanitizeFileName(file.name.replace(path.extname(file.name), "")) || `share-${Date.now()}`;
    const key = `site/share/${Date.now()}-${fileBaseName}.jpg`;

    if (isR2Configured()) {
      const storageKey = await uploadToR2({
        bucket: "derivatives",
        key,
        body: optimizedBuffer,
        contentType: "image/jpeg"
      });

      return NextResponse.json({
        ok: true,
        shareImageUrl: toMediaRoute(storageKey)
      });
    }

    const relativePath = `/uploads/site/share/${Date.now()}-${fileBaseName}.jpg`;
    const absolutePath = path.join(process.cwd(), "public", relativePath.replace("/uploads/", "uploads/"));

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, optimizedBuffer);

    return NextResponse.json({
      ok: true,
      shareImageUrl: relativePath
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo subir la imagen social." },
      { status: 400 }
    );
  }
}
