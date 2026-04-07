import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { setAlbumCoverPhoto } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";
import { sanitizeJsonValue } from "@/lib/sanitize";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-photo-cover",
    maxRequests: 60,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id } = await params;
    const body = z.object({ slug: z.string(), photoId: z.string().cuid() }).parse(sanitizeJsonValue(await request.json()));

    await setAlbumCoverPhoto(id, body.photoId);

    revalidatePath(`/appfotos/admin/albums/${id}`);
    revalidatePath("/appfotos/admin/albums");
    revalidatePath("/appfotos/admin");
    revalidatePath(`/appfotos/g/${body.slug}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage("No se pudo actualizar la portada.", error) },
      { status: 400 }
    );
  }
}
