import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { reorderAlbumPhotos } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { sanitizeJsonValue } from "@/lib/sanitize";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-photo-reorder",
    maxRequests: 80,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id } = await params;
    const body = z
      .object({
        slug: z.string(),
        orderedPhotoIds: z.array(z.string().cuid()).min(1)
      })
      .parse(sanitizeJsonValue(await request.json()));

    await reorderAlbumPhotos(id, body.orderedPhotoIds);

    revalidatePath(`/appfotos/admin/albums/${id}`);
    revalidatePath("/appfotos/admin/albums");
    revalidatePath("/appfotos/admin");
    revalidatePath(`/appfotos/g/${body.slug}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage("No se pudo actualizar el orden.", error) },
      { status: 400 }
    );
  }
}
