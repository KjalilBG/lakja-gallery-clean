"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type HomePreviewContactFormProps = {
  whatsappNumber: string;
  defaultMessage: string;
};

export function HomePreviewContactForm({ whatsappNumber, defaultMessage }: HomePreviewContactFormProps) {
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState("documental social");
  const [message, setMessage] = useState("");

  const isDisabled = useMemo(() => !whatsappNumber.trim(), [whatsappNumber]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanNumber = whatsappNumber.replace(/\D/g, "");
    if (!cleanNumber) {
      return;
    }

    const composedMessage = [
      defaultMessage || "Hola, quiero abrir un proyecto con LaKja.",
      "",
      `Nombre: ${name || "Por definir"}`,
      `Tipo de proyecto: ${projectType}`,
      `Contexto: ${message || "Te comparto mas detalles en cuanto me respondas."}`
    ].join("\n");

    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(composedMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/46">Tu nombre</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Como te llamas?"
            className="min-h-12 w-full rounded-[20px] border border-white/12 bg-white/8 px-4 text-sm text-white outline-none transition placeholder:text-white/36 focus:border-[#5aab14]"
          />
        </label>
        <label className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/46">Que necesitas?</span>
          <select
            value={projectType}
            onChange={(event) => setProjectType(event.target.value)}
            className="min-h-12 w-full rounded-[20px] border border-white/12 bg-white/8 px-4 text-sm text-white outline-none transition focus:border-[#5aab14]"
          >
            <option value="documental social">Documental social</option>
            <option value="fotografia deportiva">Fotografia deportiva</option>
            <option value="comunicacion organizacional">Comunicacion organizacional</option>
            <option value="talleres y experiencias">Talleres y experiencias</option>
            <option value="habilidades blandas">Habilidades blandas</option>
            <option value="merch y produccion">Merch y produccion</option>
            <option value="galerias premium">Plataforma de galerias</option>
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/46">Cuentanos rapido</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          placeholder="Que quieres contar, cubrir, activar o producir?"
          className="w-full rounded-[22px] border border-white/12 bg-white/8 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/36 focus:border-[#f0186e]"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="min-h-12 bg-[#5aab14] px-6 text-white hover:bg-[#4f9913]" disabled={isDisabled}>
          Enviar briefing
        </Button>
        <p className="self-center text-xs leading-6 text-white/52">
          Esto abre WhatsApp con tu mensaje prellenado.
        </p>
      </div>
    </form>
  );
}
