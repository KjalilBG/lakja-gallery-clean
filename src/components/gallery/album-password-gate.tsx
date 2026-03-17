import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";

import { unlockAlbumAction } from "@/app/(client)/g/[slug]/actions";

type AlbumPasswordGateProps = {
  slug: string;
  hasError?: boolean;
};

export function AlbumPasswordGate({ slug, hasError = false }: AlbumPasswordGateProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:rounded-[34px] sm:p-8">
        <div className="mx-auto flex flex-col items-center gap-4">
          <LogoMark className="h-[68px] w-[68px] sm:h-[82px] sm:w-[82px]" />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 sm:h-14 sm:w-14">
            <LockKeyhole className="size-6 sm:size-7" />
          </div>
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:mt-6 sm:text-4xl">Galeria protegida</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
          Esta sesion requiere una contrasena para poder visualizar el album.
        </p>

        <form action={unlockAlbumAction} className="mt-8 space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <input
            name="password"
            type="password"
            placeholder="Introduce la contrasena"
            className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-center outline-none transition focus:border-lime-400 focus:bg-white"
            required
          />
          {hasError ? <p className="text-sm font-bold text-rose-600">La contrasena no es correcta.</p> : null}
          <SubmitButton idleLabel="Acceder a la galeria" pendingLabel="Validando..." />
        </form>

        <div className="mt-4">
          <Link href="/">
            <Button variant="ghost">Volver</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
