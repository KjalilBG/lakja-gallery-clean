import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { coverageStatuses } from "@/lib/coberturas";

type FiltersBarProps = {
  currentMonth: string;
  monthLabel: string;
  search: string;
  status: string;
};

export function FiltersBar({ currentMonth, monthLabel, search, status }: FiltersBarProps) {
  const current = new Date(`${currentMonth}-01T00:00:00.000Z`);
  const prev = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1)).toISOString().slice(0, 7);

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/80">
            <Link href={`/ccc?month=${prev}&search=${encodeURIComponent(search)}&status=${status}`} className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white">
              <ChevronLeft className="size-4" />
            </Link>
            <div className="px-4 text-sm font-black tracking-[0.08em] text-slate-900 dark:text-white">{monthLabel}</div>
            <Link href={`/ccc?month=${next}&search=${encodeURIComponent(search)}&status=${status}`} className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white">
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <form className="flex flex-wrap gap-3">
            <input type="hidden" name="month" value={currentMonth} />
            <label className="flex min-w-[240px] items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
              <Search className="size-4" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Buscar"
                className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </label>
            <select name="status" defaultValue={status} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
              <option value="ALL">Todos</option>
              {coverageStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-lime-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-lime-400 dark:hover:text-white">
              Filtrar
            </button>
          </form>
        </div>
        <a href="#nueva-cobertura" className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-500 px-5 py-2.5 text-sm font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_10px_22px_rgba(101,163,13,0.24)] transition hover:bg-lime-600">
          <Plus className="size-4" />
          Nueva cobertura
        </a>
      </div>
    </section>
  );
}
