"use client";

import { KeyRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";

type StaffAccessFormProps = {
  callbackUrl: string;
};

export function StaffAccessForm({ callbackUrl }: StaffAccessFormProps) {
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      accessCode,
      callbackUrl,
      redirect: false
    });

    setIsPending(false);

    if (!result?.ok || !result.url) {
      setError("Correo o código inválido.");
      return;
    }

    window.location.href = result.url;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div className="grid gap-2">
        <label className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Correo staff</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="staff@lakja.top"
          className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Código simple</label>
        <input
          type="password"
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          placeholder="Ej. 483921"
          className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>
      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-lime-500 px-6 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(101,163,13,0.22)] transition hover:bg-lime-600 disabled:opacity-60"
      >
        <KeyRound className="mr-2 size-4" />
        {isPending ? "Entrando..." : "Entrar staff"}
      </button>
    </form>
  );
}
