import Link from "next/link";
import { ArrowRight, Camera, Clock3, Sparkles, Star } from "lucide-react";

import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 300;

export default async function HomePage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-12 pb-10 pt-6 md:space-y-16 md:pt-10">
      <section className="relative overflow-hidden rounded-[36px] border border-[#d6e6dc] bg-[linear-gradient(140deg,#f8fbf6_0%,#fffaf3_55%,#f4f7ff_100%)] px-5 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:px-8 md:py-12">
        <div className="pointer-events-none absolute -right-12 top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,204,128,0.38),rgba(255,255,255,0))]" />
        <div className="pointer-events-none absolute left-[-30px] top-[-25px] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(132,204,22,0.16),rgba(255,255,255,0))]" />
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-200/80 bg-white/80 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-lime-700 backdrop-blur">
              <Sparkles className="size-4" />
              Sitio principal en construcción
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.34em] text-slate-400">
                Bienvenido a la nueva etapa de La Kja
              </p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                Estamos construyendo una home más editorial, cálida y poderosa.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                La casa principal de La Kja está en proceso. Mientras la afinamos, la app de galerías sigue activa para clientes,
                entregas y selección de fotos.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/appfotos"
                className="inline-flex items-center justify-center rounded-full bg-lime-500 px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(101,163,13,0.24)] transition hover:bg-lime-600"
              >
                Entrar a AppFotos
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <a
                href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(settings.whatsappMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300"
              >
                Escribirme
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-100 text-lime-700">
                <Camera className="size-6" />
              </div>
              <p className="mt-4 text-lg font-black text-slate-900">AppFotos activa</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Tus galerías, entregas y descargas siguen funcionando en una ruta separada.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Clock3 className="size-6" />
              </div>
              <p className="mt-4 text-lg font-black text-slate-900">Nueva home en proceso</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Estamos preparando una portada más premium para mostrar la esencia completa de la marca.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur sm:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Star className="size-6" />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">Qué sigue</p>
                  <p className="text-sm text-slate-500">Próximamente aquí vivirá la experiencia principal de La Kja.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-[20px] border border-slate-200 bg-[#fffdf8] px-4 py-4 text-sm font-semibold text-slate-600">
                  Landing de marca
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-[#f8fffb] px-4 py-4 text-sm font-semibold text-slate-600">
                  Portafolio curado
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-[#f8fbff] px-4 py-4 text-sm font-semibold text-slate-600">
                  Contacto y reservas
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
