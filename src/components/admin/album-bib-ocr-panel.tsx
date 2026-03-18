"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSearch, LoaderCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

type AlbumBibOcrPanelProps = {
  albumId: string;
  enabled: boolean;
  photoCount: number;
  recognizedCount: number;
  processedAt: string | null;
  job?: {
    id: string;
    status: "pending" | "running" | "completed" | "failed";
    total: number;
    processed: number;
    recognized: number;
    failed: number;
    skipped: number;
    remaining: number;
    batchSize: number;
    mode: "all" | "pending";
    updatedAt: string;
  } | null;
};

export function AlbumBibOcrPanel({
  albumId,
  enabled,
  photoCount,
  recognizedCount,
  processedAt,
  job
}: AlbumBibOcrPanelProps) {
  const router = useRouter();
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isProcessingPending, setIsProcessingPending] = useState(false);
  const [isProcessingNext, setIsProcessingNext] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");

  async function enqueue(mode: "all" | "pending") {
    if (!enabled || photoCount === 0) return;

    setError("");
    setSummary("");
    mode === "all" ? setIsProcessingAll(true) : setIsProcessingPending(true);

    try {
      const response = await fetch(`/api/admin/albums/${albumId}/bibs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "enqueue", mode, batchSize: 25 })
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        total?: number;
        batchSize?: number;
        remaining?: number;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No se pudo procesar OCR.");
      }

      setSummary(
        `Cola creada con ${data.total ?? 0} foto(s). Se procesaran en lotes de ${data.batchSize ?? 25}.`
      );
      router.refresh();
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : "No se pudo procesar OCR.");
    } finally {
      setIsProcessingAll(false);
      setIsProcessingPending(false);
    }
  }

  async function processNext() {
    if (!enabled || !job || job.remaining === 0) return;

    setError("");
    setSummary("");
    setIsProcessingNext(true);

    try {
      const response = await fetch(`/api/admin/albums/${albumId}/bibs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "process-next" })
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        processedInBatch?: number;
        recognizedInBatch?: number;
        failedInBatch?: number;
        remaining?: number;
        completed?: boolean;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No se pudo procesar el siguiente lote.");
      }

      setSummary(
        data.completed
          ? `Lote final listo. Procesadas ${data.processedInBatch ?? 0}, detectadas ${data.recognizedInBatch ?? 0}, sin lectura ${data.failedInBatch ?? 0}.`
          : `Lote listo. Procesadas ${data.processedInBatch ?? 0}, detectadas ${data.recognizedInBatch ?? 0}, sin lectura ${data.failedInBatch ?? 0}. Restan ${data.remaining ?? 0}.`
      );
      router.refresh();
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : "No se pudo procesar el siguiente lote.");
    } finally {
      setIsProcessingNext(false);
    }
  }

  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <FileSearch className="size-5 text-slate-500" />
        <p className="font-black uppercase tracking-[0.18em] text-slate-900">OCR de bibs</p>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-500">
        Procesa las fotos de este album para detectar numeros de bib y habilitar la busqueda en galeria.
      </p>
      <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        <p className="font-bold text-slate-900">{recognizedCount} foto(s) con bib detectado</p>
        <p className="mt-2">
          {processedAt ? `Ultimo procesamiento: ${processedAt}` : "Todavia no se ha corrido OCR en este album."}
        </p>
        {job ? (
          <div className="mt-4 rounded-[18px] border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
              <ShieldCheck className="size-4 text-slate-400" />
              Cola segura OCR
            </div>
            <p className="mt-2 text-sm font-bold text-slate-900">
              {job.processed} / {job.total} procesadas
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Detectadas {job.recognized}, sin lectura {job.failed}, pendientes {job.remaining}, lote de {job.batchSize}.
            </p>
          </div>
        ) : null}
      </div>

      {summary ? (
        <div className="mt-4 rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800">
          {summary}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <Button onClick={() => void enqueue("all")} disabled={!enabled || photoCount === 0 || isProcessingAll || isProcessingPending || isProcessingNext} className="w-full">
          {isProcessingAll ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
          Crear cola completa
        </Button>
        <Button
          variant="secondary"
          onClick={() => void enqueue("pending")}
          disabled={!enabled || photoCount === 0 || isProcessingAll || isProcessingPending || isProcessingNext}
          className="w-full"
        >
          {isProcessingPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
          Crear cola solo pendientes
        </Button>
        <Button
          variant="secondary"
          onClick={() => void processNext()}
          disabled={!enabled || !job || job.remaining === 0 || isProcessingAll || isProcessingPending || isProcessingNext}
          className="w-full"
        >
          {isProcessingNext ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
          {job && job.remaining > 0 ? "Procesar siguiente lote" : "No hay lote pendiente"}
        </Button>
      </div>
    </div>
  );
}
