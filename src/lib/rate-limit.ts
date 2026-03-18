import { NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  label: string;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __lakjaRateLimitStore?: Map<string, RateLimitBucket>;
};

const rateLimitStore = globalForRateLimit.__lakjaRateLimitStore ?? new Map<string, RateLimitBucket>();

if (!globalForRateLimit.__lakjaRateLimitStore) {
  globalForRateLimit.__lakjaRateLimitStore = rateLimitStore;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function checkRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const clientIp = getClientIp(request);
  const key = `${options.label}:${clientIp}`;
  const currentBucket = rateLimitStore.get(key);

  if (!currentBucket || currentBucket.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs
    });
    return null;
  }

  if (currentBucket.count >= options.maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((currentBucket.resetAt - now) / 1000));
    return NextResponse.json(
      { ok: false, error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds)
        }
      }
    );
  }

  currentBucket.count += 1;
  rateLimitStore.set(key, currentBucket);
  return null;
}

export function getSafeErrorMessage(defaultMessage: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return defaultMessage;
  }

  return error instanceof Error ? error.message : defaultMessage;
}
