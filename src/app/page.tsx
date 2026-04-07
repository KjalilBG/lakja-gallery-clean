import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Facebook, Instagram, Sparkles } from "lucide-react";

import { HomeContactCard } from "@/components/home/home-contact-card";
import { LogoMark } from "@/components/ui/logo";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 300;

export default async function HomePage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-12 pb-10 pt-6 md:space-y-16 md:pt-10">
      <section className="relative overflow-hidden rounded-[38px] border border-[#ffd1ef] bg-[linear-gradient(140deg,#fff8fc_0%,#fff2fb_30%,#fffef8_70%,#f6fffb_100%)] px-5 py-8 shadow-[0_22px_60px_rgba(15,23,42,0.08)] md:px-8 md:py-12">
        <div className="pointer-events-none absolute -left-16 top-10 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18),rgba(255,255,255,0))]" />
        <div className="pointer-events-none absolute right-[-20px] top-[-10px] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.18),rgba(255,255,255,0))]" />
        <div className="pointer-events-none absolute bottom-[-40px] left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(132,204,22,0.12),rgba(255,255,255,0))]" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200/80 bg-white/85 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-fuchsia-600 backdrop-blur">
            <Sparkles className="size-4" />
            En construcción
          </div>

          <div className="relative mt-8">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.2),rgba(255,255,255,0))] blur-2xl" />
            <div className="relative animate-[floatLogo_6s_ease-in-out_infinite]">
              <LogoMark className="h-[138px] w-[138px] md:h-[170px] md:w-[170px]" />
            </div>
          </div>

          <h1 className="mt-8 max-w-4xl text-4xl font-black uppercase tracking-tight text-slate-950 md:text-6xl">
            ¡Estamos construyendo algo sabroso!
          </h1>
          <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-slate-500 md:text-base">
            Sí, hay obra. Sí, se viene bonito.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/appfotos"
              className="inline-flex items-center justify-center rounded-full border border-fuchsia-200 bg-white px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-fuchsia-700 shadow-[0_14px_28px_rgba(236,72,153,0.12)] transition hover:border-fuchsia-300 hover:bg-fuchsia-50"
            >
              Entrar a AppFotos
              <ArrowRight className="ml-2 size-4" />
            </Link>
            <a
              href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(settings.whatsappMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300"
            >
              Escribirme
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative min-h-[240px] overflow-hidden rounded-[30px] border border-fuchsia-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:row-span-2">
            <Image
              src="/uploads/albums/cmmqrswi8000071wohuw32eiz/1773709464317-0-1-sesion-tizzy-feb26-lakja-mx-resultado.webp"
              alt="Retrato editorial La Kja"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="relative min-h-[180px] overflow-hidden rounded-[30px] border border-fuchsia-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <Image
              src="/uploads/albums/cmmqrswi8000071wohuw32eiz/1773708019987-2-3-sesion-tizzy-feb26-lakja-mx-resultado.webp"
              alt="Galería editorial La Kja"
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover"
            />
          </div>
          <div className="relative min-h-[180px] overflow-hidden rounded-[30px] border border-fuchsia-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <Image
              src="/uploads/albums/cmmqrswi8000071wohuw32eiz/1773708020057-3-4-sesion-tizzy-feb26-lakja-mx-resultado.webp"
              alt="Fotografía creativa La Kja"
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover"
            />
          </div>
        </div>

        <HomeContactCard whatsappNumber={settings.whatsappNumber} />
      </section>

      <footer className="space-y-5 pt-2 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400">
          Sigue el universo de La Kja
        </p>
        <div className="flex items-center justify-center gap-4 text-slate-500">
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-fuchsia-200 hover:text-fuchsia-600"
            aria-label="Instagram de La Kja"
          >
            <Instagram className="size-5" />
          </a>
          <a
            href={settings.facebookUrl}
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
