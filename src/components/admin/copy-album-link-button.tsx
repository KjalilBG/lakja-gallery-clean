"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyAlbumLinkButtonProps = {
  slug: string;
};

export function CopyAlbumLinkButton({ slug }: CopyAlbumLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/appfotos/g/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600 transition hover:border-lime-300 hover:text-slate-900"
    >
      {copied ? <Check className="mr-2 size-4 text-lime-600" /> : <Copy className="mr-2 size-4" />}
      {copied ? "Enlace copiado" : "Copiar enlace"}
    </button>
  );
}
