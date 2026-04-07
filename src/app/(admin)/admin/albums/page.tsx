import Link from "next/link";

import { AlbumCard } from "@/components/dashboard/album-card";
import { Button } from "@/components/ui/button";
import { getAdminAlbums } from "@/lib/albums";

export const dynamic = "force-dynamic";

export default async function AlbumsPage() {
  const albums = await getAdminAlbums();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_14px_35px_rgba(15,23,42,0.06)] md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-slate-400">Gestion</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-900">Albumes</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
            Esta vista ya consulta la base de datos real. Cada nuevo album que guardes aparecera aqui automaticamente.
          </p>
        </div>
        <Link href="/appfotos/admin/albums/new">
          <Button>Crear nuevo album</Button>
        </Link>
      </section>

      {albums.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} actionHref={`/appfotos/admin/albums/${album.id}`} actionLabel="Gestionar" />
          ))}
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-xl font-bold text-slate-900">Tu primer album todavia no existe.</p>
          <p className="mt-3 text-slate-500">Crea uno nuevo y este listado dejara de usar demos para mostrar informacion real.</p>
        </div>
      )}
    </div>
  );
}
