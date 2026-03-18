"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

type CopyPublicLinkButtonProps = {
  slug: string;
};

export function CopyPublicLinkButton({ slug }: CopyPublicLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/g/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="px-4 py-3 text-[11px] tracking-[0.12em] md:text-sm md:tracking-[0.16em]"
      onClick={handleCopy}
    >
      {copied ? <Check className="mr-2 size-4 text-lime-600" /> : <Copy className="mr-2 size-4" />}
      {copied ? "Enlace copiado" : "Copiar enlace"}
    </Button>
  );
}
