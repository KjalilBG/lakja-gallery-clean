import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { retryAlbumMissingPhotoDerivatives } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { sanitizeJsonValue } from "@/lib/sanitize";

const bodySchema = z.object({
  slug: z.string().trim().min(1).optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-photo-retry-derivatives",
    maxRequests: 20,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id } = await params;
    const body = bodySchema.parse(sanitizeJsonValue(await request.json().catch(() => ({}))));
    const result = await retryAlbumMissingPhotoDerivatives(id);

    revalidatePath(`/appfotos/admin/albums/${id}`);
    revalidatePath("/appfotos/admin/albums");
    revalidatePath("/appfotos/admin");

    if (body.slug) {
      revalidatePath(`/appfotos/g/${body.slug}`);
    }

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage("No se pudieron reintentar las derivadas faltantes.", error) },
      { status: 400 }
    );
  }
}
