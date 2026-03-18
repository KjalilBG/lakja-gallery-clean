import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";

type SiteMaintenanceStateProps = {
  title: string;
  message: string;
  whatsappNumber: string;
};

export function SiteMaintenanceState({ title, message, whatsappNumber }: SiteMaintenanceStateProps) {
  const whatsappHref = `https://wa.me/${whatsappNumber}`;

  return (
    <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:px-10 md:py-14">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-lime-700">
          <Sparkles className="size-4" />
          Modo mantenimiento
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">{title}</h1>
          <p className="mx-auto max-w-2xl text-base leading-8 text-slate-600 md:text-lg">{message}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-6 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_rgba(37,211,102,0.24)] transition hover:bg-[#1fb85a]"
          >
            <MessageCircle className="mr-2 size-4" />
            Escribirme por WhatsApp
          </a>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
          >
            Ir al admin
          </Link>
        </div>
      </div>
    </section>
  );
}
