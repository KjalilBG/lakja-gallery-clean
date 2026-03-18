"use client";

import { ImagePlus, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type SiteShareImageFieldProps = {
  initialValue: string;
  initialPreviewUrl: string;
};

function resolvePreviewUrl(value: string, fallbackUrl: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return fallbackUrl;
  }

  if (/^https?:\/\//i.test(trimmedValue) || trimmedValue.startsWith("/")) {
    return trimmedValue;
  }

  return fallbackUrl;
}

export function SiteShareImageField({ initialValue, initialPreviewUrl }: SiteShareImageFieldProps) {
  const [value, setValue] = useState(initialValue);
  const [previewUrl, setPreviewUrl] = useState(resolvePreviewUrl(initialValue, initialPreviewUrl));
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const resolvedPreviewUrl = useMemo(() => resolvePreviewUrl(value, previewUrl), [previewUrl, value]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/site/share-image", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as { ok: boolean; error?: string; shareImageUrl?: string };

      if (!response.ok || !payload.ok || !payload.shareImageUrl) {
        throw new Error(payload.error || "No se pudo subir la imagen social.");
      }

      setValue(payload.shareImageUrl);
      setPreviewUrl(payload.shareImageUrl);
      setFeedback("Imagen social actualizada.");
      setError(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen social.");
      setFeedback(null);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function handleManualChange(nextValue: string) {
    setValue(nextValue);
    setPreviewUrl(resolvePreviewUrl(nextValue, initialPreviewUrl));
    setFeedback(null);
    setError(null);
  }

  function handleClear() {
    setValue("");
    setPreviewUrl(initialPreviewUrl);
    setFeedback("Se usara la imagen social por defecto del sitio.");
    setError(null);
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="shareImageUrl" value={value} />

      <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
        <div className="aspect-[1.91/1] bg-slate-100 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolvedPreviewUrl} alt="Preview social" className="h-full w-full object-cover" />
        </div>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.14em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {isUploading ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              {isUploading ? "Subiendo" : "Subir foto"}
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-600 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
              <Trash2 className="size-4" />
              Usar default
            </button>

            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
            Puedes subir la imagen desde aqui o pegar manualmente una URL absoluta o ruta local del proyecto.
          </p>

          {feedback ? (
            <p className="rounded-[18px] border border-lime-200 bg-lime-50 px-3 py-2 text-sm font-semibold text-lime-700 dark:border-lime-500/30 dark:bg-lime-500/12 dark:text-lime-300">
              {feedback}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-[18px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-200">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Ruta o URL manual</span>
        <div className="relative">
          <ImagePlus className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            value={value}
            onChange={(event) => handleManualChange(event.target.value)}
            placeholder="https://... o /branding/lakja-logo.svg"
            className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-12 py-4 text-base font-medium text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-lime-500/40 dark:focus:bg-slate-900 dark:focus:ring-lime-500/10"
          />
        </div>
      </label>
    </div>
  );
}
