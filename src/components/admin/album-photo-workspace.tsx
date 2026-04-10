"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownAZ, CalendarClock, CheckCircle2, FileSearch, GripVertical, LoaderCircle, Search, SquareCheckBig, Star, Trash2 } from "lucide-react";

import type { GalleryPhoto } from "@/features/albums/types";
import { cn } from "@/lib/utils";

type AlbumPhotoWorkspaceProps = {
  albumId: string;
  slug: string;
  photos: GalleryPhoto[];
  bibRecognitionEnabled?: boolean;
};

type ViewMode = "comfortable" | "compact";
type BibFilter = "all" | "pending" | "detected" | "manual";
const fileNameCollator = new Intl.Collator("es-MX", { numeric: true, sensitivity: "base" });

function getProcessingStatusMeta(photo: GalleryPhoto) {
  if (photo.processingStatus === "failed") {
    return {
      label: "Fallida",
      className: "bg-rose-500 text-white"
    };
  }

  if (photo.processingStatus === "processing") {
    return {
      label: "Procesando",
      className: "bg-amber-400 text-slate-950"
    };
  }

  return {
    label: "Lista",
    className: "bg-lime-500 text-white"
  };
}

function getBibStatus(photo: GalleryPhoto): BibFilter {
  if (photo.bibOcrText === "__manual__") {
    return "manual";
  }

  if ((photo.detectedBibs ?? []).length > 0) {
    return "detected";
  }

  return "pending";
}

export function AlbumPhotoWorkspace({ albumId, slug, photos, bibRecognitionEnabled = false }: AlbumPhotoWorkspaceProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("comfortable");
  const [bibFilter, setBibFilter] = useState<BibFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredDropId, setHoveredDropId] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [manualBibValues, setManualBibValues] = useState<Record<string, string>>({});
  const [photoOcrLoading, setPhotoOcrLoading] = useState<Record<string, boolean>>({});
  const [photoManualLoading, setPhotoManualLoading] = useState<Record<string, boolean>>({});
  const [photoBibMessages, setPhotoBibMessages] = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  const filteredPhotos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return photos.filter((photo, index) => {
      const positionLabel = `${(photo.sortOrder ?? index) + 1}`;
      const bibLabel = bibRecognitionEnabled ? (photo.detectedBibs ?? []).join(" ") : "";
      const matchesQuery =
        photo.title.toLowerCase().includes(normalizedQuery) ||
        positionLabel.includes(normalizedQuery) ||
        bibLabel.includes(normalizedQuery);
      const matchesFilter = !bibRecognitionEnabled || bibFilter === "all" ? true : getBibStatus(photo) === bibFilter;

      return (normalizedQuery ? matchesQuery : true) && matchesFilter;
    });
  }, [bibFilter, bibRecognitionEnabled, photos, query]);

  const bibStats = useMemo(() => {
    if (!bibRecognitionEnabled) {
      return { pending: 0, detected: 0, manual: 0 };
    }

    return photos.reduce(
      (totals, photo) => {
        const status = getBibStatus(photo);
        if (status === "pending") totals.pending += 1;
        if (status === "detected") totals.detected += 1;
        if (status === "manual") totals.manual += 1;
        return totals;
      },
      { pending: 0, detected: 0, manual: 0 }
    );
  }, [bibRecognitionEnabled, photos]);

  function toggleSelected(photoId: string) {
    setSelectedIds((current) => (current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId]));
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredPhotos.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(filteredPhotos.map((photo) => photo.id));
  }

  async function callMutation(url: string, body: unknown, successQuery: string) {
    setIsMutating(true);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error("No se pudo completar la accion.");
      }

      setSelectedIds([]);
      router.push(`/appfotos/admin/albums/${albumId}?${successQuery}`);
      router.refresh();
    } finally {
      setIsMutating(false);
    }
  }

  async function handleSetCover(photoId: string) {
    await callMutation(`/api/admin/albums/${albumId}/photos/cover`, { slug, photoId }, "saved=1");
  }

  async function handleDelete(photoIds: string[]) {
    if (photoIds.length === 0) return;

    const confirmed = window.confirm(
      photoIds.length === 1
        ? "¿Deseas eliminar esta foto del album?"
        : `¿Deseas eliminar ${photoIds.length} fotos del album?`
    );

    if (!confirmed) return;

    await callMutation(`/api/admin/albums/${albumId}/photos/bulk-delete`, { slug, photoIds }, "photoDeleted=1");
  }

  async function handleReorder(orderedPhotoIds: string[]) {
    await callMutation(`/api/admin/albums/${albumId}/photos/reorder`, { slug, orderedPhotoIds }, "saved=1");
  }

  async function handleAutoSort(mode: "filename" | "capturedAt") {
    const orderedPhotos = [...photos].sort((left, right) => {
      if (mode === "capturedAt") {
        const leftCapturedAt = left.capturedAt ? new Date(left.capturedAt).getTime() : Number.POSITIVE_INFINITY;
        const rightCapturedAt = right.capturedAt ? new Date(right.capturedAt).getTime() : Number.POSITIVE_INFINITY;

        if (leftCapturedAt !== rightCapturedAt) {
          return leftCapturedAt - rightCapturedAt;
        }
      }

      const fileNameComparison = fileNameCollator.compare(left.title, right.title);
      if (fileNameComparison !== 0) {
        return fileNameComparison;
      }

      return (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
    });

    await handleReorder(orderedPhotos.map((photo) => photo.id));
  }

  async function handleRetryPhotoOcr(photoId: string) {
    setPhotoBibMessages((current) => {
      const next = { ...current };
      delete next[photoId];
      return next;
    });
    setPhotoOcrLoading((current) => ({ ...current, [photoId]: true }));

    try {
      const response = await fetch(`/api/admin/albums/${albumId}/photos/${photoId}/bibs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mode: "ocr" })
      });

      const data = (await response.json()) as { ok?: boolean; detectedBibs?: string[]; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No se pudo reintentar OCR.");
      }

      setPhotoBibMessages((current) => ({
        ...current,
        [photoId]: {
          type: "success",
          text:
            data.detectedBibs && data.detectedBibs.length > 0
              ? `Detectado: ${data.detectedBibs.join(", ")}`
              : "OCR procesado, pero no detecto un bib claro."
        }
      }));
      router.refresh();
    } catch (error) {
      setPhotoBibMessages((current) => ({
        ...current,
        [photoId]: {
          type: "error",
          text: error instanceof Error ? error.message : "No se pudo reintentar OCR."
        }
      }));
    } finally {
      setPhotoOcrLoading((current) => ({ ...current, [photoId]: false }));
    }
  }

  async function handleSaveManualBibs(photoId: string, detectedBibs: string[] | undefined) {
    const rawValue = manualBibValues[photoId] ?? (detectedBibs ?? []).join(", ");
    const bibs = rawValue
      .split(/[,\s]+/)
      .map((value) => value.replace(/\D/g, "").trim())
      .filter(Boolean);

    setPhotoBibMessages((current) => {
      const next = { ...current };
      delete next[photoId];
      return next;
    });
    setPhotoManualLoading((current) => ({ ...current, [photoId]: true }));

    try {
      const response = await fetch(`/api/admin/albums/${albumId}/photos/${photoId}/bibs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mode: "manual", bibs })
      });

      const data = (await response.json()) as { ok?: boolean; detectedBibs?: string[]; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar el bib manual.");
      }

      setManualBibValues((current) => ({
        ...current,
        [photoId]: (data.detectedBibs ?? []).join(", ")
      }));
      setPhotoBibMessages((current) => ({
        ...current,
        [photoId]: {
          type: "success",
          text:
            data.detectedBibs && data.detectedBibs.length > 0
              ? `Guardado manual: ${data.detectedBibs.join(", ")}`
              : "Se limpio el bib manual de esta foto."
        }
      }));
      router.refresh();
    } catch (error) {
      setPhotoBibMessages((current) => ({
        ...current,
        [photoId]: {
          type: "error",
          text: error instanceof Error ? error.message : "No se pudo guardar el bib manual."
        }
      }));
    } finally {
      setPhotoManualLoading((current) => ({ ...current, [photoId]: false }));
    }
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setHoveredDropId(null);
      return;
    }

    const currentOrder = [...photos];
    const fromIndex = currentOrder.findIndex((photo) => photo.id === draggingId);
    const toIndex = currentOrder.findIndex((photo) => photo.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggingId(null);
      setHoveredDropId(null);
      return;
    }

    const [movedPhoto] = currentOrder.splice(fromIndex, 1);
    currentOrder.splice(toIndex, 0, movedPhoto);

    setDraggingId(null);
    setHoveredDropId(null);
    void handleReorder(currentOrder.map((photo) => photo.id));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 lg:max-w-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o numero de foto"
              className="w-full rounded-full border border-slate-200 bg-white px-11 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-lime-400"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-lime-300 hover:text-slate-900"
            >
              <SquareCheckBig className="size-4" />
              {selectedIds.length === filteredPhotos.length && filteredPhotos.length > 0 ? "Limpiar seleccion" : "Seleccionar visibles"}
            </button>
            <span>{filteredPhotos.length} fotos visibles</span>
            {selectedIds.length > 0 ? <span>{selectedIds.length} seleccionadas</span> : null}
          </div>
          {bibRecognitionEnabled ? (
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: "all", label: "Todas", count: photos.length },
                { value: "pending", label: "Sin detectar", count: bibStats.pending },
                { value: "detected", label: "Detectadas", count: bibStats.detected },
                { value: "manual", label: "Manuales", count: bibStats.manual }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBibFilter(option.value as BibFilter)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] transition",
                    bibFilter === option.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-lime-300 hover:text-slate-900"
                  )}
                >
                  {option.label}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px]",
                      bibFilter === option.value ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isMutating || photos.length < 2}
            onClick={() => void handleAutoSort("filename")}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-700 transition hover:border-lime-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowDownAZ className="mr-2 size-4" />
            Ordenar por nombre
          </button>
          <button
            type="button"
            disabled={isMutating || photos.length < 2}
            onClick={() => void handleAutoSort("capturedAt")}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-700 transition hover:border-lime-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarClock className="mr-2 size-4" />
            Ordenar por fecha
          </button>
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode("comfortable")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] transition",
                viewMode === "comfortable" ? "bg-slate-900 text-white" : "text-slate-500"
              )}
            >
              Grande
            </button>
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] transition",
                viewMode === "compact" ? "bg-slate-900 text-white" : "text-slate-500"
              )}
            >
              Compacta
            </button>
          </div>
          <button
            type="button"
            disabled={selectedIds.length === 0 || isMutating}
            onClick={() => void handleDelete(selectedIds)}
            className="inline-flex items-center rounded-full border border-rose-200 bg-white px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="mr-2 size-4" />
            Borrar seleccion
          </button>
        </div>
      </div>

      <div className={cn("grid gap-5", viewMode === "compact" ? "grid-cols-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8" : "md:grid-cols-2 xl:grid-cols-3")}>
        {filteredPhotos.map((photo, index) => {
          const processingMeta = getProcessingStatusMeta(photo);

          return (
          <article
            key={photo.id}
            draggable
            onDragStart={() => setDraggingId(photo.id)}
            onDragOver={(event) => {
              event.preventDefault();
              setHoveredDropId(photo.id);
            }}
            onDragLeave={() => setHoveredDropId((current) => (current === photo.id ? null : current))}
            onDrop={() => handleDrop(photo.id)}
            className={cn(
              "overflow-hidden rounded-[28px] border bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition",
              photo.isCover ? "border-lime-300 ring-2 ring-lime-100" : "border-slate-200",
              hoveredDropId === photo.id ? "border-fuchsia-300 ring-2 ring-fuchsia-100" : ""
            )}
          >
            <div
              className={cn("relative bg-cover bg-center", viewMode === "compact" ? "h-28" : "h-72")}
              style={{ backgroundImage: `url(${viewMode === "compact" ? photo.thumbUrl ?? photo.url : photo.url})` }}
            >
              <div className={cn("absolute flex items-center gap-2", viewMode === "compact" ? "left-2 top-2" : "left-4 top-4")}>
                <button
                  type="button"
                  onClick={() => toggleSelected(photo.id)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full border bg-white text-slate-500 shadow-[0_10px_22px_rgba(15,23,42,0.12)] transition",
                    viewMode === "compact" ? "h-8 w-8" : "h-10 w-10",
                    selectedIds.includes(photo.id) ? "border-lime-300 text-lime-600" : "border-slate-200"
                  )}
                  aria-label="Seleccionar foto"
                >
                  <SquareCheckBig className={cn(viewMode === "compact" ? "size-3.5" : "size-4")} />
                </button>
                <span className={cn("rounded-full bg-white/96 font-extrabold uppercase tracking-[0.22em] text-slate-500 shadow-[0_10px_22px_rgba(15,23,42,0.12)]", viewMode === "compact" ? "px-2 py-1 text-[9px]" : "px-3 py-2 text-[10px]")}>
                  #{(photo.sortOrder ?? index) + 1}
                </span>
                {photo.isCover ? (
                  <span className={cn("rounded-full bg-lime-500 font-extrabold uppercase tracking-[0.22em] text-white shadow-[0_12px_24px_rgba(101,163,13,0.28)]", viewMode === "compact" ? "px-2 py-1 text-[9px]" : "px-3 py-2 text-[10px]")}>
                    Portada
                  </span>
                ) : null}
                <span
                  className={cn(
                    "rounded-full font-extrabold uppercase tracking-[0.22em] shadow-[0_10px_22px_rgba(15,23,42,0.12)]",
                    viewMode === "compact" ? "px-2 py-1 text-[9px]" : "px-3 py-2 text-[10px]",
                    processingMeta.className
                  )}
                >
                  {processingMeta.label}
                </span>
                {bibRecognitionEnabled ? (
                  <span
                    className={cn(
                      "rounded-full font-extrabold uppercase tracking-[0.22em] shadow-[0_10px_22px_rgba(15,23,42,0.12)]",
                      viewMode === "compact" ? "px-2 py-1 text-[9px]" : "px-3 py-2 text-[10px]",
                      getBibStatus(photo) === "manual"
                        ? "bg-fuchsia-500 text-white"
                        : getBibStatus(photo) === "detected"
                          ? "bg-sky-500 text-white"
                          : "bg-white/96 text-slate-500"
                    )}
                  >
                    {getBibStatus(photo) === "manual"
                      ? "Manual"
                      : getBibStatus(photo) === "detected"
                        ? "Detectado"
                        : "Sin detectar"}
                  </span>
                ) : null}
              </div>
              <div className={cn("absolute", viewMode === "compact" ? "right-2 top-2" : "right-4 top-4")}>
                <span className={cn("inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-[0_10px_22px_rgba(15,23,42,0.12)]", viewMode === "compact" ? "h-8 w-8" : "h-10 w-10")}>
                  <GripVertical className={cn(viewMode === "compact" ? "size-3.5" : "size-4")} />
                </span>
              </div>
            </div>

            <div className={cn("space-y-4", viewMode === "compact" ? "px-3 py-3" : "px-5 py-4")}>
              <div className="space-y-1">
                <p className={cn("truncate font-bold text-slate-900", viewMode === "compact" ? "text-[11px]" : "text-sm")}>{photo.title}</p>
                <p className={cn("font-bold uppercase tracking-[0.2em] text-slate-400", viewMode === "compact" ? "text-[9px]" : "text-[11px]")}>
                  {photo.processingStatus === "processing"
                    ? "Original guardado. Derivados en cola."
                    : photo.processingStatus === "failed"
                      ? "Original guardado. Derivados fallaron."
                      : photo.isCover
                        ? "Vista principal del album"
                        : "Arrastra para reordenar"}
                </p>
              </div>

              {bibRecognitionEnabled ? (
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center gap-2">
                  <FileSearch className="size-4 text-slate-400" />
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">OCR bib</p>
                </div>
                {photo.detectedBibs && photo.detectedBibs.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {photo.detectedBibs.map((bib) => (
                      <span
                        key={`${photo.id}-${bib}`}
                        className="rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-lime-700"
                      >
                        #{bib}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs font-bold text-slate-500">Todavia no hay bib reconocido en esta foto.</p>
                )}
                {photo.bibOcrProcessedAt ? (
                  <p className="mt-2 text-[11px] text-slate-400">Procesada manual o automaticamente.</p>
                ) : null}
                {photoBibMessages[photo.id] ? (
                  <div
                    className={cn(
                      "mt-3 rounded-2xl px-3 py-2 text-[11px] font-bold",
                      photoBibMessages[photo.id]?.type === "success"
                        ? "border border-lime-200 bg-lime-50 text-lime-800"
                        : "border border-rose-200 bg-rose-50 text-rose-800"
                    )}
                  >
                    {photoBibMessages[photo.id]?.text}
                  </div>
                ) : null}
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRetryPhotoOcr(photo.id)}
                    disabled={photoOcrLoading[photo.id] || photoManualLoading[photo.id]}
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-lime-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {photoOcrLoading[photo.id] ? <LoaderCircle className="mr-2 size-3.5 animate-spin" /> : null}
                    Reintentar OCR
                  </button>

                  <div className="space-y-2">
                    <input
                      value={manualBibValues[photo.id] ?? (photo.detectedBibs ?? []).join(", ")}
                      onChange={(event) =>
                        setManualBibValues((current) => ({
                          ...current,
                          [photo.id]: event.target.value
                        }))
                      }
                      placeholder="Ej. 245, 246"
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-lime-400"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveManualBibs(photo.id, photo.detectedBibs)}
                      disabled={photoManualLoading[photo.id] || photoOcrLoading[photo.id]}
                      className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {photoManualLoading[photo.id] ? <LoaderCircle className="mr-2 size-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 size-3.5" />}
                      Guardar bib manual
                    </button>
                  </div>
                </div>
              </div>
              ) : null}

              <div className={cn("grid gap-2", viewMode === "compact" ? "grid-cols-1" : "sm:grid-cols-2")}>
                <button
                  type="button"
                  onClick={() => void handleSetCover(photo.id)}
                  disabled={isMutating}
                  className={cn(
                    "inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] transition",
                    photo.isCover
                      ? "border border-slate-200 bg-white text-slate-700"
                      : "bg-fuchsia-500 text-white shadow-[0_14px_26px_rgba(217,70,239,0.26)] hover:bg-fuchsia-600"
                  )}
                >
                  <Star className="mr-2 size-4" />
                  {photo.isCover ? "Portada actual" : "Usar portada"}
                </button>

                <button
                  type="button"
                  onClick={() => void handleDelete([photo.id])}
                  disabled={isMutating}
                  className="inline-flex w-full items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="mr-2 size-4" />
                  Borrar
                </button>
              </div>
            </div>
          </article>
          );
        })}
      </div>
    </div>
  );
}
