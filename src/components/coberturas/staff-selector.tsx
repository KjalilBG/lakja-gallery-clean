"use client";

import { useState, useTransition } from "react";

type StaffSelectorProps = {
  value: string[];
  options: Array<{ id: string; label: string }>;
  onSave: (value: string[]) => Promise<void>;
};

export function StaffSelector({ value, options, onSave }: StaffSelectorProps) {
  const [selected, setSelected] = useState<string[]>(value);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="w-full rounded-lg px-2 py-1 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800">
        {value.length ? value.map((staffId) => options.find((option) => option.id === staffId)?.label ?? "Staff").join(", ") : "Asignar staff"}
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="grid max-h-44 gap-2 overflow-auto">
        {options.map((option) => {
          const active = selected.includes(option.id);
          return (
            <label key={option.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={active}
                onChange={() => setSelected((current) => (current.includes(option.id) ? current.filter((item) => item !== option.id) : [...current, option.id]))}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await onSave(selected);
              setEditing(false);
            })
          }
          className="rounded-full bg-lime-500 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white"
        >
          Guardar
        </button>
        <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-600 dark:border-slate-700 dark:text-slate-300">
          Cancelar
        </button>
      </div>
    </div>
  );
}
