"use client";

export const MAX_FILES_PER_REQUEST = 1;

export type UploadQueuePhase = "queued" | "uploading" | "processing" | "done" | "error";

export type UploadQueueItem = {
  id: string;
  file: File;
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
  storageKey: string;
  chunkSizeBytes: number;
};

type MultipartPart = {
  partNumber: number;
  chunkKey: string;
};

async function uploadSinglePhotoThroughProxy(params: {
  albumId: string;
  item: UploadQueueItem;
  fileIndex: number;
  totalFiles: number;
  onProgress?: (progress: UploadBatchProgress) => void;
}) {
  const { albumId, item, fileIndex, totalFiles, onProgress } = params;

  await new Promise<void>((resolve, reject) => {
    const formData = new FormData();
    formData.append("albumId", albumId);
    formData.append("photos", item.file);

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
  });
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

  return new Promise<string>((resolve, reject) => {
    const formData = new FormData();
    formData.append("albumId", albumId);
    formData.append("uploadId", uploadId);
    formData.append("objectKey", objectKey);
    formData.append("partNumber", String(partNumber));
    formData.append("chunk", chunk, `${item.file.name}.part-${partNumber}`);

    const request = new XMLHttpRequest();
    request.open("POST", `/api/admin/albums/${albumId}/photos/multipart/part`);

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
        const response = JSON.parse(request.responseText) as { chunkKey?: string };

        if (!response.chunkKey) {
          reject(new Error(`R2 no confirmo el fragmento de ${item.file.name}.`));
          return;
        }

        resolve(response.chunkKey);
        return;
      }

      reject(new Error(`No se pudo subir ${item.file.name}.`));
    };

    request.onerror = () => reject(new Error(`Fallo la carga de ${item.file.name}.`));
    request.send(formData);
  });
}

async function uploadSinglePhotoMultipart(params: {
  albumId: string;
  item: UploadQueueItem;
  fileIndex: number;
  totalFiles: number;
  onProgress?: (progress: UploadBatchProgress) => void;
}) {
  const { albumId, item, fileIndex, totalFiles, onProgress } = params;
  const initResponse = await fetch(`/api/admin/albums/${albumId}/photos/multipart/init`, {
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
  });

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
    const chunkKey = await uploadChunk({
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
    parts.push({ partNumber, chunkKey });
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

  const finalizeResponse = await fetch(`/api/admin/albums/${albumId}/photos/multipart/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      albumId,
      uploadId: initData.uploadId,
      objectKey: initData.objectKey,
      storageKey: initData.storageKey,
      fileName: item.file.name,
      sizeBytes: item.file.size,
      contentType: item.file.type,
      lastModified: item.file.lastModified,
      parts
    })
  });

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

export async function uploadPhotoBatches({
  albumId,
  files,
  onProgress
}: {
  albumId: string;
  files: UploadQueueItem[];
  onProgress?: (progress: UploadBatchProgress) => void;
}) {
  const totalFiles = files.length;

  for (let fileIndex = 0; fileIndex < files.length; fileIndex += MAX_FILES_PER_REQUEST) {
    const currentItem = files[fileIndex];

    try {
      await uploadSinglePhotoMultipart({
        albumId,
        item: currentItem,
        fileIndex,
        totalFiles,
        onProgress
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : `No se pudo completar ${currentItem.file.name}.`;

      onProgress?.({
        fileId: currentItem.id,
        fileName: currentItem.file.name,
        fileIndex: fileIndex + 1,
        totalFiles,
        overallPercent: Math.round((fileIndex / totalFiles) * 100),
        filePercent: 0,
        phase: "error",
        error: message
      });

      throw new Error(message);
    }
  }

  return { totalFiles };
}
