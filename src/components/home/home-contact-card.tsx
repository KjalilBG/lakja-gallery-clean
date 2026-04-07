"use client";

import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";

type HomeContactCardProps = {
  whatsappNumber: string;
};

export function HomeContactCard({ whatsappNumber }: HomeContactCardProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const whatsappHref = useMemo(() => {
    const finalMessage = [
      "Hola, me encantó lo que hace La Kja y quiero crear algo juntos.",
      name.trim() ? `Soy ${name.trim()}.` : null,
      message.trim() ? `Me gustaría platicarte esta idea: ${message.trim()}` : null
    ]
      .filter(Boolean)
      .join(" ");

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(finalMessage)}`;
  }, [message, name, whatsappNumber]);

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400">Contacto</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Cuéntame lo que quieres crear</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Si traes una idea, una sesión, un evento o una campaña en mente, escríbeme. Te llevo directo a WhatsApp para que lo empecemos a aterrizar juntos.
      </p>

      <div className="mt-5 grid gap-4">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tu nombre"
          className="h-12 rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-lime-400 focus:bg-white"
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Cuéntame qué tienes en mente: sesión, evento, campaña, retratos o algo especial..."
          className="min-h-32 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-lime-400 focus:bg-white"
        />
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_rgba(37,211,102,0.22)] transition hover:bg-[#1fb85a]"
        >
          <MessageCircle className="mr-2 size-4" />
          Hablemos por WhatsApp
        </a>
      </div>
    </section>
  );
}
