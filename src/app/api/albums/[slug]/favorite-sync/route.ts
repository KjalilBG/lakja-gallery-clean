import { NextResponse } from "next/server";
import { z } from "zod";

import { syncAlbumFavorites } from "@/lib/albums";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { sanitizeJsonValue } from "@/lib/sanitize";

const payloadSchema = z.object({
  sessionId: z.string().min(8),
  photoIds: z.array(z.string().cuid()).max(2000)
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const rateLimitResponse = checkRateLimit(request, {
      label: "favorites-sync",
      maxRequests: 60,
      windowMs: 60 * 1000
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { slug } = await params;
    const payload = payloadSchema.parse(sanitizeJsonValue(await request.json()));
    const result = await syncAlbumFavorites({
      slug,
      sessionId: payload.sessionId,
      photoIds: payload.photoIds
    });

    if (!result) {
      return NextResponse.json({ ok: false, error: "Álbum no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, favoriteCount: result.favoriteCount });
  } catch (error) {
    const message = getSafeErrorMessage("No se pudieron sincronizar las favoritas.", error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
