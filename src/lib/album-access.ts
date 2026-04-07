import { createHash, timingSafeEqual } from "node:crypto";

function resolveAlbumAccessSecret() {
  const configuredSecret = process.env.ALBUM_ACCESS_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "lakja-dev-album-access-secret";
  }

  throw new Error("Configura ALBUM_ACCESS_SECRET o NEXTAUTH_SECRET para proteger los albumes privados.");
}

const ACCESS_SECRET = resolveAlbumAccessSecret();

export function getAlbumAccessCookieName(slug: string) {
  return `lakja-album-access-${slug}`;
}

export function createAlbumAccessToken(slug: string, passwordHash: string) {
  return createHash("sha256").update(`${slug}:${passwordHash}:${ACCESS_SECRET}`).digest("hex");
}

export function verifyAlbumAccessToken(slug: string, passwordHash: string, token?: string | null) {
  if (!token) return false;

  const expectedToken = createAlbumAccessToken(slug, passwordHash);
  const expectedBuffer = Buffer.from(expectedToken);
  const receivedBuffer = Buffer.from(token);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
