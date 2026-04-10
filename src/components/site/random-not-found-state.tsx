"use client";

import Link from "next/link";
import { useMemo } from "react";

const VARIANTS = [
  "Ups, esta ruta se fue a sesion de fotos sin avisar.",
  "404: la pagina se escondio detras de la camara.",
  "Esa URL no esta en el carrete.",
  "No encontramos esta toma, pero seguimos en sesion.",
  "Parece que esta ruta salio movida.",
  "Esta pagina no revelo bien.",
  "Nada por aqui... excepto estilo LaKja.",
  "404 creativo: cuadro fuera de enfoque.",
  "Esa ruta ya no vive en este album.",
  "No existe esta pagina, pero si muchas galerias lindas."
];

function pickRandom<T>(items: T[]) {
  if (items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)] ?? null;
}

export function RandomNotFoundState({ images }: { images: string[] }) {
  const message = useMemo(() => pickRandom(VARIANTS) ?? VARIANTS[0], []);
  const image = useMemo(() => pickRandom(images) ?? images[0] ?? null, [images]);

  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-2xl items-center justify-center px-4 py-12">
      <div className="w-full rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        {image ? (
          <div className="mx-auto mb-6 overflow-hidden rounded-[20px] border border-slate-200">
            <img src={image} alt="Preview aleatorio LaKja" className="h-52 w-full object-cover md:h-64" />
          </div>
        ) : null}
        <p className="text-[11px] font-extrabold uppercase tracking-[0.26em] text-slate-400">404 Not Found</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Ups</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{message}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            Ir al inicio
          </Link>
          <Link
            href="/appfotos"
            className="inline-flex items-center justify-center rounded-full bg-lime-500 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-lime-600"
          >
            Ver galerias
          </Link>
        </div>
      </div>
    </div>
  );
}
