"use client";

import { CoberturaStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { setOwnCoverageStatusAction } from "@/app/ccc/actions";
import { StatusBadge } from "@/components/coberturas/status-badge";

type StaffCoverageItem = {
  id: string;
  nombre: string;
  fecha: string;
  horaInicio: string;
  estatus: CoberturaStatus;
  comentarios: string;
  campusNombre: string;
  seccionNombre: string;
  lugarNombre: string;
};

type Props = {
  initialUpcoming: StaffCoverageItem[];
  initialHistory: StaffCoverageItem[];
  previewUser: { id: string; label: string } | null;
  readOnly: boolean;
};

function coverageDateTime(item: StaffCoverageItem) {
  return new Date(`${item.fecha}T${item.horaInicio}:00.000Z`);
}

function sortAsc(items: StaffCoverageItem[]) {
  return [...items].sort((a, b) => coverageDateTime(a).getTime() - coverageDateTime(b).getTime());
}

function sortDesc(items: StaffCoverageItem[]) {
  return [...items].sort((a, b) => coverageDateTime(b).getTime() - coverageDateTime(a).getTime());
}

export function StaffWorkspaceClient({ initialUpcoming, initialHistory, previewUser, readOnly }: Props) {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState(sortAsc(initialUpcoming));
  const [history, setHistory] = useState(sortDesc(initialHistory));
  const [pendingMap, setPendingMap] = useState<Record<string, CoberturaStatus | undefined>>({});
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      upcoming: upcoming.length,
      history: history.length
    }),
    [history.length, upcoming.length]
  );

  function applyOptimisticStatus(coverageId: string, status: CoberturaStatus) {
    let movedItem: StaffCoverageItem | null = null;

    setUpcoming((current) => {
      const next = current.map((item) => {
        if (item.id !== coverageId) return item;
        movedItem = { ...item, estatus: status };
        return movedItem;
      });

      if (!movedItem) {
        return current;
      }

      if (status === "REALIZADO") {
        return next.filter((item) => item.id !== coverageId);
      }

      return sortAsc(next);
    });

    setHistory((current) => {
      const existing = current.find((item) => item.id === coverageId);

      if (status === "REALIZADO") {
        const source = movedItem ?? existing;
        if (!source) return current;
        const filtered = current.filter((item) => item.id !== coverageId);
        return sortDesc([{ ...source, estatus: status }, ...filtered]);
      }

      if (existing) {
        return current.filter((item) => item.id !== coverageId);
      }

      return current;
    });
  }

  function updateStatus(coverageId: string, status: CoberturaStatus) {
    const previousUpcoming = upcoming;
    const previousHistory = history;

    setPendingMap((current) => ({ ...current, [coverageId]: status }));
    applyOptimisticStatus(coverageId, status);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("coverageId", coverageId);
        formData.set("status", status);
        await setOwnCoverageStatusAction(formData);
      } catch {
        setUpcoming(previousUpcoming);
        setHistory(previousHistory);
      } finally {
        setPendingMap((current) => {
          const next = { ...current };
          delete next[coverageId];
          return next;
        });
        router.refresh();
      }
    });
  }

  function CoverageList({
    items,
    title,
    empty
  }: {
    items: StaffCoverageItem[];
    title: string;
    empty: string;
  }) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{title}</h2>
        {items.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {empty}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const pendingStatus = pendingMap[item.id];
              const disabled = Boolean(pendingStatus) || isPending;

              return (
                <article key={item.id} className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${item.fecha}T00:00:00.000Z`))} · {item.horaInicio}
                      </p>
                      <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">{item.nombre}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                        {item.campusNombre} · {item.seccionNombre} · {item.lugarNombre}
                      </p>
                      {item.comentarios ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.comentarios}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <StatusBadge status={item.estatus} />
                      {pendingStatus ? <p className="text-xs text-slate-400 dark:text-slate-500">Guardando…</p> : null}
                    </div>
                  </div>

                  {!readOnly ? <div className="mt-3 flex flex-wrap gap-2">
                    {item.estatus !== "AGENDADO" ? (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => updateStatus(item.id, "AGENDADO")}
                        className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 disabled:opacity-50 dark:border-sky-500/30 dark:bg-sky-500/12 dark:text-sky-300"
                      >
                        Agendado
                      </button>
                    ) : null}
                    {item.estatus !== "SOLICITADO" ? (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => updateStatus(item.id, "SOLICITADO")}
                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-50 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-300"
                      >
                        Solicitado
                      </button>
                    ) : null}
                    {item.estatus !== "REALIZADO" ? (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => updateStatus(item.id, "REALIZADO")}
                        className="rounded-full border border-lime-200 bg-lime-50 px-3 py-1.5 text-xs font-semibold text-lime-700 disabled:opacity-50 dark:border-lime-500/30 dark:bg-lime-500/12 dark:text-lime-300"
                      >
                        Realizado
                      </button>
                    ) : null}
                  </div> : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">CCC / Staff</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Mis coberturas</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Primero lo pendiente y próximo. Lo anterior queda como historial.</p>
        {previewUser ? (
          <div className="mt-3 rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/12 dark:text-sky-300">
            Viendo vista staff de <span className="font-black">{previewUser.label}</span>.
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">{counts.upcoming} por atender</span>
          <span className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">{counts.history} historial</span>
        </div>
      </section>

      <CoverageList items={upcoming} title="Pendientes y próximas" empty="No tienes coberturas pendientes." />
      <CoverageList items={history} title="Historial" empty="Todavía no hay historial." />
    </>
  );
}
