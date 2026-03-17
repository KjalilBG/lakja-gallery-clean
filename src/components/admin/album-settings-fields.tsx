"use client";

import { useState } from "react";
import { AlbumVisibility, CoverPosition } from "@prisma/client";

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

  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
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

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
          <div className="overflow-hidden rounded-[18px] bg-white">
            <img
              src={coverUrl}
              alt="Vista previa de portada"
              className="h-28 w-full object-cover"
              style={{ objectPosition: getObjectPositionFromFocus(focusX, focusY) }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 md:grid-cols-2">
        <label className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-500">Encuadre horizontal</span>
            <span className="text-sm font-black text-slate-900">{focusX}%</span>
          </div>
          <input
            name="coverFocusX"
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
            <span className="text-sm font-bold text-slate-500">Encuadre vertical</span>
            <span className="text-sm font-black text-slate-900">{focusY}%</span>
          </div>
          <input
            name="coverFocusY"
            type="range"
            min="0"
            max="100"
            value={focusY}
            onChange={(event) => setFocusY(Number(event.target.value))}
            className="w-full accent-fuchsia-500"
          />
        </label>
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
