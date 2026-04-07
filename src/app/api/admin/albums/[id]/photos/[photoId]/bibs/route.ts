import { NextResponse } from "next/server";
import { z } from "zod";

import { processSinglePhotoBibRecognition, updatePhotoBibsManually } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeJsonValue, sanitizeTextInput } from "@/lib/sanitize";

const bodySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("ocr")
  }),
  z.object({
    mode: z.literal("manual"),
    bibs: z.array(z.string().transform((value) => sanitizeTextInput(value))).default([])
  })
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-photo-bibs",
    maxRequests: 60,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { id, photoId } = await params;

  try {
    const body = bodySchema.parse(sanitizeJsonValue(await request.json().catch(() => ({}))));

    const result =
      body.mode === "ocr"
        ? await processSinglePhotoBibRecognition(id, photoId)
        : await updatePhotoBibsManually(id, photoId, body.bibs);

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo actualizar el bib." },
      { status: 400 }
    );
  }
}
