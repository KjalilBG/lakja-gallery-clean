import Link from "next/link";
import { Settings2 } from "lucide-react";

import type { AlbumSummary } from "@/features/albums/types";
import { getObjectPositionFromFocus } from "@/lib/cover";
import { formatDate } from "@/lib/format";

const statusMap: Record<AlbumSummary["status"], string> = {
  draft: "Borrador",
  published: "Publicado",
  hidden: "Oculto"
};

const statusClassMap: Record<AlbumSummary["status"], string> = {
  draft: "bg-amber-50 text-amber-700",
  published: "bg-lime-50 text-lime-700",
  hidden: "bg-slate-100 text-slate-600"
};

type AlbumCardProps = {
  album: AlbumSummary;
  actionHref?: string;
  actionLabel?: string;
  variant?: "default" | "showcase";
};

export function AlbumCard({
  album,
  actionHref,
  actionLabel = "Abrir galeria",
  variant = "default"
}: AlbumCardProps) {
  if (variant === "showcase") {
    return (
      <Link
        href={actionHref ?? `/g/${album.slug}`}
        className="group block overflow-hidden rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_34px_rgba(2,6,23,0.32)]"
      >
        <div
          className="h-[330px] rounded-[20px] bg-cover transition duration-500 group-hover:scale-[1.015]"
          style={{ backgroundImage: `url(${album.coverUrl})`, backgroundPosition: getObjectPositionFromFocus(album.coverFocusX, album.coverFocusY) }}
        />
        <div className="space-y-1 px-2 pb-2 pt-5">
          <h3 className="text-[2rem] font-black tracking-tight text-slate-950 dark:text-white">{album.title}</h3>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
            {formatDate(album.eventDate)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={actionHref ?? `/g/${album.slug}`}
      className="group block overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(15,23,42,0.10)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_35px_rgba(2,6,23,0.34)]"
    >
      <div
        className="h-80 rounded-[22px] bg-cover transition duration-500 group-hover:scale-[1.015]"
        style={{ backgroundImage: `url(${album.coverUrl})`, backgroundPosition: getObjectPositionFromFocus(album.coverFocusX, album.coverFocusY) }}
      />
      <div className="space-y-4 px-2 pb-2 pt-5">
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{album.title}</h3>
          <p className="text-xs font-extrabold uppercase tracking-[0.26em] text-slate-400 dark:text-slate-500">{formatDate(album.eventDate)}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] ${statusClassMap[album.status]}`}>
            {statusMap[album.status]}
          </span>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-lime-300 group-hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:group-hover:border-lime-400 dark:group-hover:text-white">
            <Settings2 className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
