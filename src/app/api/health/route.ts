import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const rateLimitResponse = checkRateLimit(request, {
    label: "health-check",
    maxRequests: 60,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  return NextResponse.json({
    status: "ok",
    service: "lakja-gallery",
    timestamp: new Date().toISOString()
  });
}
