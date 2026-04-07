"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Copy, ExternalLink, LoaderCircle, MessageCircleMore, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LumepicCheckResult } from "@/lib/lumepic/types";

type LumepicResultCardProps = {
  result: LumepicCheckResult | null;
  isPending: boolean;
};

function buildWhatsAppUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function LumepicResultCard({ result, isPending }: LumepicResultCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(message: string) {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (isPending) {
    return (
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3 text-slate-700">
          <LoaderCircle className="size-5 animate-spin text-lime-600" />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em]">Consultando Lumepic</p>
            <p className="mt-1 text-sm text-slate-500">Estoy esperando a que carguen los resultados visibles para decidir si sí hay fotos.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-[30px] border border-dashed border-slate-300 bg-white/80 p-6 text-sm text-slate-500 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
        Escribe un número, elige evento si hace falta y presiona buscar. Aquí aparecerán el estado, el link y el mensaje listo para copiar.
      </section>
    );
  }

  const isFound = result.success && result.status === "found";
  const isNotFound = result.success && result.status === "not_found";
  const resultLinkLabel = isNotFound ? "Abrir evento / selfie" : "Abrir resultado";
  const targetLink = result.success ? (isFound ? result.resultUrl : result.selfieUrl) : result.selfieUrl ?? result.resultUrl;

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400">Resultado</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {result.success ? result.eventName : "No se pudo completar la consulta"}
          </h2>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em]",
            isFound && "bg-lime-50 text-lime-700",
            isNotFound && "bg-amber-50 text-amber-700",
            !result.success && "bg-rose-50 text-rose-700"
          )}
        >
          {isFound ? <CheckCircle2 className="size-4" /> : isNotFound ? <SearchX className="size-4" /> : <AlertCircle className="size-4" />}
          {isFound ? "Sí hay fotos" : isNotFound ? "No hay fotos" : "Error técnico"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Número consultado</p>
          <p className="mt-2 text-lg font-black text-slate-950">{result.bibNumber}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Motivo</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{result.reason}</p>
        </div>
      </div>

      {result.success ? (
        <>
          <div className="mt-5 space-y-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Link de resultado</p>
              <p className="mt-2 break-all text-sm font-medium text-slate-700">{result.resultUrl}</p>
            </div>

            {!isFound ? (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Link de selfie / evento</p>
                <p className="mt-2 break-all text-sm font-medium text-slate-700">{result.selfieUrl}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-5">
            <label className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400" htmlFor="lumepic-message">
              Mensaje listo para enviar
            </label>
            <textarea
              id="lumepic-message"
              readOnly
              value={result.message}
              className="mt-2 min-h-48 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={() => handleCopy(result.message)}>
              <Copy className="mr-2 size-4" />
              {copied ? "Mensaje copiado" : "Copiar mensaje"}
            </Button>
            {targetLink ? (
              <a href={targetLink} target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary">
                  <ExternalLink className="mr-2 size-4" />
                  {resultLinkLabel}
                </Button>
              </a>
            ) : null}
            <a href={buildWhatsAppUrl(result.message)} target="_blank" rel="noreferrer">
              <Button type="button" variant="pink">
                <MessageCircleMore className="mr-2 size-4" />
                Abrir WhatsApp
              </Button>
            </a>
          </div>
        </>
      ) : (
        targetLink ? (
          <div className="mt-5">
            <a href={targetLink} target="_blank" rel="noreferrer">
              <Button type="button" variant="secondary">
                <ExternalLink className="mr-2 size-4" />
                Abrir evento en Lumepic
              </Button>
            </a>
          </div>
        ) : null
      )}
    </section>
  );
}
