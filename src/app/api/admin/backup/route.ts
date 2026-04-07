import { NextResponse } from "next/server";

import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { buildAdminBackupZip } from "@/lib/admin-backup";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-backup",
    maxRequests: 3,
    windowMs: 60 * 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { buffer, fileName } = await buildAdminBackupZip();
    const body = new Uint8Array(buffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo generar el backup." },
      { status: 500 }
    );
  }
}
