"use client";

import { LogIn } from "lucide-react";
import { signIn } from "next-auth/react";

type GoogleSignInButtonProps = {
  callbackUrl: string;
};

export function GoogleSignInButton({ callbackUrl }: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
      className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
    >
      <LogIn className="mr-2 size-4" />
      Entrar con Google
    </button>
  );
}
