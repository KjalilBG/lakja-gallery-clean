import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { processNextAlbumPhotoPreviewBatch } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeJsonValue } from "@/lib/sanitize";

export const maxDuration = 300;
const DRAIN_TIME_BUDGET_MS = 20_000;

const bodySchema = z.object({
  action: z.enum(["process-next", "drain"]).default("drain")
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-album-photo-preview-process",
    maxRequests: 90,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  try {
    const body = bodySchema.parse(sanitizeJsonValue(await request.json().catch(() => ({}))));
    const startedAt = Date.now();
    let iterations = 0;
    let result = await processNextAlbumPhotoPreviewBatch(id);

    if (body.action === "drain") {
      while (!result.completed && result.remaining > 0 && Date.now() - startedAt < DRAIN_TIME_BUDGET_MS) {
        iterations += 1;
        result = await processNextAlbumPhotoPreviewBatch(id);
      }
    }

    revalidatePath(`/appfotos/admin/albums/${id}`);
    revalidatePath("/appfotos/admin/albums");
    revalidatePath("/appfotos/admin");

    return NextResponse.json({
      ok: true,
      iterations,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo procesar la cola de previews." },
      { status: 400 }
    );
  }
}
