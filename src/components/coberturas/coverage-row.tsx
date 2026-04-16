"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, CopyPlus, Trash2, XCircle } from "lucide-react";

import { duplicateCoverageAction, removeCoverageAction, setCoverageStatusAction, updateCoverageFieldAction, updateCoverageStaffAction } from "@/app/ccc/actions";
import { AlertsIndicator } from "@/components/coberturas/alerts-indicator";
import { InlineEditableField } from "@/components/coberturas/inline-editable-field";
import { StaffSelector } from "@/components/coberturas/staff-selector";
import { StatusBadge } from "@/components/coberturas/status-badge";
import type { CoverageAlert } from "@/lib/alerts";
import { coverageStatuses } from "@/lib/coberturas";

type CoverageRowProps = {
  coverage: {
    id: string;
    folio: number;
    nombre: string;
    fecha: string;
    horaInicio: string;
    duracion: number;
    carpetaNombre: string;
    comentarios: string;
    detalles: string;
    estatus: "AGENDADO" | "SOLICITADO" | "REALIZADO" | "CANCELADO";
    campusId: string;
    seccionId: string;
    lugarId: string;
    campusNombre: string;
    seccionNombre: string;
    lugarNombre: string;
    staff: Array<{ id: string; nombre: string; isLead: boolean }>;
    alerts: CoverageAlert[];
  };
  catalogs: {
    campus: Array<{ id: string; label: string }>;
    secciones: Array<{ id: string; label: string }>;
    lugares: Array<{ id: string; label: string }>;
    staff: Array<{ id: string; label: string; role: string }>;
  };
  canEdit: boolean;
};

export function CoverageRow({ coverage, catalogs, canEdit }: CoverageRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const date = useMemo(() => new Date(coverage.fecha), [coverage.fecha]);
  const isToday = new Date().toISOString().slice(0, 10) === coverage.fecha.slice(0, 10);
  const isOverdue = coverage.alerts.some((alert) => alert.type === "vencida");
  const leadStaff = coverage.staff.find((person) => person.isLead)?.nombre ?? coverage.staff[0]?.nombre ?? "Sin staff";
  const showCopied = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const saveField = (field: Parameters<typeof updateCoverageFieldAction>[0]["field"], value: string) =>
    updateCoverageFieldAction({ id: coverage.id, field, value });

  return (
    <>
      <tr className={`border-b align-top dark:border-slate-800 ${isOverdue ? "border-rose-100 bg-rose-50/30 dark:bg-rose-500/5" : "border-slate-200"} ${isToday ? "bg-sky-50/20 dark:bg-sky-500/5" : ""}`}>
        <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", timeZone: "UTC" }).format(date)}
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {new Intl.DateTimeFormat("es-MX", { weekday: "short", timeZone: "UTC" }).format(date)} · {coverage.horaInicio}
            {isToday ? " · Hoy" : ""}
          </p>
        </td>
        <td className="px-4 py-3">
          <p className="font-black text-slate-950 dark:text-white">{coverage.nombre}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {coverage.campusNombre} · {coverage.seccionNombre} · {coverage.lugarNombre}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            F{String(coverage.folio).padStart(2, "0")} · {coverage.duracion} min
          </p>
        </td>
        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
          <p>{leadStaff}</p>
          {coverage.staff.length > 1 ? <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">+{coverage.staff.length - 1} más</p> : null}
        </td>
        <td className="px-4 py-3">
          <div className="space-y-2">
            <StatusBadge status={coverage.estatus} />
            <AlertsIndicator alerts={coverage.alerts} />
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setExpanded((current) => !current)} className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 dark:border-slate-700 dark:text-slate-300">
              {expanded ? "Cerrar" : canEdit ? "Editar" : "Ver"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(coverage.carpetaNombre);
                showCopied();
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              <Copy className="mr-1 inline size-3" />
              Carpeta
            </button>
            {copied ? <span className="self-center text-[11px] font-bold uppercase tracking-[0.14em] text-lime-600 dark:text-lime-300">Nombre copiado</span> : null}
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60">
          <td colSpan={5} className="px-4 py-4">
            <div className={`grid gap-5 ${canEdit ? "xl:grid-cols-[0.9fr_1.1fr]" : "md:grid-cols-2"}`}>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Resumen</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Carpeta</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{coverage.carpetaNombre}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Staff</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{coverage.staff.map((person) => person.nombre).join(", ") || "Sin staff asignado"}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Comentarios</p>
                  <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {coverage.comentarios || "Sin comentarios"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigator.clipboard.writeText(`${coverage.nombre} | ${coverage.fecha.slice(0, 10)} | ${coverage.horaInicio} | ${coverage.duracion} min | ${coverage.lugarNombre}`)} className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    Copiar línea
                  </button>
                  {canEdit ? (
                    <>
                      <button type="button" onClick={() => startTransition(async () => duplicateCoverageAction({ id: coverage.id }))} disabled={isPending} className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        <CopyPlus className="mr-1 inline size-3" />
                        Duplicar
                      </button>
                      <button type="button" onClick={() => startTransition(async () => setCoverageStatusAction({ id: coverage.id, status: "REALIZADO" }))} disabled={isPending} className="rounded-full border border-lime-200 bg-lime-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-lime-700 dark:border-lime-500/30 dark:bg-lime-500/12 dark:text-lime-300">
                        Realizado
                      </button>
                      <button type="button" onClick={() => startTransition(async () => setCoverageStatusAction({ id: coverage.id, status: "SOLICITADO" }))} disabled={isPending} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-300">
                        Solicitado
                      </button>
                      <button type="button" onClick={() => startTransition(async () => setCoverageStatusAction({ id: coverage.id, status: "CANCELADO" }))} disabled={isPending} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-300">
                        <XCircle className="mr-1 inline size-3" />
                        Cancelar
                      </button>
                      <button type="button" onClick={() => startTransition(async () => removeCoverageAction({ id: coverage.id }))} disabled={isPending} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-300">
                        <Trash2 className="mr-1 inline size-3" />
                        Eliminar
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              {canEdit ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Editor rápido</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Nombre</p>
                      <InlineEditableField label="nombre" value={coverage.nombre} onSave={(value) => saveField("nombre", value)} className="font-semibold text-slate-900 dark:text-white" />
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Fecha</p>
                      <InlineEditableField label="fecha" type="date" value={coverage.fecha.slice(0, 10)} onSave={(value) => saveField("fecha", value)} />
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Hora</p>
                      <InlineEditableField label="hora" type="time" value={coverage.horaInicio} onSave={(value) => saveField("horaInicio", value)} />
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Duración</p>
                      <InlineEditableField label="duración" type="number" value={String(coverage.duracion)} onSave={(value) => saveField("duracion", value)} />
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Estatus</p>
                      <InlineEditableField label="estatus" as="select" value={coverage.estatus} options={coverageStatuses.map((status) => ({ value: status, label: status }))} onSave={(value) => saveField("estatus", value)} />
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Campus</p>
                      <InlineEditableField label="campus" as="select" value={coverage.campusId} options={catalogs.campus.map((item) => ({ value: item.id, label: item.label }))} onSave={(value) => saveField("campusId", value)} />
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Sección</p>
                      <InlineEditableField label="sección" as="select" value={coverage.seccionId} options={catalogs.secciones.map((item) => ({ value: item.id, label: item.label }))} onSave={(value) => saveField("seccionId", value)} />
                    </div>
                    <div className="md:col-span-2">
                      <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Lugar</p>
                      <InlineEditableField label="lugar" as="select" value={coverage.lugarId} options={catalogs.lugares.map((item) => ({ value: item.id, label: item.label }))} onSave={(value) => saveField("lugarId", value)} />
                    </div>
                    <div className="md:col-span-2">
                      <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Staff</p>
                      <StaffSelector value={coverage.staff.map((person) => person.id)} options={catalogs.staff.map((person) => ({ id: person.id, label: person.label }))} onSave={(value) => updateCoverageStaffAction({ id: coverage.id, staffIds: value })} />
                    </div>
                    <div className="md:col-span-2">
                      <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Comentarios</p>
                      <InlineEditableField label="comentarios" as="textarea" value={coverage.comentarios} onSave={(value) => saveField("comentarios", value)} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
