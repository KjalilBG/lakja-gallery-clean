"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Mail } from "lucide-react";

type AlbumReadyEmailButtonProps = {
  albumId: string;
  slug: string;
  label?: string;
};

export function AlbumReadyEmailButton({
  albumId,
  slug,
  label = "Reintentar correo"
}: AlbumReadyEmailButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setMessage(null);
    setMessageType(null);

    try {
      const response = await fetch(`/api/admin/albums/${albumId}/notify-ready-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ slug })
      });

      const data = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "No se pudo enviar el correo.");
      }

      if (data.ok) {
        setMessageType("success");
        setMessage("Correo enviado o ya marcado como enviado.");
      } else {
        throw new Error(data.error || "El correo no se pudo enviar todavia.");
      }

      router.refresh();
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "No se pudo enviar el correo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={isSubmitting}
        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-lime-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Mail className="mr-2 size-4" />}
        {label}
      </button>
      {message ? (
        <p className={messageType === "error" ? "text-xs font-bold text-rose-700" : "text-xs font-bold text-slate-600"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
