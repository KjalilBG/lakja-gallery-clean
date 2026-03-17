"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ConfirmDeleteAlbumButton() {
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const confirmed = window.confirm("Esto eliminara el album completo y todas sus fotos. ¿Deseas continuar?");

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <Button
      type="submit"
      variant="ghost"
      className="w-full justify-center border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
      onClick={handleClick}
    >
      <Trash2 className="mr-2 size-4" />
      Eliminar album completo
    </Button>
  );
}
