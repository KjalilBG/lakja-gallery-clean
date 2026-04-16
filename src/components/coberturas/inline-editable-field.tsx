"use client";

import { useEffect, useState, useTransition } from "react";

type InlineEditableFieldProps = {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  as?: "input" | "textarea" | "select";
  type?: string;
  options?: Array<{ value: string; label: string }>;
  className?: string;
};

export function InlineEditableField({ label, value, onSave, as = "input", type = "text", options = [], className }: InlineEditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const submit = () => {
    startTransition(async () => {
      await onSave(draft);
      setEditing(false);
    });
  };

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-lime-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-lime-400 dark:hover:bg-slate-800 ${className ?? ""}`} title={`Editar ${label}`}>
        {value || "—"}
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-lime-200 bg-white p-2 dark:border-lime-500/30 dark:bg-slate-900">
      {as === "textarea" ? (
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
      ) : as === "select" ? (
        <select value={draft} onChange={(event) => setDraft(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800">
          <option value="">Selecciona</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input value={draft} type={type} onChange={(event) => setDraft(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
      )}
      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={isPending} className="rounded-full bg-lime-500 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white">
          Guardar
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(false);
          }}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-600 dark:border-slate-700 dark:text-slate-300"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
