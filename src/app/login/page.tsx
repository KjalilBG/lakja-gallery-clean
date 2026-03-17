import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { getServerAuthSession } from "@/lib/auth";
import { LogoMark } from "@/components/ui/logo";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerAuthSession();
  const resolvedSearchParams = await searchParams;
  const callbackUrl =
    typeof resolvedSearchParams.callbackUrl === "string" ? resolvedSearchParams.callbackUrl : "/admin";
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <div className="flex min-h-[78vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-[38px] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.10)] md:p-10">
        <div className="mx-auto flex flex-col items-center gap-5">
          <LogoMark className="h-[102px] w-[102px]" />
          <div className="space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.34em] text-slate-400">Panel privado</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Acceso admin</h1>
            <p className="mx-auto max-w-md text-base leading-7 text-slate-500">
              Entra con tu cuenta de Google para gestionar albumes, subir fotos y preparar entregas de clientes.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-[22px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            Tu cuenta no tiene acceso al panel. Si quieres, luego dejamos una lista blanca de correos autorizados.
          </div>
        ) : null}

        <div className="mt-8">
          <GoogleSignInButton callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
}
