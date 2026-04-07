"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyPublicLinkButtonProps = {
  slug: string;
  className?: string;
  url?: string;
  defaultLabel?: string;
  copiedLabel?: string;
};

export function CopyPublicLinkButton({
  slug,
  className,
  url,
  defaultLabel = "Copiar enlace",
  copiedLabel = "Enlace copiado"
}: CopyPublicLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const targetUrl = url ?? `${window.location.origin}/appfotos/g/${slug}`;
    await navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className={cn("px-4 py-3 text-[11px] tracking-[0.12em] md:text-sm md:tracking-[0.16em]", className)}
      onClick={handleCopy}
    >
      {copied ? <Check className="mr-2 size-4 text-lime-600" /> : <Copy className="mr-2 size-4" />}
      {copied ? copiedLabel : defaultLabel}
    </Button>
  );
}
