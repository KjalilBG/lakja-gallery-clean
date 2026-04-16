"use client";

import { CoberturaStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

const toneMap: Record<CoberturaStatus, string> = {
  AGENDADO: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/12 dark:text-sky-300",
  SOLICITADO: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-300",
  REALIZADO: "border-lime-200 bg-lime-50 text-lime-700 dark:border-lime-500/30 dark:bg-lime-500/12 dark:text-lime-300",
  CANCELADO: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
};

const labelMap: Record<CoberturaStatus, string> = {
  AGENDADO: "Agendado",
  SOLICITADO: "Solicitado",
  REALIZADO: "Realizado",
  CANCELADO: "Cancelado"
};

export function StatusBadge({ status }: { status: CoberturaStatus }) {
  return <span className={cn("inline-flex rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em]", toneMap[status])}>{labelMap[status]}</span>;
}
