import path from "node:path";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/tiff"
]);

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif", ".tif", ".tiff"]);

export const MAX_PHOTO_FILE_SIZE_BYTES = 30 * 1024 * 1024;
// R2/S3 multipart uploads require every non-final part to be at least 5 MiB.
// Using 8 MiB avoids completeMultipartUpload failures on 4-8 MiB photos and
// also reduces request overhead for larger batches.
export const MAX_PHOTO_CHUNK_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_PHOTOS_PER_REQUEST = 10;

export function isAllowedImageExtension(fileName: string) {
  return allowedExtensions.has(path.extname(fileName).toLowerCase());
}

export function isAllowedImageMimeType(contentType: string | null | undefined) {
  return Boolean(contentType && allowedMimeTypes.has(contentType.toLowerCase()));
}

export function assertValidImageUpload(params: {
  fileName: string;
  contentType?: string | null;
  sizeBytes: number;
}) {
  if (!isAllowedImageExtension(params.fileName)) {
    throw new Error("Solo se permiten archivos de imagen compatibles.");
  }

  if (!isAllowedImageMimeType(params.contentType)) {
    throw new Error("El tipo de archivo no es valido para una foto.");
  }

  if (params.sizeBytes <= 0 || params.sizeBytes > MAX_PHOTO_FILE_SIZE_BYTES) {
    throw new Error("La foto excede el limite permitido.");
  }
}

export function sanitizeWhatsAppNumber(input: string) {
  return input.replace(/\D+/g, "");
}
