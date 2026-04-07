import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteAlbumPhotos } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { sanitizeJsonValue } from "@/lib/sanitize";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-photo-bulk-delete",
    maxRequests: 30,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id } = await params;
    const body = z
      .object({
        slug: z.string(),
        photoIds: z.array(z.string().cuid()).min(1)
      })
      .parse(sanitizeJsonValue(await request.json()));

    await deleteAlbumPhotos(id, body.photoIds);

    revalidatePath(`/appfotos/admin/albums/${id}`);
    revalidatePath("/appfotos/admin/albums");
    revalidatePath("/appfotos/admin");
    revalidatePath(`/appfotos/g/${body.slug}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage("No se pudieron eliminar las fotos.", error) },
      { status: 400 }
    );
  }
}
