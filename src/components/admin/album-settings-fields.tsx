"use client";

import { useMemo, useRef, useState } from "react";
import { AlbumVisibility, CoverPosition } from "@prisma/client";
import { MoveHorizontal, MoveVertical } from "lucide-react";

import { getObjectPositionFromFocus } from "@/lib/cover";

type AlbumSettingsFieldsProps = {
  initialVisibility: AlbumVisibility;
  coverUrl: string;
  coverPosition: "top" | "center" | "bottom";
  coverFocusX: number;
  coverFocusY: number;
  hasPassword: boolean;
};

export function AlbumSettingsFields({
  initialVisibility,
  coverUrl,
  coverPosition,
  coverFocusX,
  coverFocusY,
  hasPassword
}: AlbumSettingsFieldsProps) {
  const [visibility, setVisibility] = useState<AlbumVisibility>(initialVisibility);
  const [selectedCoverPosition, setSelectedCoverPosition] = useState<CoverPosition>(
    coverPosition === "top" ? CoverPosition.TOP : coverPosition === "bottom" ? CoverPosition.BOTTOM : CoverPosition.CENTER
  );
  const [focusX, setFocusX] = useState(coverFocusX);
  const [focusY, setFocusY] = useState(coverFocusY);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const objectPosition = useMemo(() => getObjectPositionFromFocus(focusX, focusY), [focusX, focusY]);

  function handleEditorPointer(clientX: number, clientY: number) {
    if (!editorRef.current) return;

    const rect = editorRef.current.getBoundingClientRect();
    const nextX = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
    const nextY = Math.max(0, Math.min(100, Math.round(((clientY - rect.top) / rect.height) * 100)));

    setFocusX(nextX);
    setFocusY(nextY);
  }

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-500">Visibilidad</span>
          <select
            name="visibility"
            defaultValue={initialVisibility}
            onChange={(event) => setVisibility(event.target.value as AlbumVisibility)}
            className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
          >
            <option value={AlbumVisibility.PUBLIC_LINK}>Link compartible</option>
            <option value={AlbumVisibility.PASSWORD}>Contrasena</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-500">Ajuste base</span>
          <select
            name="coverPosition"
            value={selectedCoverPosition}
            onChange={(event) => setSelectedCoverPosition(event.target.value as CoverPosition)}
            className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
          >
            <option value={CoverPosition.TOP}>Arriba</option>
            <option value={CoverPosition.CENTER}>Centro</option>
            <option value={CoverPosition.BOTTOM}>Abajo</option>
          </select>
        </label>
      </div>

      <input type="hidden" name="coverFocusX" value={focusX} />
      <input type="hidden" name="coverFocusY" value={focusY} />

      <div className="space-y-5 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <div>
          <p className="text-sm font-black text-slate-900">Editor de portada</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Haz click sobre la imagen para mover el enfoque. La vista inferior replica la franja principal del album para que ajustes la portada con una referencia mucho mas fiel.
            </p>
          </div>

        <div className="space-y-5">
          <div
            ref={editorRef}
            onClick={(event) => handleEditorPointer(event.clientX, event.clientY)}
            className="relative h-[280px] cursor-crosshair overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_26px_rgba(15,23,42,0.06)]"
          >
            <img src={coverUrl} alt="Editor de portada" className="h-full w-full object-cover" style={{ objectPosition }} />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:25%_25%]" />
            <div
              className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/20 shadow-[0_0_0_5px_rgba(15,23,42,0.14)]"
              style={{ left: `${focusX}%`, top: `${focusY}%` }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
                  <MoveHorizontal className="size-4" />
                  Encuadre horizontal
                </span>
                <span className="text-sm font-black text-slate-900">{focusX}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={focusX}
                onChange={(event) => setFocusX(Number(event.target.value))}
                className="w-full accent-lime-500"
              />
            </label>

            <label className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
                  <MoveVertical className="size-4" />
                  Encuadre vertical
                </span>
                <span className="text-sm font-black text-slate-900">{focusY}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={focusY}
                onChange={(event) => setFocusY(Number(event.target.value))}
                className="w-full accent-fuchsia-500"
              />
            </label>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_26px_rgba(15,23,42,0.06)]">
            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Franja extra ancha</div>
            <div className="rounded-[22px] border border-slate-200 bg-[#fcfcfb] p-3">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_12px_26px_rgba(15,23,42,0.06)]">
                <img
                  src={coverUrl}
                  alt="Vista super horizontal"
                  className="h-28 w-full rounded-[24px] object-cover sm:h-36 lg:h-44"
                  style={{ objectPosition }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {visibility === AlbumVisibility.PASSWORD ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <div className="grid gap-4 md:grid-cols-[190px_1fr] md:items-start">
            <div>
              <p className="text-sm font-bold text-slate-900">Acceso protegido</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {hasPassword ? "Hay una contrasena activa. Por seguridad no se muestra en texto plano." : "Este album necesita una contrasena para quedar protegido."}
              </p>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-500">Nueva contrasena</span>
              <input
                name="password"
                type="text"
                minLength={4}
                placeholder={hasPassword ? "Escribe una nueva para reemplazar la actual" : "Minimo 4 caracteres"}
                className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-lime-400"
              />
            </label>
          </div>
        </div>
      ) : null}
    </>
  );
}
