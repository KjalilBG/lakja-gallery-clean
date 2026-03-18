import { NextResponse } from "next/server";
import { z } from "zod";

import { enqueueAlbumBibRecognitionJob, processNextBibRecognitionBatch } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";

export const maxDuration = 300;

const bodySchema = z.object({
  action: z.enum(["enqueue", "process-next"]).default("enqueue"),
  mode: z.enum(["all", "pending"]).default("pending"),
  batchSize: z.number().int().min(5).max(50).default(25)
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const { id } = await params;

  try {
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const result =
      body.action === "process-next"
        ? await processNextBibRecognitionBatch(id)
        : await enqueueAlbumBibRecognitionJob(id, body.mode, body.batchSize);

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo procesar OCR." },
      { status: 400 }
    );
  }
}
