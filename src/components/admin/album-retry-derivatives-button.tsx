"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RotateCcw } from "lucide-react";

type AlbumRetryDerivativesButtonProps = {
  albumId: string;
  slug: string;
  disabled?: boolean;
};

export function AlbumRetryDerivativesButton({
  albumId,
  slug,
  disabled = false
}: AlbumRetryDerivativesButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  async function handleRetry() {
    setIsSubmitting(true);
    setMessage(null);
    setMessageType(null);

    try {
      const response = await fetch(`/api/admin/albums/${albumId}/photos/retry-derivatives`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ slug })
      });

      const data = (await response.json()) as {
        ok?: boolean;
        retriedCount?: number;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No se pudieron reintentar las derivadas faltantes.");
      }

      if ((data.retriedCount ?? 0) > 0) {
        setMessageType("success");
        setMessage(
          data.retriedCount === 1
            ? "1 foto regreso a la cola para rehacer preview y thumb."
            : `${data.retriedCount} fotos regresaron a la cola para rehacer preview y thumb.`
        );
      } else {
        setMessageType("success");
        setMessage("No habia fotos pendientes por reintentar.");
      }

      router.refresh();
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "No se pudieron reintentar las derivadas faltantes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => void handleRetry()}
        disabled={disabled || isSubmitting}
        className="inline-flex items-center rounded-full border border-rose-300 bg-white px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-rose-700 transition hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <RotateCcw className="mr-2 size-4" />}
        Reintentar derivadas faltantes
      </button>
      {message ? (
        <p className={messageType === "error" ? "text-xs font-bold text-rose-700" : "text-xs font-bold text-slate-600"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
