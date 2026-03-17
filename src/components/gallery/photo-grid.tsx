import type { KeyboardEvent } from "react";
import { Heart } from "lucide-react";

import type { GalleryPhoto } from "@/features/albums/types";
import { cn } from "@/lib/utils";

const aspectStyles: Record<GalleryPhoto["aspect"], string> = {
  portrait: "min-h-[240px] sm:min-h-[320px] md:min-h-[560px] md:col-span-1",
  landscape: "min-h-[180px] sm:min-h-[230px] md:min-h-[360px] md:col-span-1",
  square: "min-h-[180px] sm:min-h-[230px] md:min-h-[360px] md:col-span-1"
};

type PhotoGridProps = {
  photos: GalleryPhoto[];
  onPhotoClick?: (index: number) => void;
  onFavoriteToggle?: (photoId: string) => void;
};

export function PhotoGrid({ photos, onPhotoClick, onFavoriteToggle }: PhotoGridProps) {
  function getPhotoSerial(photo: GalleryPhoto, index: number) {
    if (typeof photo.sortOrder === "number") {
      return photo.sortOrder + 1;
    }

    const fromTitle = Number.parseInt(photo.title, 10);
    return Number.isNaN(fromTitle) ? index + 1 : fromTitle;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (!onPhotoClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPhotoClick(index);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
      {photos.map((photo, index) => (
        <article
          key={photo.id}
          className={cn(
            "group relative overflow-hidden rounded-[18px] border border-slate-200 bg-white p-2 shadow-[0_14px_35px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.10)] sm:rounded-[22px] sm:p-2.5 md:rounded-[28px] md:p-3",
            onPhotoClick && "cursor-pointer",
            aspectStyles[photo.aspect]
          )}
          onClick={() => onPhotoClick?.(index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          role={onPhotoClick ? "button" : undefined}
          tabIndex={onPhotoClick ? 0 : undefined}
        >
          <div className="relative h-full overflow-hidden rounded-[14px] bg-slate-100 sm:rounded-[18px] md:rounded-[22px]">
            {(() => {
              const serial = getPhotoSerial(photo, index);

              return (
                <span className="absolute left-2.5 top-2.5 z-[1] text-[11px] font-extrabold tracking-[0.16em] text-white drop-shadow-[0_4px_16px_rgba(15,23,42,0.55)] sm:left-3 sm:top-3 sm:text-xs md:left-4 md:top-4">
                  {serial}
                </span>
              );
            })()}

            <div
              className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
              style={{ backgroundImage: `url(${photo.thumbUrl ?? photo.url})` }}
            />

            {onFavoriteToggle ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onFavoriteToggle(photo.id);
                }}
                className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition sm:right-3 sm:top-3 sm:h-10 sm:w-10 md:right-4 md:top-4 md:h-12 md:w-12 ${
                  photo.isFavorite ? "bg-fuchsia-500 text-white" : "bg-white text-slate-500 hover:text-fuchsia-500"
                }`}
                aria-label={photo.isFavorite ? "Quitar de favoritas" : "Agregar a favoritas"}
              >
                <Heart className={`size-4 ${photo.isFavorite ? "fill-current" : ""}`} />
              </button>
            ) : null}

            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-2 sm:bottom-3 sm:left-3 sm:right-3 md:bottom-4 md:left-4 md:right-4">
              {photo.isCover ? (
                <span className="rounded-full bg-slate-950/88 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_10px_22px_rgba(15,23,42,0.26)] sm:px-3 sm:text-[10px] sm:tracking-[0.18em] md:px-4 md:py-2 md:text-[11px] md:tracking-[0.2em]">
                  Foto importada
                </span>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
