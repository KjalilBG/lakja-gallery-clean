import Link from "next/link";
import { ArrowRight, Camera, Eye, Heart, ImagePlus, Sparkles, Wand2 } from "lucide-react";

import { AlbumCard } from "@/components/dashboard/album-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { getAdminDashboardData } from "@/lib/albums";
import { formatCompactNumber, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function selectionStatusLabel(status: "pending" | "editing" | "delivered") {
  return status === "editing" ? "En edición" : status === "delivered" ? "Entregada" : "Pendiente";
}

function selectionStatusClassName(status: "pending" | "editing" | "delivered") {
  return status === "editing"
    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-300"
    : status === "delivered"
      ? "border-lime-200 bg-lime-50 text-lime-700 dark:border-lime-500/30 dark:bg-lime-500/12 dark:text-lime-300"
      : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
}

export default async function AdminPage() {
  const { stats, recentAlbums, topViewedAlbums, topFavoriteAlbums, recentSelections } = await getAdminDashboardData();

  const cards = [
    {
      label: "Albumes",
      value: formatCompactNumber(stats.totalAlbums),
      hint: `${stats.publishedAlbums} publicados y ${stats.draftAlbums} en preparación.`,
      accent: "lime" as const
    },
    {
      label: "Visitas",
      value: formatCompactNumber(stats.totalViews),
      hint: `${formatCompactNumber(stats.totalDownloads)} descargas acumuladas en la plataforma.`,
      accent: "sky" as const
    },
    {
      label: "Favoritas",
      value: formatCompactNumber(stats.totalFavorites),
      hint: `${stats.pendingSelections} pendientes y ${stats.editingSelections} en edición ahora mismo.`,
      accent: "pink" as const
    },
    {
      label: "Entregadas",
      value: formatCompactNumber(stats.deliveredSelections),
      hint: "Listas de favoritas que ya marcaste como cerradas.",
      accent: "amber" as const
    }
  ];

  const quickActions = [
    {
      href: "/appfotos/admin/albums/new",
      label: "Crear nuevo álbum",
      description: "Arranca una entrega nueva y súbele fotos desde cero.",
      icon: ImagePlus
    },
    {
      href: "/appfotos/admin/albums",
      label: "Ver todos los álbumes",
      description: "Entra directo al inventario completo y retoma trabajo.",
      icon: Camera
    },
    {
      href: "/appfotos/admin/site",
      label: "Ajustar sitio y marca",
      description: "Cambia share preview, redes, home y mantenimiento.",
      icon: Sparkles
    }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f8fafc)] p-8 shadow-[0_14px_35px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-[linear-gradient(135deg,#111827,#0f172a)] dark:shadow-[0_18px_40px_rgba(2,6,23,0.42)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">Operación</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-900 dark:text-white">Resumen del estudio</h1>
            <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-300">
              Entra, detecta lo importante y muévete rápido entre entregas, listas pendientes y configuración general.
            </p>
          </div>
          <div className="grid min-w-[240px] gap-3">
            <div className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Prioridad</p>
              <p className="mt-2 text-lg font-black tracking-tight text-slate-950 dark:text-white">
                {stats.pendingSelections > 0 ? `${stats.pendingSelections} listas pendientes` : "Todo al corriente"}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">OCR / bibs</p>
              <p className="mt-2 text-lg font-black tracking-tight text-slate-950 dark:text-white">
                {recentAlbums.filter((album) => album.title).length} álbumes recientes listos para operar
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-4">
        {cards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_40px_rgba(2,6,23,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Acciones rápidas</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Siguiente paso</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 transition hover:border-lime-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-lime-400 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex size-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.08)] dark:bg-slate-900 dark:text-white">
                        <Icon className="size-5" />
                      </span>
                      <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-white" />
                    </div>
                    <p className="mt-4 text-sm font-black uppercase tracking-[0.14em] text-slate-900 dark:text-white">{action.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{action.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">Álbumes</p>
                <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-900 dark:text-white">Tus entregas recientes</h2>
              </div>
              <Link href="/appfotos/admin/albums" className="text-sm font-bold text-slate-500 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                Ver inventario completo
              </Link>
            </div>
            {recentAlbums.length > 0 ? (
              <div className="grid gap-5 xl:grid-cols-2">
                {recentAlbums.slice(0, 4).map((album) => (
                  <AlbumCard key={album.id} album={album} actionHref={`/appfotos/admin/albums/${album.id}`} actionLabel="Gestionar" />
                ))}
              </div>
            ) : (
              <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Todavía no hay álbumes reales. Crea el primero desde la sección `Nuevo álbum`.
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_40px_rgba(2,6,23,0.35)]">
            <div className="flex items-center gap-3">
              <Heart className="size-5 text-fuchsia-500" />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Trabajo pendiente</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Listas recientes</h3>
              </div>
            </div>
            {recentSelections.length > 0 ? (
              <div className="mt-5 space-y-3">
                {recentSelections.map((selection) => (
                  <Link
                    key={selection.id}
                    href={`/appfotos/admin/albums/${selection.albumId}`}
                    className="block rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-slate-900 dark:text-white">{selection.clientName}</p>
                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-300">{selection.albumTitle}</p>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] ${selectionStatusClassName(selection.status)}`}>
                        {selectionStatusLabel(selection.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                      <span>{selection.photoCount} fotos</span>
                      <span>{formatDate(selection.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-slate-500 dark:text-slate-300">Todavía no hay listas recientes para atender.</p>
            )}
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_40px_rgba(2,6,23,0.35)]">
            <div className="flex items-center gap-3">
              <Eye className="size-5 text-sky-500" />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Se está moviendo</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Top del momento</h3>
              </div>
            </div>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Más vistas</p>
                <div className="mt-3 space-y-3">
                  {topViewedAlbums.map((album, index) => (
                    <Link key={album.id} href={`/appfotos/admin/albums/${album.id}`} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-900 dark:text-white">{index + 1}. {album.title}</p>
                        <p className="truncate text-slate-500 dark:text-slate-300">{album.clientName}</p>
                      </div>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-sky-700 dark:bg-sky-500/12 dark:text-sky-300">
                        {formatCompactNumber(album.views)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Más favoritas</p>
                <div className="mt-3 space-y-3">
                  {topFavoriteAlbums.map((album, index) => (
                    <Link key={album.id} href={`/appfotos/admin/albums/${album.id}`} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-900 dark:text-white">{index + 1}. {album.title}</p>
                        <p className="truncate text-slate-500 dark:text-slate-300">{album.clientName}</p>
                      </div>
                      <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-fuchsia-700 dark:bg-fuchsia-500/12 dark:text-fuchsia-300">
                        {formatCompactNumber(album.favorites)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_40px_rgba(2,6,23,0.35)]">
            <div className="flex items-center gap-3">
              <Wand2 className="size-5 text-lime-500" />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Pulso del estudio</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">En corto</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Descargas</p>
                <p className="mt-2 text-lg font-black text-slate-900 dark:text-white">{formatCompactNumber(stats.totalDownloads)}</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Pendientes vs entregadas</p>
                <p className="mt-2 text-lg font-black text-slate-900 dark:text-white">
                  {stats.pendingSelections} / {stats.deliveredSelections}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-dashed border-slate-300 bg-white/80 p-6 shadow-[0_14px_35px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-950/40 dark:shadow-[0_18px_40px_rgba(2,6,23,0.22)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Respaldo</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Copia operativa</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">
              Descarga un backup con álbumes, fotos, favoritas, métricas y configuración general para guardarlo fuera del sistema.
            </p>
            <a
              href="/api/admin/backup"
              className="mt-5 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-lime-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-lime-400 dark:hover:text-white"
            >
              Descargar backup
            </a>
          </section>
        </aside>
      </section>
    </div>
  );
}
