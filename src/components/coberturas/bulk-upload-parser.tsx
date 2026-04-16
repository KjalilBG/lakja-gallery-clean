"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { bulkCreateCoverageAction } from "@/app/ccc/actions";

type BulkUploadParserProps = {
  campusOptions: Array<{ id: string; label: string }>;
  seccionOptions: Array<{ id: string; label: string }>;
  staffOptions: Array<{ id: string; label: string }>;
};

export function BulkUploadParser({ campusOptions, seccionOptions, staffOptions }: BulkUploadParserProps) {
  const router = useRouter();
  const [raw, setRaw] = useState("Misa 3A | 12 mayo | 8:00 | 1h | Capilla | Bachillerato | Juan");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const preview = useMemo(
    () =>
      raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          const [nombre = "", fecha = "", hora = "", duracion = "", lugar = "", seccion = "", staff = ""] = line.split("|").map((item) => item.trim());
          return { id: `${index}-${line}`, nombre, fecha, hora, duracion, lugar, seccion, staff, valid: Boolean(nombre && fecha && hora) };
        }),
    [raw]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("raw", raw);

    startTransition(async () => {
      try {
        await bulkCreateCoverageAction(formData);
        setMessage("Lote guardado.");
        setRaw("");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "No pude guardar lote.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-1">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Carga masiva</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">Pega varias líneas, revisa el preview y guarda en bloque. Acepta `YYYY-MM-DD` o formato `12 mayo` y duración como `1h` o `60`.</p>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">
          {campusOptions.length} campus · {seccionOptions.length} secciones · {staffOptions.length} staff
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <textarea name="raw" value={raw} onChange={(event) => setRaw(event.target.value)} rows={10} className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
          <button type="submit" disabled={isPending} className="rounded-full bg-lime-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(101,163,13,0.24)] transition hover:bg-lime-600 disabled:opacity-60">
            Guardar lote
          </button>
          {message ? <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{message}</p> : null}
        </div>
        <div className="rounded-[18px] border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-7 gap-2 border-b border-slate-200 px-4 py-3 text-[10px] font-semibold text-slate-400 dark:border-slate-700 dark:text-slate-500">
            <span>Nombre</span>
            <span>Fecha</span>
            <span>Hora</span>
            <span>Duración</span>
            <span>Lugar</span>
            <span>Sección</span>
            <span>Staff</span>
          </div>
          <div className="max-h-[280px] overflow-auto">
            {preview.map((item) => (
              <div key={item.id} className={`grid grid-cols-7 gap-2 px-4 py-3 text-sm ${item.valid ? "border-b border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-200" : "border-b border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"}`}>
                <span>{item.nombre || "Falta nombre"}</span>
                <span>{item.fecha || "—"}</span>
                <span>{item.hora || "—"}</span>
                <span>{item.duracion || "—"}</span>
                <span>{item.lugar || "—"}</span>
                <span>{item.seccion || "—"}</span>
                <span>{item.staff || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
