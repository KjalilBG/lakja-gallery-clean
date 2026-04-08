"use client";

export const MAX_PARALLEL_UPLOADS = 3;
export const MAX_FILES_PER_REQUEST = MAX_PARALLEL_UPLOADS;
const MAX_UPLOAD_RETRIES = 2;
const RETRY_DELAY_MS = 1200;

export type UploadQueuePhase = "queued" | "uploading" | "processing" | "done" | "error";

export type UploadQueueItem = {
  id: string;
  file: File;
  sortOrder?: number;
  status?: UploadQueuePhase;
};

export type UploadBatchProgress = {
  fileId: string;
  fileName: string;
  fileIndex: number;
  totalFiles: number;
  overallPercent: number;
  filePercent: number;
  phase: UploadQueuePhase;
  error?: string;
};

type MultipartInitResponse = {
  ok: true;
  uploadId: string;
  objectKey: string;
  chunkSizeBytes: number;
};

type MultipartPart = {
  partNumber: number;
  etag: string;
};

type MultipartPartSignatureResponse = {
  ok: true;
  signedUrl: string;
  maxChunkSizeBytes: number;
};

type SortOrderReservationResponse = {
  ok: true;
  sortOrders: number[];
};

export type UploadBatchResult = {
  totalFiles: number;
  completedCount: number;
  failedCount: number;
  failures: Array<{ fileId: string; fileName: string; message: string }>;
  reservedSortOrders: Record<string, number>;
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function retryOperation<T>(operation: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_UPLOAD_RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === MAX_UPLOAD_RETRIES) {
        break;
      }

      await wait(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("La operacion de subida fallo.");
}

async function uploadSinglePhotoThroughProxy(params: {
  albumId: string;
  item: UploadQueueItem;
  fileIndex: number;
  totalFiles: number;
  sortOrder?: number;
  onProgress?: (progress: UploadBatchProgress) => void;
}) {
  const { albumId, item, fileIndex, totalFiles, sortOrder, onProgress } = params;

  await retryOperation(
    () =>
      new Promise<void>((resolve, reject) => {
    const formData = new FormData();
    formData.append("albumId", albumId);
    formData.append("photos", item.file);

    if (typeof sortOrder === "number") {
      formData.append("sortOrder", String(sortOrder));
    }

    const request = new XMLHttpRequest();
    request.open("POST", `/api/admin/albums/${albumId}/photos/upload`);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      const uploadRatio = event.loaded / event.total;
      const overallProgress = ((fileIndex + uploadRatio * 0.88) / totalFiles) * 100;

      onProgress?.({
        fileId: item.id,
        fileName: item.file.name,
        fileIndex: fileIndex + 1,
        totalFiles,
        overallPercent: Math.min(98, Math.round(overallProgress)),
        filePercent: Math.min(92, Math.round(uploadRatio * 90)),
        phase: "uploading"
      });

      if (event.loaded >= event.total) {
        onProgress?.({
          fileId: item.id,
          fileName: item.file.name,
          fileIndex: fileIndex + 1,
          totalFiles,
          overallPercent: Math.min(99, Math.round(((fileIndex + 0.92) / totalFiles) * 100)),
          filePercent: 95,
          phase: "processing"
        });
      }
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.({
          fileId: item.id,
          fileName: item.file.name,
          fileIndex: fileIndex + 1,
          totalFiles,
          overallPercent: Math.round(((fileIndex + 1) / totalFiles) * 100),
          filePercent: 100,
          phase: "done"
        });
        resolve();
      } else {
        const error = `No se pudo completar ${item.file.name}.`;
        onProgress?.({
          fileId: item.id,
          fileName: item.file.name,
          fileIndex: fileIndex + 1,
          totalFiles,
          overallPercent: Math.round((fileIndex / totalFiles) * 100),
          filePercent: 0,
          phase: "error",
          error
        });
        reject(new Error(error));
      }
    };

    request.onerror = () => {
      const error = `Fallo la carga de ${item.file.name}.`;
      onProgress?.({
        fileId: item.id,
        fileName: item.file.name,
        fileIndex: fileIndex + 1,
        totalFiles,
        overallPercent: Math.round((fileIndex / totalFiles) * 100),
        filePercent: 0,
        phase: "error",
        error
      });
      reject(new Error(error));
    };

        request.send(formData);
      })
  );
}

async function uploadChunk(params: {
  albumId: string;
  uploadId: string;
  objectKey: string;
  partNumber: number;
  chunk: Blob;
  item: UploadQueueItem;
  fileIndex: number;
  totalFiles: number;
  uploadedBytesBeforeChunk: number;
  fileSize: number;
  onProgress?: (progress: UploadBatchProgress) => void;
}) {
  const {
    albumId,
    uploadId,
    objectKey,
    partNumber,
    chunk,
    item,
    fileIndex,
    totalFiles,
    uploadedBytesBeforeChunk,
    fileSize,
    onProgress
  } = params;

  return retryOperation(
    async () => {
      const signatureResponse = await fetch(`/api/admin/albums/${albumId}/photos/multipart/part`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          albumId,
          uploadId,
          objectKey,
          partNumber
        })
      });

      if (!signatureResponse.ok) {
        const errorResponse = (await signatureResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorResponse?.error || `No se pudo preparar ${item.file.name}.`);
      }

      const signatureData = (await signatureResponse.json()) as MultipartPartSignatureResponse;

      return new Promise<string>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("PUT", signatureData.signedUrl);

        request.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;

          const bytesUploaded = uploadedBytesBeforeChunk + event.loaded;
          const uploadRatio = bytesUploaded / fileSize;
          const overallProgress = ((fileIndex + uploadRatio * 0.88) / totalFiles) * 100;

          onProgress?.({
            fileId: item.id,
            fileName: item.file.name,
            fileIndex: fileIndex + 1,
            totalFiles,
            overallPercent: Math.min(98, Math.round(overallProgress)),
            filePercent: Math.min(92, Math.round(uploadRatio * 90)),
            phase: "uploading"
          });
        };

        request.onload = () => {
          if (request.status >= 200 && request.status < 300) {
            const etag = request.getResponseHeader("ETag")?.replaceAll('"', "");

            if (!etag) {
              reject(
                new Error(
                  `R2 no devolvio el ETag de ${item.file.name}. Revisa el CORS del bucket para exponer el header ETag.`
                )
              );
              return;
            }

            resolve(etag);
            return;
          }

          reject(new Error(`No se pudo subir ${item.file.name} a R2.`));
        };

        request.onerror = () => reject(new Error(`Fallo la carga directa de ${item.file.name}.`));
        request.send(chunk);
      });
    }
  );
}

async function uploadSinglePhotoMultipart(params: {
  albumId: string;
  item: UploadQueueItem;
  fileIndex: number;
  totalFiles: number;
  sortOrder?: number;
  onProgress?: (progress: UploadBatchProgress) => void;
}) {
  const { albumId, item, fileIndex, totalFiles, sortOrder, onProgress } = params;
  const initResponse = await retryOperation(() =>
    fetch(`/api/admin/albums/${albumId}/photos/multipart/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        albumId,
        fileName: item.file.name,
        contentType: item.file.type,
        sizeBytes: item.file.size
      })
    })
  );

  if (initResponse.status === 501) {
    return uploadSinglePhotoThroughProxy(params);
  }

  if (!initResponse.ok) {
    throw new Error(`No se pudo preparar ${item.file.name}.`);
  }

  const initData = (await initResponse.json()) as MultipartInitResponse;
  const chunkSize = initData.chunkSizeBytes;
  const parts: MultipartPart[] = [];
  let uploadedBytes = 0;

  for (let offset = 0, partNumber = 1; offset < item.file.size; offset += chunkSize, partNumber += 1) {
    const chunk = item.file.slice(offset, Math.min(item.file.size, offset + chunkSize));
    const etag = await uploadChunk({
      albumId,
      uploadId: initData.uploadId,
      objectKey: initData.objectKey,
      partNumber,
      chunk,
      item,
      fileIndex,
      totalFiles,
      uploadedBytesBeforeChunk: uploadedBytes,
      fileSize: item.file.size,
      onProgress
    });

    uploadedBytes += chunk.size;
    parts.push({ partNumber, etag });
  }

  onProgress?.({
    fileId: item.id,
    fileName: item.file.name,
    fileIndex: fileIndex + 1,
    totalFiles,
    overallPercent: Math.min(99, Math.round(((fileIndex + 0.92) / totalFiles) * 100)),
    filePercent: 95,
    phase: "processing"
  });

  const finalizeResponse = await retryOperation(() =>
    fetch(`/api/admin/albums/${albumId}/photos/multipart/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        albumId,
        uploadId: initData.uploadId,
        objectKey: initData.objectKey,
        fileName: item.file.name,
        sizeBytes: item.file.size,
        contentType: item.file.type,
        lastModified: item.file.lastModified,
        sortOrder,
        parts
      })
    })
  );

  if (!finalizeResponse.ok) {
    const errorResponse = (await finalizeResponse.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorResponse?.error || `No se pudo completar ${item.file.name}.`);
  }

  onProgress?.({
    fileId: item.id,
    fileName: item.file.name,
    fileIndex: fileIndex + 1,
    totalFiles,
    overallPercent: Math.round(((fileIndex + 1) / totalFiles) * 100),
    filePercent: 100,
    phase: "done"
  });
}

async function reservePhotoSortOrders(albumId: string, totalFiles: number) {
  const response = await fetch(`/api/admin/albums/${albumId}/photos/multipart/reserve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      albumId,
      totalFiles
    })
  });

  if (!response.ok) {
    const errorResponse = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorResponse?.error || "No se pudo reservar el orden de las fotos.");
  }

  const data = (await response.json()) as SortOrderReservationResponse;

  if (!Array.isArray(data.sortOrders) || data.sortOrders.length !== totalFiles) {
    throw new Error("La reserva de orden no devolvio la cantidad esperada.");
  }

  return data.sortOrders;
}

function calculateOverallPercent(filePercents: number[]) {
  if (filePercents.length === 0) return 0;

  const totalPercent = filePercents.reduce((sum, value) => sum + value, 0);
  return Math.max(0, Math.min(100, Math.round(totalPercent / filePercents.length)));
}

function kickPhotoProcessing(albumId: string) {
  void fetch(`/api/admin/albums/${albumId}/photos/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action: "process-next" }),
    keepalive: true
  }).catch(() => undefined);
}

export async function uploadPhotoBatches({
  albumId,
  files,
  onProgress,
  onReservedSortOrders
}: {
  albumId: string;
  files: UploadQueueItem[];
  onProgress?: (progress: UploadBatchProgress) => void;
  onReservedSortOrders?: (reserved: Record<string, number>) => void;
}) {
  const uploadableItems = files.filter((item) => item.status !== "done");
  const totalFiles = files.length;
  const missingSortOrderItems = uploadableItems.filter((item) => typeof item.sortOrder !== "number");
  const newlyReservedSortOrders =
    missingSortOrderItems.length > 0 ? await reservePhotoSortOrders(albumId, missingSortOrderItems.length) : [];
  const reservedSortOrders = new Map<string, number>();

  let reservationIndex = 0;
  for (const item of files) {
    if (typeof item.sortOrder === "number") {
      reservedSortOrders.set(item.id, item.sortOrder);
      continue;
    }

    if (reservationIndex < newlyReservedSortOrders.length) {
      reservedSortOrders.set(item.id, newlyReservedSortOrders[reservationIndex]);
      reservationIndex += 1;
    }
  }

  const reservedSortOrderRecord = Object.fromEntries(reservedSortOrders.entries());
  onReservedSortOrders?.(reservedSortOrderRecord);

  const filePercents = new Array<number>(totalFiles).fill(0);
  const failures: Array<{ fileId: string; fileName: string; message: string }> = [];
  let completedCount = files.filter((item) => item.status === "done").length;
  let nextFileIndex = 0;

  async function runWorker() {
    while (nextFileIndex < uploadableItems.length) {
      const currentIndex = nextFileIndex;
      nextFileIndex += 1;

      const currentItem = uploadableItems[currentIndex];
      const originalIndex = files.findIndex((item) => item.id === currentItem.id);
      const progressIndex = originalIndex >= 0 ? originalIndex : currentIndex;

      try {
        await uploadSinglePhotoMultipart({
          albumId,
          item: currentItem,
          fileIndex: progressIndex,
          totalFiles,
          sortOrder: reservedSortOrders.get(currentItem.id),
          onProgress: (progress) => {
            filePercents[progressIndex] = progress.filePercent;

            onProgress?.({
              ...progress,
              overallPercent: calculateOverallPercent(filePercents)
            });
          }
        });
        kickPhotoProcessing(albumId);
        completedCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : `No se pudo completar ${currentItem.file.name}.`;
        failures.push({
          fileId: currentItem.id,
          fileName: currentItem.file.name,
          message
        });
        onProgress?.({
          fileId: currentItem.id,
          fileName: currentItem.file.name,
          fileIndex: progressIndex + 1,
          totalFiles,
          overallPercent: calculateOverallPercent(filePercents),
          filePercent: filePercents[progressIndex] || 0,
          phase: "error",
          error: message
        });
      }
    }
  }

  const workers = Array.from({ length: Math.min(MAX_PARALLEL_UPLOADS, uploadableItems.length) }, () => runWorker());
  await Promise.all(workers);

  return {
    totalFiles,
    completedCount,
    failedCount: failures.length,
    failures,
    reservedSortOrders: reservedSortOrderRecord
  } satisfies UploadBatchResult;
}
