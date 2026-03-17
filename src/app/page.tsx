import Link from "next/link";
import { ArrowRight, Facebook, Instagram, Sparkles } from "lucide-react";

import { AlbumCard } from "@/components/dashboard/album-card";
import { HomeShowcaseReel } from "@/components/home/home-showcase-reel";
import { getPublishedAlbums, getPublishedShowcasePhotos } from "@/lib/albums";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const albums = await getPublishedAlbums(6);
  const showcasePhotos = await getPublishedShowcasePhotos(10);

  return (
    <div className="space-y-14 pb-8 pt-6 md:space-y-16 md:pt-10">
      <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:px-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-lime-700">
              <Sparkles className="size-4" />
              Estamos construyendo algo especial
            </div>

            <div className="space-y-4">
              <p className="text-center text-xs font-black uppercase tracking-[0.34em] text-slate-400 lg:text-left">
                Bienvenido a La Kja
              </p>
              <h1 className="text-center text-4xl font-black tracking-tight text-slate-950 md:text-6xl lg:text-left">
                Una experiencia fotográfica más cercana, más viva y más tuya.
              </h1>
              <p className="mx-auto max-w-2xl text-center text-base leading-8 text-slate-600 lg:mx-0 lg:text-left">
                Estamos afinando una nueva casa digital para entregar historias, retratos y eventos con una experiencia
                mucho más cuidada. Mientras tanto, ya puedes recorrer las galerías publicadas, sentir el estilo de La Kja
                y escribirme si quieres crear algo juntos.
              </p>
            </div>

            <div className="lg:max-w-md">
              <Link
                href="/#galerias"
                className="inline-flex items-center justify-center rounded-full bg-lime-500 px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(101,163,13,0.24)] transition hover:bg-lime-600"
              >
                Ver galerías
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </div>

          </div>

          <HomeShowcaseReel photos={showcasePhotos} />
        </div>
      </section>

      <section id="galerias" className="space-y-8 scroll-mt-28">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-4">
            <div className="h-1.5 w-14 rounded-full bg-amber-400" />
            <p className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">Galerias Recientes</p>
          </div>
        </div>

        {albums.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} variant="showcase" />
            ))}
          </div>
        ) : (
          <div className="rounded-[30px] border border-dashed border-slate-200 bg-white px-8 py-20 text-center shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <p className="text-lg font-bold text-slate-800">Aun no hay galerias publicadas.</p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              En cuanto publiques tus albumes, apareceran aqui con una vista mucho mas limpia para tus clientes.
            </p>
          </div>
        )}
      </section>

      <footer className="space-y-5 pt-6 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400">
          Sigue el universo de La Kja
        </p>
        <div className="flex items-center justify-center gap-4 text-slate-500">
          <a
            href="https://instagram.com/lakja.top"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-fuchsia-200 hover:text-fuchsia-600"
            aria-label="Instagram de La Kja"
          >
            <Instagram className="size-5" />
          </a>
          <a
            href="https://facebook.com/lakja.top"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-600"
            aria-label="Facebook de La Kja"
          >
            <Facebook className="size-5" />
          </a>
        </div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-slate-400">
          © 2026 La Kja • Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}
