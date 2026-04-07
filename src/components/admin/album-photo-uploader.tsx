"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, LoaderCircle, UploadCloud, X } from "lucide-react";

import { MAX_FILES_PER_REQUEST, type UploadQueueItem, type UploadQueuePhase, uploadPhotoBatches } from "@/components/admin/upload-photo-batches";

type AlbumPhotoUploaderProps = {
  albumId: string;
};

type UploadPhase = "idle" | "uploading" | "processing";
type QueuedPhoto = UploadQueueItem & {
  status: UploadQueuePhase;
  progress: number;
  error?: string;
};

export function AlbumPhotoUploader({ albumId }: AlbumPhotoUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<QueuedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadError, setUploadError] = useState("");
  const [batchLabel, setBatchLabel] = useState("");

  const totalSizeLabel = useMemo(() => {
    const totalBytes = queuedFiles.reduce((sum, file) => sum + file.file.size, 0);
    const totalMb = totalBytes / (1024 * 1024);
    return `${totalMb.toFixed(1)} MB`;
  }, [queuedFiles]);

  function appendFiles(fileList: FileList | null) {
    if (!fileList) return;

    const incomingFiles = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    setQueuedFiles((current) => [
      ...current,
      ...incomingFiles.map((file) => ({
        id: window.crypto.randomUUID(),
        file,
        status: "queued" as const,
        progress: 0
      }))
    ]);
  }

  function removeQueuedFile(fileId: string) {
    setQueuedFiles((current) => current.filter((file) => file.id !== fileId));
  }

  async function uploadFiles() {
    if (queuedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    setProgress(0);
    setPhase("uploading");
    setUploadError("");
    setBatchLabel("");

    try {
      await uploadPhotoBatches({
        albumId,
        files: queuedFiles.map(({ id, file }) => ({ id, file })),
        onProgress: ({ fileId, fileIndex, totalFiles, overallPercent, filePercent, phase: nextPhase, error }) => {
          setProgress(overallPercent);
          setPhase(nextPhase === "processing" ? "processing" : "uploading");
          setBatchLabel(`Foto ${fileIndex} de ${totalFiles}`);
          setQueuedFiles((current) =>
            current.map((item) =>
              item.id === fileId
                ? {
                    ...item,
                    status: nextPhase,
                    progress: filePercent,
                    error
                  }
                : item
            )
          );
        }
      });

      setPhase("processing");
      setProgress(100);
      setQueuedFiles((current) => current.map((item) => ({ ...item, status: "done", progress: 100, error: undefined })));
      router.push(`/appfotos/admin/albums/${albumId}?uploaded=1`);
      router.refresh();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "No se pudieron subir las fotos.");
      setPhase("idle");
      setBatchLabel("");
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
    setPhase("idle");
    setBatchLabel("");
  }

  const progressLabel =
    phase === "processing"
      ? `Procesando ${batchLabel || "fotos"}...`
      : `Subiendo ${progress}%${batchLabel ? ` · ${batchLabel}` : ""}`;

  const progressHint =
    phase === "processing"
      ? "La foto actual ya termino de enviarse. Ahora estamos guardando, optimizando y ordenando las fotos."
      : queuedFiles.length > 1
        ? `La carga se hace con bloques optimizados para que el navegador y el servidor trabajen con menos esperas. Flujo actual: ${MAX_FILES_PER_REQUEST} foto(s) a la vez.`
        : "El porcentaje llegara al 100% solo cuando las fotos esten listas dentro del album.";

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          appendFiles(event.dataTransfer.files);
        }}
        className={`rounded-[28px] border border-dashed px-6 py-10 text-center transition ${
          isDragging ? "border-lime-400 bg-lime-50" : "border-slate-300 bg-slate-50"
        }`}
      >
        <input
          ref={inputRef}
          name="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => appendFiles(event.target.files)}
          className="hidden"
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <UploadCloud className="size-6" />
        </div>
        <p className="mt-4 text-base font-bold text-slate-900">Arrastra fotos aqui o elige archivos</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Carga multiple con progreso visual para armar el album mucho mas rapido.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 inline-flex items-center rounded-full bg-lime-500 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_12px_26px_rgba(101,163,13,0.28)] transition hover:bg-lime-600"
        >
          <ImagePlus className="mr-2 size-4" />
          Elegir fotos
        </button>
      </div>

      {queuedFiles.length > 0 ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Cola de subida</p>
              <p className="mt-1 text-sm text-slate-500">
                {queuedFiles.length} archivo(s) preparados · {totalSizeLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setQueuedFiles([])}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-900"
            >
              Limpiar
            </button>
          </div>

          <div className="mt-4 max-h-64 space-y-2 overflow-auto">
            {queuedFiles.map((file) => (
              <div key={file.id} className="space-y-2 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{file.file.name}</p>
                    <p className="text-xs font-medium text-slate-500">{(file.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-extrabold uppercase tracking-[0.14em] ${
                      file.status === "done"
                        ? "text-lime-600"
                        : file.status === "error"
                          ? "text-rose-600"
                          : file.status === "processing"
                            ? "text-fuchsia-600"
                            : file.status === "uploading"
                              ? "text-sky-600"
                              : "text-slate-400"
                    }`}>
                      {file.status === "done"
                        ? "Lista"
                        : file.status === "error"
                          ? "Error"
                          : file.status === "processing"
                            ? "Procesando"
                            : file.status === "uploading"
                              ? "Subiendo"
                              : "En cola"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQueuedFile(file.id)}
                      disabled={isUploading && (file.status === "uploading" || file.status === "processing")}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Quitar archivo"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      file.status === "done"
                        ? "bg-lime-500"
                        : file.status === "error"
                          ? "bg-rose-500"
                          : "bg-[linear-gradient(90deg,#84cc16,#d946ef)]"
                    }`}
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
                {file.error ? <p className="text-xs font-bold text-rose-600">{file.error}</p> : null}
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#84cc16,#d946ef)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500">{progressHint}</p>
            {uploadError ? (
              <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {uploadError}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void uploadFiles()}
              disabled={isUploading}
              className="inline-flex w-full items-center justify-center rounded-full bg-fuchsia-500 px-5 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_14px_26px_rgba(217,70,239,0.26)] transition hover:bg-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploading ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <UploadCloud className="mr-2 size-4" />}
              {isUploading ? progressLabel : "Subir fotos al album"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
