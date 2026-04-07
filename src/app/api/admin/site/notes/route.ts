import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession, isSuperAdminEmail } from "@/lib/auth";
import { getSafeErrorMessage } from "@/lib/rate-limit";
import { saveAdminNotebookByEmail } from "@/lib/admin-notes";

const saveNotesSchema = z.object({
  content: z.string().max(50000, "Las notas superan el limite permitido.")
});

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  if (!isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ ok: false, error: "Sin permisos de super admin." }, { status: 403 });
  }

  try {
    const body = saveNotesSchema.parse(await request.json());
    const notebook = await saveAdminNotebookByEmail(session.user.email, body.content);

    return NextResponse.json({
      ok: true,
      content: notebook.content,
      updatedAt: notebook.updatedAt.toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage("No se pudieron guardar las notas.", error) },
      { status: 400 }
    );
  }
}
