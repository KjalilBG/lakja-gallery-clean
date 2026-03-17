import { AlbumCard } from "@/components/dashboard/album-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { getAdminAlbums, getAdminStats } from "@/lib/albums";
import { formatCompactNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [stats, albums] = await Promise.all([getAdminStats(), getAdminAlbums()]);

  const cards = [
    {
      label: "Albumes",
      value: formatCompactNumber(stats.totalAlbums),
      hint: `${stats.publishedAlbums} publicados listos para compartir.`
    },
    {
      label: "Visitas",
      value: formatCompactNumber(stats.totalViews),
      hint: "Seguimiento inicial de visitas por album."
    },
    {
      label: "Favoritas",
      value: formatCompactNumber(stats.totalFavorites),
      hint: "Ideal para detectar seleccion de cliente."
    }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-slate-400">Operacion</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-900">Resumen del estudio</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
          Desde aqui puedes preparar nuevas entregas, revisar el estado de cada galeria y escalar la plataforma con menos friccion.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {cards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-slate-400">Albumes</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Tus entregas recientes</h2>
        </div>
        {albums.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {albums.slice(0, 4).map((album) => (
              <AlbumCard key={album.id} album={album} actionHref={`/admin/albums/${album.id}`} actionLabel="Gestionar" />
            ))}
          </div>
        ) : (
          <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
            Todavia no hay albumes reales. Crea el primero desde la seccion "Nuevo album".
          </div>
        )}
      </section>
    </div>
  );
}
