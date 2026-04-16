"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createCoverageAction } from "@/app/ccc/actions";

const timeOptions = [
  "07:00",
  "07:15",
  "07:30",
  "07:45",
  "08:00",
  "08:15",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "12:00",
  "12:30",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00"
];

const presets = [
  { label: "Misa", nombre: "Misa", duracion: "60" },
  { label: "Honores", nombre: "Honores", duracion: "60" },
  { label: "Festival", nombre: "Festival", duracion: "120" },
  { label: "Fotos", nombre: "Sesión Fotos", duracion: "120" },
  { label: "Deportivo", nombre: "Evento deportivo", duracion: "150" }
];

type Props = {
  catalogs: {
    campus: Array<{ id: string; label: string }>;
    secciones: Array<{ id: string; label: string }>;
    lugares: Array<{ id: string; label: string }>;
    staff: Array<{ id: string; label: string; role: string }>;
  };
};

export function QuickCreateCoverageForm({ catalogs }: Props) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [duracion, setDuracion] = useState("60");
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await createCoverageAction(formData);
        setMessage("Cobertura guardada.");
        setNombre("");
        setDuracion("60");
        setHoraInicio("08:00");
        router.refresh();
      } catch {
        setMessage("No pude guardar cobertura.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-1">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Captura rápida</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Captura lo mínimo y corrige el resto desde la fila.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setNombre(preset.nombre);
                setDuracion(preset.duracion);
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-lime-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
          Nombre
          <input name="nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} required className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none dark:border-slate-700 dark:bg-slate-800/80" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Fecha
          <input name="fecha" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} required className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none dark:border-slate-700 dark:bg-slate-800/80" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Hora
          <select name="horaInicio" value={horaInicio} onChange={(event) => setHoraInicio(event.target.value)} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none dark:border-slate-700 dark:bg-slate-800/80">
            {timeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Duración
          <select name="duracion" value={duracion} onChange={(event) => setDuracion(event.target.value)} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none dark:border-slate-700 dark:bg-slate-800/80">
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hora</option>
            <option value="90">1.5 horas</option>
            <option value="120">2 horas</option>
            <option value="150">2.5 horas</option>
            <option value="180">3 horas</option>
            <option value="240">4 horas</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Campus
          <select name="campusId" className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none dark:border-slate-700 dark:bg-slate-800/80">
            <option value="">Selecciona</option>
            {catalogs.campus.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Sección
          <select name="seccionId" className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none dark:border-slate-700 dark:bg-slate-800/80">
            <option value="">Selecciona</option>
            {catalogs.secciones.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Lugar
          <select name="lugarId" className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none dark:border-slate-700 dark:bg-slate-800/80">
            <option value="">Selecciona</option>
            {catalogs.lugares.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
          Staff asignado
          <select name="staffIds" multiple className="min-h-20 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none dark:border-slate-700 dark:bg-slate-800/80">
            {catalogs.staff.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <p className="text-xs font-normal text-slate-400 dark:text-slate-500">Selecciona uno o varios con Ctrl o Cmd.</p>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
          Comentarios
          <textarea name="comentarios" rows={2} placeholder="Notas rápidas, requerimientos, entrega, etc." className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none dark:border-slate-700 dark:bg-slate-800/80" />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400 dark:text-slate-500">{message || "Usa presets y luego ajusta hora, lugar y staff."}</p>
        <button type="submit" disabled={isPending} className="rounded-full bg-lime-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(101,163,13,0.24)] transition hover:bg-lime-600 disabled:opacity-60">
          Guardar cobertura
        </button>
      </div>
    </form>
  );
}
