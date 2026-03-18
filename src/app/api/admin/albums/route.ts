import { AlbumStatus, AlbumVisibility, CoverPosition } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAlbum } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { hashPassword } from "@/lib/password";
import { checkRateLimit, getSafeErrorMessage } from "@/lib/rate-limit";

const createAlbumSchema = z.object({
  title: z.string().trim().min(3, "Agrega un nombre para el album."),
  clientName: z.string().trim().min(2, "Agrega el nombre del cliente o evento."),
  description: z.string().trim().optional(),
  eventDate: z.string().optional(),
  status: z.nativeEnum(AlbumStatus),
  visibility: z.nativeEnum(AlbumVisibility),
  coverPosition: z.nativeEnum(CoverPosition).optional(),
  coverFocusX: z.coerce.number().min(0).max(100).optional(),
  coverFocusY: z.coerce.number().min(0).max(100).optional(),
  password: z.string().trim().optional(),
  allowSingleDownload: z.boolean(),
  allowFavoritesDownload: z.boolean(),
  allowFullDownload: z.boolean()
});

export async function POST(request: Request) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-create-album",
    maxRequests: 20,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const parsed = createAlbumSchema.parse(body);

    if (parsed.visibility === AlbumVisibility.PASSWORD && (!parsed.password || parsed.password.length < 4)) {
      return NextResponse.json(
        { ok: false, error: "La contrasena del album debe tener al menos 4 caracteres." },
        { status: 400 }
      );
    }

    const album = await createAlbum({
      ...parsed,
      passwordHash: parsed.visibility === AlbumVisibility.PASSWORD && parsed.password ? hashPassword(parsed.password) : null
    });

    return NextResponse.json({
      ok: true,
      albumId: album.id,
      slug: album.slug
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: getSafeErrorMessage("No se pudo crear el album.", error) }, { status: 400 });
  }
}
