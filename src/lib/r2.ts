import { Readable } from "node:stream";

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID ?? "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/$/, "") ?? "";

export const r2Buckets = {
  originals: process.env.R2_BUCKET_ORIGINALS ?? "lakja-originals",
  derivatives: process.env.R2_BUCKET_DERIVATIVES ?? "lakja-derivatives"
} as const;

type BucketKind = keyof typeof r2Buckets;

export function isAllowedR2BucketName(bucketName: string) {
  return Object.values(r2Buckets).includes(bucketName as (typeof r2Buckets)[BucketKind]);
}

let client: S3Client | null = null;

function getClient() {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }

  return client;
}

export function isR2Configured() {
  return Boolean(accountId && accessKeyId && secretAccessKey);
}

export function buildR2StorageKey(bucket: BucketKind, key: string) {
  return `r2://${r2Buckets[bucket]}/${key}`;
}

function encodeStorageKey(key: string) {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function parseStorageKey(input: string) {
  if (!input.startsWith("r2://")) {
    return null;
  }

  const withoutProtocol = input.replace("r2://", "");
  const slashIndex = withoutProtocol.indexOf("/");

  if (slashIndex === -1) {
    return null;
  }

  return {
    bucket: withoutProtocol.slice(0, slashIndex),
    key: withoutProtocol.slice(slashIndex + 1)
  };
}

export function hasPublicR2BaseUrl() {
  return Boolean(publicBaseUrl);
}

export function toPublicMediaUrl(input: string) {
  const parsed = parseStorageKey(input);

  if (!parsed || !publicBaseUrl) {
    return null;
  }

  const bucketAwareBaseUrl = publicBaseUrl.includes("{bucket}")
    ? publicBaseUrl.replace("{bucket}", encodeURIComponent(parsed.bucket))
    : `${publicBaseUrl}/${encodeURIComponent(parsed.bucket)}`;

  return `${bucketAwareBaseUrl}/${encodeStorageKey(parsed.key)}`;
}

export function toMediaRoute(input: string) {
  const publicUrl = toPublicMediaUrl(input);

  if (publicUrl) {
    return publicUrl;
  }

  const parsed = parseStorageKey(input);
  if (!parsed) {
    return input;
  }

  return `/api/media/${encodeURIComponent(parsed.bucket)}/${encodeStorageKey(parsed.key)}`;
}

export async function uploadToR2(params: {
  bucket: BucketKind;
  key: string;
  body: Buffer;
  contentType?: string;
}) {
  const r2Client = getClient();

  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2Buckets[params.bucket],
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType ?? "application/octet-stream"
    })
  );

  return buildR2StorageKey(params.bucket, params.key);
}

export async function createMultipartUpload(params: {
  bucket: BucketKind;
  key: string;
  contentType?: string;
}) {
  const r2Client = getClient();
  const response = await r2Client.send(
    new CreateMultipartUploadCommand({
      Bucket: r2Buckets[params.bucket],
      Key: params.key,
      ContentType: params.contentType ?? "application/octet-stream"
    })
  );

  if (!response.UploadId) {
    throw new Error("No se pudo iniciar la carga multipart en R2.");
  }

  return response.UploadId;
}

export async function uploadMultipartPart(params: {
  bucket: BucketKind;
  key: string;
  uploadId: string;
  partNumber: number;
  body: Buffer;
}) {
  const r2Client = getClient();
  const response = await r2Client.send(
    new UploadPartCommand({
      Bucket: r2Buckets[params.bucket],
      Key: params.key,
      UploadId: params.uploadId,
      PartNumber: params.partNumber,
      Body: params.body
    })
  );

  if (!response.ETag) {
    throw new Error("R2 no devolvio el ETag del fragmento.");
  }

  return response.ETag;
}

export async function completeMultipartUpload(params: {
  bucket: BucketKind;
  key: string;
  uploadId: string;
  parts: Array<{ etag: string; partNumber: number }>;
}) {
  const r2Client = getClient();
  await r2Client.send(
    new CompleteMultipartUploadCommand({
      Bucket: r2Buckets[params.bucket],
      Key: params.key,
      UploadId: params.uploadId,
      MultipartUpload: {
        Parts: params.parts
          .slice()
          .sort((left, right) => left.partNumber - right.partNumber)
          .map((part) => ({
            ETag: part.etag,
            PartNumber: part.partNumber
          }))
      }
    })
  );

  return buildR2StorageKey(params.bucket, params.key);
}

export async function abortMultipartUpload(params: {
  bucket: BucketKind;
  key: string;
  uploadId: string;
}) {
  const r2Client = getClient();
  await r2Client.send(
    new AbortMultipartUploadCommand({
      Bucket: r2Buckets[params.bucket],
      Key: params.key,
      UploadId: params.uploadId
    })
  );
}

async function bodyToBuffer(body: unknown) {
  if (!body) {
    return Buffer.alloc(0);
  }

  if (body instanceof Readable) {
    const chunks: Buffer[] = [];

    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (typeof body === "string") {
    return Buffer.from(body);
  }

  if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function") {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(bytes);
  }

  throw new Error("No se pudo leer el objeto de R2.");
}

export async function readFromR2(storageKey: string) {
  const parsed = parseStorageKey(storageKey);

  if (!parsed) {
    throw new Error("Storage key invalida.");
  }

  const r2Client = getClient();
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: parsed.bucket,
      Key: parsed.key
    })
  );

  return {
    contentType: response.ContentType ?? "application/octet-stream",
    body: await bodyToBuffer(response.Body)
  };
}

export async function removeFromR2(storageKey: string) {
  const parsed = parseStorageKey(storageKey);

  if (!parsed) {
    return;
  }

  const r2Client = getClient();
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: parsed.bucket,
      Key: parsed.key
    })
  );
}
