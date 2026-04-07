"use client";

import { useEffect, useRef, useState } from "react";
import { NotebookPen, RotateCcw, Save } from "lucide-react";

type SiteAdminNotesPanelProps = {
  initialNotes: string;
  initialUpdatedAt: string | null;
};

type SaveNotesResponse = {
  ok: true;
  content: string;
  updatedAt: string;
};

function formatSavedAt(value: string | null) {
  if (!value) {
    return "Aun no hay guardados.";
  }

  const savedDate = new Date(value);

  if (Number.isNaN(savedDate.getTime())) {
    return "Guardado reciente.";
  }

  return savedDate.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function SiteAdminNotesPanel({ initialNotes, initialUpdatedAt }: SiteAdminNotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialUpdatedAt);
  const isFirstRenderRef = useRef(true);
  const latestSaveIdRef = useRef(0);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const currentSaveId = latestSaveIdRef.current + 1;
        latestSaveIdRef.current = currentSaveId;
        setSaveState("saving");

        try {
          const response = await fetch("/api/admin/site/notes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              content: notes
            })
          });

          if (!response.ok) {
            throw new Error("No se pudieron guardar las notas.");
          }

          const payload = (await response.json()) as SaveNotesResponse;

          if (latestSaveIdRef.current !== currentSaveId) {
            return;
          }

          setNotes(payload.content);
          setLastSavedAt(payload.updatedAt);
          setSaveState("saved");
        } catch {
          if (latestSaveIdRef.current === currentSaveId) {
            setSaveState("error");
          }
        }
      })();
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [notes]);

  const saveStateLabel =
    saveState === "saving"
      ? "Guardando automaticamente en tu cuenta..."
      : saveState === "error"
        ? "No se pudo sincronizar. Revisa tu conexion e intenta de nuevo."
        : saveState === "saved"
          ? `Ultima sincronizacion: ${formatSavedAt(lastSavedAt)}`
          : "Escribe una idea y se sincronizara automaticamente.";

  return (
    <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)] md:p-8 dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_40px_rgba(2,6,23,0.4)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
        <div className="space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Anotaciones</p>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-3 text-amber-700 dark:bg-amber-500/12 dark:text-amber-300">
              <NotebookPen className="size-5" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Bloc personal del admin</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300">
                Aqui puedes anotar mejoras, ideas, bugs o pendientes. Se sincroniza automaticamente con tu cuenta de super admin.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setNotes("")}
          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
        >
          <RotateCcw className="mr-2 size-4" />
          Limpiar notas
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={18}
          placeholder={"Ideas para la home\nMejoras del panel admin\nDetalles visuales por corregir\nBugs que revisar despues"}
          className="min-h-[420px] w-full rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5 text-base leading-8 text-slate-800 outline-none transition focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-amber-500/40 dark:focus:bg-slate-900 dark:focus:ring-amber-500/10"
        />

        <div className="flex flex-wrap items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
          <Save className="size-4 text-slate-400 dark:text-slate-500" />
          <span>{saveStateLabel}</span>
        </div>
      </div>
    </section>
  );
}
