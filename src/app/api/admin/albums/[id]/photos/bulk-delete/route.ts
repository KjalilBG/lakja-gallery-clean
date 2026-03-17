import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteAlbumPhotos } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const { id } = await params;
  const body = z
    .object({
      slug: z.string(),
      photoIds: z.array(z.string().cuid()).min(1)
    })
    .parse(await request.json());

  await deleteAlbumPhotos(id, body.photoIds);

  revalidatePath(`/admin/albums/${id}`);
  revalidatePath("/admin/albums");
  revalidatePath("/admin");
  revalidatePath(`/g/${body.slug}`);

  return NextResponse.json({ ok: true });
}
