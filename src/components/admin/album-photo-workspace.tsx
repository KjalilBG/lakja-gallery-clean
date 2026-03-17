"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Search, SquareCheckBig, Star, Trash2 } from "lucide-react";

import type { GalleryPhoto } from "@/features/albums/types";
import { cn } from "@/lib/utils";

type AlbumPhotoWorkspaceProps = {
  albumId: string;
  slug: string;
  photos: GalleryPhoto[];
};

type ViewMode = "comfortable" | "compact";

export function AlbumPhotoWorkspace({ albumId, slug, photos }: AlbumPhotoWorkspaceProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("comfortable");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredDropId, setHoveredDropId] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const filteredPhotos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return photos;
    }

    return photos.filter((photo, index) => {
      const positionLabel = `${(photo.sortOrder ?? index) + 1}`;
      return photo.title.toLowerCase().includes(normalizedQuery) || positionLabel.includes(normalizedQuery);
    });
  }, [photos, query]);

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
      router.push(`/admin/albums/${albumId}?${successQuery}`);
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
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
        {filteredPhotos.map((photo, index) => (
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
                  {photo.isCover ? "Vista principal del album" : "Arrastra para reordenar"}
                </p>
              </div>

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
        ))}
      </div>
    </div>
  );
}
