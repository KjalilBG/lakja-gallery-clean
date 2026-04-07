import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAlbumView } from "@/lib/albums";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { sanitizeJsonValue } from "@/lib/sanitize";

const payloadSchema = z.object({
  sessionId: z.string().min(8)
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const rateLimitResponse = checkRateLimit(request, {
    label: "album-view",
    maxRequests: 24,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { slug } = await params;
    const payload = payloadSchema.parse(sanitizeJsonValue(await request.json()));
    const result = await recordAlbumView(slug, payload.sessionId);

    if (!result) {
      return NextResponse.json({ ok: false, error: "Album no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage("No se pudo registrar la visita.", error) },
      { status: 400 }
    );
  }
}
