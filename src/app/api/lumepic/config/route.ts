import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { getLumepicStoredConfig, saveLumepicStoredConfig } from "@/lib/lumepic/settings";
import { sanitizeJsonValue } from "@/lib/sanitize";

export const runtime = "nodejs";

const lumepicConfigSchema = z.object({
  version: z.literal(1),
  activeEvents: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        name: z.string().trim(),
        eventUrl: z.string().trim(),
        selfieUrl: z.string().trim().optional()
      })
    )
    .length(3),
  instagramHandle: z.string().trim().min(1),
  successMessageTemplates: z.array(z.string().trim()).length(3),
  noPhotosMessageTemplates: z.array(z.string().trim()).length(3)
});

export async function GET() {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const config = await getLumepicStoredConfig();
  return NextResponse.json({ ok: true, config });
}

export async function POST(request: Request) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const body = lumepicConfigSchema.parse(sanitizeJsonValue(await request.json()));
    const config = await saveLumepicStoredConfig(body);

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la configuracion de Lumepic.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
