import { NextResponse } from "next/server";
import { z } from "zod";

import { saveFavoriteSelection } from "@/lib/albums";

const payloadSchema = z.object({
  sessionId: z.string().min(8),
  clientName: z.string().min(2).max(80),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(500).optional().or(z.literal("")),
  photoIds: z.array(z.string().cuid()).min(1)
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const payload = payloadSchema.parse(await request.json());
    const result = await saveFavoriteSelection({
      slug,
      sessionId: payload.sessionId,
      clientName: payload.clientName,
      whatsapp: payload.whatsapp || undefined,
      message: payload.message || undefined,
      photoIds: payload.photoIds
    });

    if (!result) {
      return NextResponse.json({ ok: false, error: "Album no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, selectionId: result.id, albumTitle: result.albumTitle, serials: result.serials });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar la seleccion.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
