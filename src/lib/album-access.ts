import { createHash, timingSafeEqual } from "node:crypto";

const ACCESS_SECRET = process.env.ALBUM_ACCESS_SECRET ?? "lakja-access-secret";

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
