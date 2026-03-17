import { NextResponse } from "next/server";

import { readFromR2 } from "@/lib/r2";

type MediaRouteContext = {
  params: Promise<{ bucket: string; key: string[] }>;
};

export async function GET(_: Request, context: MediaRouteContext) {
  const { bucket, key } = await context.params;
  const storageKey = `r2://${bucket}/${key.join("/")}`;

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
