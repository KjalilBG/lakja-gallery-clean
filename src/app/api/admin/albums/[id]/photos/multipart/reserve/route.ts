import { NextResponse } from "next/server";
import { z } from "zod";

import { reserveAlbumPhotoSortOrders } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { sanitizeJsonValue } from "@/lib/sanitize";

export const maxDuration = 30;

const reserveSchema = z.object({
  albumId: z.string().cuid(),
  totalFiles: z.number().int().min(1).max(500)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-upload-multipart-reserve",
    maxRequests: 60,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id } = await params;
    const body = reserveSchema.parse(sanitizeJsonValue(await request.json()));

    if (body.albumId !== id) {
      return NextResponse.json({ ok: false, error: "Album invalido." }, { status: 400 });
    }

    const sortOrders = await reserveAlbumPhotoSortOrders(body.albumId, body.totalFiles);
    return NextResponse.json({ ok: true, sortOrders });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage("No se pudo preparar el orden de subida.", error) },
      { status: 400 }
    );
  }
}
