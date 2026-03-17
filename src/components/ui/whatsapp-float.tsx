"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";

type WhatsAppFloatProps = {
  whatsappNumber: string;
  defaultMessage: string;
};

export function WhatsAppFloat({ whatsappNumber, defaultMessage }: WhatsAppFloatProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);

  const shouldHide = useMemo(
    () => pathname?.startsWith("/admin") || pathname?.startsWith("/login"),
    [pathname]
  );

  if (shouldHide) {
    return null;
  }

  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message.trim())}`;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {isOpen ? (
        <div className="w-[min(92vw,360px)] rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">WhatsApp</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Hablemos</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Escribe tu mensaje y te llevo directo al chat de WhatsApp.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:text-slate-700"
              aria-label="Cerrar contacto por WhatsApp"
            >
              <X className="size-4" />
            </button>
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="mt-4 min-h-28 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-lime-400 focus:bg-white"
            placeholder="Escribe tu mensaje para WhatsApp..."
          />

          <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-4 block">
            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#25D366] px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_rgba(37,211,102,0.24)] transition hover:bg-[#1fb85a]"
            >
              <Send className="mr-2 size-4" />
              Enviar por WhatsApp
            </button>
          </a>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_40px_rgba(37,211,102,0.28)] transition hover:scale-[1.03] hover:bg-[#1fb85a]"
        aria-label="Abrir contacto por WhatsApp"
      >
        <MessageCircle className="size-7" />
      </button>
    </div>
  );
}
