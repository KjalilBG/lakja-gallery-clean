import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rate-limit";
import { isAllowedR2BucketName, readFromR2 } from "@/lib/r2";
import { sanitizeStoragePath, sanitizeTextInput } from "@/lib/sanitize";

type MediaRouteContext = {
  params: Promise<{ bucket: string; key: string[] }>;
};

export async function GET(request: Request, context: MediaRouteContext) {
  const rateLimitResponse = checkRateLimit(request, {
    label: "media-read",
    maxRequests: 240,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { bucket, key } = await context.params;
  const sanitizedBucket = sanitizeTextInput(bucket);

  if (!isAllowedR2BucketName(sanitizedBucket)) {
    return NextResponse.json({ error: "Bucket no permitido." }, { status: 400 });
  }

  let sanitizedKey: string;

  try {
    sanitizedKey = sanitizeStoragePath(key.map((segment) => sanitizeTextInput(segment)).join("/"));
  } catch {
    return NextResponse.json({ error: "Ruta no valida." }, { status: 400 });
  }

  const storageKey = `r2://${sanitizedBucket}/${sanitizedKey}`;

  try {
    const file = await readFromR2(storageKey);

    return new NextResponse(new Uint8Array(file.body), {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
  }
}
