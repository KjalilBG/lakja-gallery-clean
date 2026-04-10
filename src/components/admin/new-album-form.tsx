"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlbumStatus, AlbumVisibility } from "@prisma/client";
import { ImagePlus, LoaderCircle, UploadCloud, X } from "lucide-react";

import { MAX_FILES_PER_REQUEST, type UploadQueueItem, type UploadQueuePhase, uploadPhotoBatches } from "@/components/admin/upload-photo-batches";
import { Button } from "@/components/ui/button";

const optionCards = [
  {
    name: "allowSingleDownload",
    label: "Descarga individual",
    description: "Permite bajar una foto puntual desde la galeria."
  },
  {
    name: "allowFavoritesDownload",
    label: "Descarga de favoritas",
    description: "Ideal para que el cliente se lleve solo su seleccion."
  },
  {
    name: "allowFullDownload",
    label: "Descarga del album completo",
    description: "Activalo solo cuando quieras entregar todo sin filtros."
  }
] as const;

function PendingBar({ pending, progress, label }: { pending: boolean; progress: number; label: string }) {
  if (!pending) return null;

  return (
    <div className="space-y-3">
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#84cc16,#d946ef)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="inline-flex items-center text-sm font-bold text-slate-600">
        <LoaderCircle className="mr-2 size-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

type SubmitPhase = "idle" | "creating" | "uploading" | "processing";
type QueuedPhoto = UploadQueueItem & {
  status: UploadQueuePhase;
  progress: number;
  error?: string;
};

export function NewAlbumForm() {
  const router = useRouter();
  const [visibility, setVisibility] = useState<AlbumVisibility>(AlbumVisibility.PUBLIC_LINK);
  const [allowFullDownload, setAllowFullDownload] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<QueuedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitLabel, setSubmitLabel] = useState("Guardando album...");
  const [submitError, setSubmitError] = useState("");
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const [batchLabel, setBatchLabel] = useState("");
  const [uploadSummary, setUploadSummary] = useState<{ completed: number; failed: number } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function syncInputFiles(nextFiles: File[]) {
    if (!inputRef.current) return;

    const dataTransfer = new DataTransfer();
    nextFiles.forEach((file) => dataTransfer.items.add(file));
    inputRef.current.files = dataTransfer.files;
  }

  const totalSizeLabel = useMemo(() => {
    const totalBytes = queuedFiles.reduce((sum, file) => sum + file.file.size, 0);
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [queuedFiles]);

  function appendFiles(fileList: FileList | null) {
    if (!fileList) return;

    const incomingFiles = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    setQueuedFiles((current) => {
      const nextFiles = [
        ...current,
        ...incomingFiles.map((file) => ({
          id: window.crypto.randomUUID(),
          file,
          status: "queued" as const,
          progress: 0
        }))
      ];
      syncInputFiles(nextFiles.map((item) => item.file));
      return nextFiles;
    });
  }

  function removeQueuedFile(fileId: string) {
    setQueuedFiles((current) => {
      const nextFiles = current.filter((file) => file.id !== fileId);
      syncInputFiles(nextFiles.map((item) => item.file));
      return nextFiles;
    });
  }

  function clearQueuedFiles() {
    setQueuedFiles(() => {
      syncInputFiles([]);
      return [];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      title: String(formData.get("title") ?? ""),
      clientName: String(formData.get("clientName") ?? ""),
      description: String(formData.get("description") ?? ""),
      eventDate: String(formData.get("eventDate") ?? ""),
      status: String(formData.get("status") ?? AlbumStatus.DRAFT),
      visibility: String(formData.get("visibility") ?? AlbumVisibility.PUBLIC_LINK),
      coverPosition: "CENTER",
      coverFocusX: 50,
      coverFocusY: 50,
      password: String(formData.get("password") ?? ""),
      fullDownloadPassword: String(formData.get("fullDownloadPassword") ?? ""),
      allowSingleDownload: formData.get("allowSingleDownload") === "on",
      allowFavoritesDownload: formData.get("allowFavoritesDownload") === "on",
      allowFullDownload: formData.get("allowFullDownload") === "on"
    };

    setIsSubmitting(true);
    setSubmitError("");
    setProgress(8);
    setSubmitPhase("creating");
    setSubmitLabel("Guardando album...");
    setBatchLabel("");
    setUploadSummary(null);

    try {
      const createResponse = await fetch("/api/admin/albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const createdAlbum = (await createResponse.json()) as { ok?: boolean; albumId?: string; error?: string };

      if (!createResponse.ok || !createdAlbum.albumId) {
        throw new Error(createdAlbum.error || "No se pudo crear el album.");
      }

      if (queuedFiles.length > 0) {
        setSubmitPhase("uploading");
        setSubmitLabel("Subiendo fotos...");

        const result = await uploadPhotoBatches({
          albumId: createdAlbum.albumId,
          files: queuedFiles.map(({ id, file, sortOrder, status }) => ({ id, file, sortOrder, status })),
          onReservedSortOrders: (reservedSortOrders) => {
            setQueuedFiles((current) =>
              current.map((item) => ({
                ...item,
                sortOrder: reservedSortOrders[item.id] ?? item.sortOrder
              }))
            );
          },
          onProgress: ({ fileId, fileIndex, totalFiles, overallPercent, filePercent, phase, error }) => {
            setSubmitPhase(phase === "processing" ? "processing" : "uploading");
            setBatchLabel(`Foto ${fileIndex} de ${totalFiles}`);
            setSubmitLabel(
              phase === "processing" ? `Procesando foto ${fileIndex} de ${totalFiles}...` : `Subiendo foto ${fileIndex} de ${totalFiles}...`
            );
            setProgress(10 + Math.round(overallPercent * 0.9));
            setQueuedFiles((current) =>
              current.map((item) =>
                item.id === fileId
                  ? {
                      ...item,
                      status: phase,
                      progress: filePercent,
                      error
                    }
                  : item
              )
            );
          }
        });

        setUploadSummary({ completed: result.completedCount, failed: result.failedCount });

        if (result.failedCount > 0) {
          throw new Error(
            result.failedCount === 1
              ? "1 foto no se pudo subir. El álbum sí se creó y las fotos completadas conservaron su orden."
              : `${result.failedCount} fotos no se pudieron subir. El álbum sí se creó y las fotos completadas conservaron su orden.`
          );
        }
      }

      setSubmitPhase("processing");
      setSubmitLabel(queuedFiles.length > 0 ? "Finalizando album..." : "Finalizando...");
      setProgress(100);
      router.push(`/appfotos/admin/albums/${createdAlbum.albumId}${queuedFiles.length > 0 ? "?uploaded=1" : ""}`);
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo completar el proceso.");
      setIsSubmitting(false);
      setProgress(0);
      setSubmitPhase("idle");
      setSubmitLabel("Guardando album...");
      setBatchLabel("");
    }
  }

  const submitHint =
    submitPhase === "processing"
      ? "La foto actual ya termino de enviarse. Ahora estamos creando previews, thumbnails y guardando el album."
      : queuedFiles.length > 0
        ? queuedFiles.length > 1
          ? `Las fotos se suben por lotes y cada una conserva su lugar para poder retomar el lote si algo falla. Flujo actual: ${MAX_FILES_PER_REQUEST} foto(s) a la vez.`
          : "El porcentaje no marcara 100% hasta que la foto quede lista de verdad."
        : "Primero guardamos el album y luego te llevamos a la gestion.";

  const doneCount = queuedFiles.filter((item) => item.status === "done").length;
  const failedCount = queuedFiles.filter((item) => item.status === "error").length;
  const pendingCount = queuedFiles.filter((item) => item.status === "queued" || item.status === "uploading" || item.status === "processing").length;

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-slate-400">Nuevo album</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-900">Preparar entrega</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
          Crea el album, define permisos y prepara la subida desde una sola vista para salir con el flujo listo.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form
          id="album-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-5 rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_14px_35px_rgba(15,23,42,0.06)]"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-500">Nombre del album</span>
              <input
                name="title"
                className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
                placeholder="Boda Alejandra & Marco"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-500">Cliente o evento</span>
              <input
                name="clientName"
                className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
                placeholder="Alejandra + Marco"
                required
              />
            </label>
          </div>

          {allowFullDownload ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-start">
                <div>
                  <p className="text-sm font-bold text-slate-900">Contrasena de descarga completa</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Es opcional y es independiente de la contrasena del album. Solo se pedira al bajar el ZIP completo.
                  </p>
                </div>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-500">Nueva contrasena</span>
                  <input
                    name="fullDownloadPassword"
                    type="password"
                    minLength={4}
                    className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-lime-400"
                    placeholder="Opcional, minimo 4 caracteres"
                  />
                </label>
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-500">Fecha</span>
              <input
                name="eventDate"
                className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
                type="date"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-500">Estado</span>
              <select
                name="status"
                defaultValue={AlbumStatus.DRAFT}
                className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
              >
                <option value={AlbumStatus.DRAFT}>Borrador</option>
                <option value={AlbumStatus.PUBLISHED}>Publicado</option>
                <option value={AlbumStatus.HIDDEN}>Oculto</option>
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-500">Descripcion</span>
            <textarea
              name="description"
              className="min-h-32 w-full rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
              placeholder="Una breve introduccion editorial para la portada del album."
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-500">Visibilidad</span>
              <select
                name="visibility"
                defaultValue={AlbumVisibility.PUBLIC_LINK}
                onChange={(event) => setVisibility(event.target.value as AlbumVisibility)}
                className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
              >
                <option value={AlbumVisibility.PUBLIC_LINK}>Link compartible</option>
                <option value={AlbumVisibility.PASSWORD}>Contrasena</option>
              </select>
            </label>

            {visibility === AlbumVisibility.PASSWORD ? (
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-500">Contrasena del album</span>
                <input
                  name="password"
                  type="password"
                  minLength={4}
                  className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
                  placeholder="Minimo 4 caracteres"
                  required
                />
              </label>
            ) : (
              <div className="rounded-[26px] border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
                <p className="text-sm font-bold text-slate-700">Acceso por link</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  El album sera accesible por su URL publica hasta que actives contrasena.
                </p>
              </div>
            )}
          </div>

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
            className={`rounded-[28px] border border-dashed px-6 py-8 text-center transition ${
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
            <p className="mt-4 text-base font-bold text-slate-900">Arrastra fotos o elige archivos</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Puedes dejarlo vacio o cargar varias imagenes para que el album nazca con contenido desde el primer guardado.
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
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Cola inicial</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {queuedFiles.length} archivo(s) preparados · {totalSizeLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearQueuedFiles}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-900"
                >
                  Limpiar
                </button>
              </div>

              <div className="mt-4 max-h-56 space-y-2 overflow-auto">
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
                          disabled={isSubmitting && (file.status === "uploading" || file.status === "processing")}
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
            </div>
          ) : null}

          {submitError ? (
            <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {submitError}
            </div>
          ) : null}

          {queuedFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-2">Listas: {doneCount}</span>
              <span className="rounded-full bg-slate-100 px-3 py-2">Pendientes: {pendingCount}</span>
              <span className="rounded-full bg-slate-100 px-3 py-2">Fallidas: {failedCount}</span>
            </div>
          ) : null}

          {uploadSummary ? (
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              Avance del lote: {uploadSummary.completed} completadas, {uploadSummary.failed} fallidas.
            </div>
          ) : null}

          <PendingBar
            pending={isSubmitting}
            progress={progress}
            label={queuedFiles.length > 0 ? submitLabel : "Guardando album..."}
          />
          {isSubmitting ? <p className="text-sm text-slate-500">{submitHint}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-fuchsia-500 px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_26px_rgba(217,70,239,0.26)] transition hover:bg-fuchsia-600"
            >
              {isSubmitting ? "Procesando..." : "Guardar album"}
            </button>
            <Button type="reset" variant="secondary" onClick={clearQueuedFiles} disabled={isSubmitting}>
              Limpiar
            </Button>
          </div>
        </form>

        <aside className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-slate-400">Permisos</p>
          <div className="mt-6 space-y-4">
            {optionCards.map((option, index) => (
              <label key={option.name} className="block rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <input
                    name={option.name}
                    type="checkbox"
                    defaultChecked={index < 2}
                    onChange={(event) => {
                      if (option.name === "allowFullDownload") {
                        setAllowFullDownload(event.target.checked);
                      }
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-lime-500 focus:ring-lime-400"
                    form="album-form"
                  />
                  <div>
                    <p className="font-bold text-slate-900">{option.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{option.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
