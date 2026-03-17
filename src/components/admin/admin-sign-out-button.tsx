"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function AdminSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
    >
      <LogOut className="mr-2 size-4" />
      Cerrar sesion
    </button>
  );
}
