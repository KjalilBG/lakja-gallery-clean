import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { checkLumepicByBib } from "@/lib/lumepic/check-lumepic";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeJsonValue } from "@/lib/sanitize";

export const runtime = "nodejs";
export const maxDuration = 60;

const customEventSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, "Agrega un nombre para el evento rapido."),
  eventUrl: z.string().trim().url("Agrega un link valido de Lumepic."),
  selfieUrl: z.string().trim().url("Agrega un link valido para selfie.").optional().or(z.literal("")),
  instagramHandle: z.string().trim().optional(),
  successMessageTemplates: z.array(z.string().trim()).length(3).optional(),
  noPhotosMessageTemplates: z.array(z.string().trim()).length(3).optional()
});

const lumepicRequestSchema = z
  .object({
    eventId: z.string().trim().optional(),
    customEvent: customEventSchema.optional(),
    bibNumber: z.string().trim().regex(/^\d+$/, "Escribe un numero de competidor valido.")
  })
  .superRefine((value, context) => {
    if (!value.eventId && !value.customEvent) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona o configura un evento antes de buscar.",
        path: ["eventId"]
      });
    }
  });

export async function POST(request: Request) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "lumepic-check",
    maxRequests: 30,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = lumepicRequestSchema.parse(sanitizeJsonValue(await request.json()));
    const result = await checkLumepicByBib({
      eventId: body.eventId,
      customEvent: body.customEvent
        ? {
            ...body.customEvent,
            selfieUrl: body.customEvent.selfieUrl || undefined
          }
        : undefined,
      bibNumber: body.bibNumber
    });

    if (!result.success) {
      const status = result.errorCode === "EVENT_NOT_FOUND" ? 404 : result.errorCode === "INVALID_INPUT" ? 400 : 502;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar la consulta.";

    return NextResponse.json(
      {
        success: false,
        status: "error",
        hasPhotos: null,
        bibNumber: "",
        eventId: "",
        eventName: null,
        resultUrl: null,
        selfieUrl: null,
        message: null,
        reason: message,
        errorCode: "INVALID_INPUT"
      },
      { status: 400 }
    );
  }
}
