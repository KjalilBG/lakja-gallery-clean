"use client";

import { useState } from "react";
import { Rocket } from "lucide-react";

import { createShortLinkAction } from "@/app/links/actions";

type LinksCreateFormProps = {
  query?: string;
  sort?: string;
};

export function LinksCreateForm({ query, sort }: LinksCreateFormProps) {
  const [isActive, setIsActive] = useState(true);

  return (
    <section className="rounded-[34px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff,#f8fafc)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="space-y-2 border-b border-slate-100 pb-5">
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Crear link corto</h2>
        <p className="text-sm leading-7 text-slate-500">Slug, destino y listo. Sin pasos extra.</p>
      </div>

      <form action={createShortLinkAction} className="mt-6 space-y-5">
        <input type="hidden" name="q" value={query ?? ""} />
        <input type="hidden" name="sort" value={sort ?? ""} />
        <div className="space-y-2">
          <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Slug publico</label>
          <div className="flex overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 transition focus-within:border-lime-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-lime-100">
            <span className="inline-flex items-center border-r border-slate-200 px-4 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400 md:text-sm">lakja.top/l/</span>
            <input name="slug" placeholder="wa-bodas" className="w-full bg-transparent px-4 py-4 text-base font-semibold text-slate-900 outline-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Destino final</label>
          <input name="destinationUrl" placeholder="https://wa.me/... o /appfotos" className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100" />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Nombre</label>
          <input name="title" placeholder="WhatsApp bodas" className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100" />
        </div>

        <label className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 transition hover:border-slate-300 hover:bg-white">
          <input type="hidden" name="isActive" value="false" />
          <input type="checkbox" name="isActive" value="true" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300 text-lime-500 focus:ring-lime-400" />
          <span className="block space-y-1">
            <span className="block text-sm font-black uppercase tracking-[0.14em] text-slate-900">Activo al guardar</span>
            <span className="block text-sm leading-6 text-slate-500">Puedes pausarlo despues sin perder historico.</span>
          </span>
        </label>

        <button type="submit" className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800">
          <Rocket className="mr-2 size-4" />
          Crear link
        </button>
      </form>
    </section>
  );
}
