import { CheckCircle2, Globe2, ShieldCheck } from "lucide-react";

import { requireSuperAdminSession } from "@/lib/auth-guard";
import { getSiteSettings, resolveSiteShareImageUrl } from "@/lib/site-settings";

import { saveSiteSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

type SiteSettingsPageProps = {
  searchParams?: Promise<{
    saved?: string;
    error?: string;
  }>;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">{children}</label>;
}

function SectionCard({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)] md:p-8">
      <div className="mb-6 space-y-3 border-b border-slate-100 pb-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400">{eyebrow}</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">{title}</h2>
        <p className="max-w-2xl text-sm leading-7 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function SiteSettingsPage({ searchParams }: SiteSettingsPageProps) {
  await requireSuperAdminSession("/admin/site");

  const [settings, resolvedSearchParams] = await Promise.all([
    getSiteSettings(),
    searchParams ?? Promise.resolve({} as { saved?: string; error?: string })
  ]);

  const saved = resolvedSearchParams.saved === "1";
  const errorMessage = resolvedSearchParams.error ?? null;
  const previewImageUrl = resolveSiteShareImageUrl(settings.shareImageUrl);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f8fafc)] p-8 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-slate-400">Super admin</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-900">Sitio y marca</h1>
            <p className="mt-4 text-base leading-7 text-slate-500">
              Desde aqui controlas el preview al compartir, los textos principales de la home, las redes sociales y el
              contacto general de La Kja.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-lime-700">
            <ShieldCheck className="size-4" />
            Solo super admin
          </span>
        </div>
      </section>

      {saved ? (
        <div className="flex items-center gap-3 rounded-[26px] border border-lime-200 bg-lime-50 px-5 py-4 text-sm font-semibold text-lime-800">
          <CheckCircle2 className="size-5" />
          La configuracion del sitio se guardo correctamente.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">{errorMessage}</div>
      ) : null}

      <form action={saveSiteSettingsAction} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <SectionCard
            eyebrow="Compartido"
            title="Preview social"
            description="Controla como se presenta lakja.top cuando alguien lo comparte en WhatsApp, Facebook y otras apps."
          >
            <div className="grid gap-5">
              <div className="space-y-2">
                <FieldLabel>Titulo al compartir</FieldLabel>
                <input
                  name="shareTitle"
                  defaultValue={settings.shareTitle}
                  maxLength={90}
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Descripcion al compartir</FieldLabel>
                <textarea
                  name="shareDescription"
                  defaultValue={settings.shareDescription}
                  rows={4}
                  maxLength={180}
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Imagen al compartir</FieldLabel>
                <input
                  name="shareImageUrl"
                  defaultValue={settings.shareImageUrl ?? ""}
                  placeholder="https://... o /branding/lakja-logo.svg"
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Home"
            title="Textos principales"
            description="Ajusta el tono de bienvenida y el mensaje central de la portada sin tocar código."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel>Insignia superior</FieldLabel>
                <input
                  name="homeBadge"
                  defaultValue={settings.homeBadge}
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Texto superior</FieldLabel>
                <input
                  name="homeEyebrow"
                  defaultValue={settings.homeEyebrow}
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <FieldLabel>Titulo principal</FieldLabel>
                <textarea
                  name="homeTitle"
                  defaultValue={settings.homeTitle}
                  rows={3}
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold leading-7 text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <FieldLabel>Descripcion principal</FieldLabel>
                <textarea
                  name="homeDescription"
                  defaultValue={settings.homeDescription}
                  rows={5}
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                />
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              eyebrow="Redes"
              title="Canales sociales"
              description="Actualiza las ligas globales que usa la home y el popup de descarga."
            >
              <div className="grid gap-5">
                <div className="space-y-2">
                  <FieldLabel>Instagram</FieldLabel>
                  <input
                    name="instagramUrl"
                    defaultValue={settings.instagramUrl}
                    className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Facebook</FieldLabel>
                  <input
                    name="facebookUrl"
                    defaultValue={settings.facebookUrl}
                    className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Contacto"
              title="WhatsApp"
              description="Controla el número general y el mensaje inicial del botón flotante."
            >
              <div className="grid gap-5">
                <div className="space-y-2">
                  <FieldLabel>WhatsApp</FieldLabel>
                  <input
                    name="whatsappNumber"
                    defaultValue={settings.whatsappNumber}
                    className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Mensaje inicial</FieldLabel>
                  <textarea
                    name="whatsappMessage"
                    defaultValue={settings.whatsappMessage}
                    rows={4}
                    className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            eyebrow="Experiencia cliente"
            title="Popup de descarga"
            description="Afina el mensaje de agradecimiento que aparece apenas empieza una descarga."
          >
            <div className="grid gap-5">
              <div className="space-y-2">
                <FieldLabel>Titulo del popup</FieldLabel>
                <input
                  name="downloadPopupTitle"
                  defaultValue={settings.downloadPopupTitle}
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Texto del popup</FieldLabel>
                <textarea
                  name="downloadPopupBody"
                  defaultValue={settings.downloadPopupBody}
                  rows={4}
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100"
                />
              </div>
            </div>
          </SectionCard>

          <div className="rounded-[30px] border border-slate-200 bg-white px-6 py-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800"
              >
                Guardar configuracion
              </button>
              <p className="text-sm leading-6 text-slate-500">
                Los cambios aplican a la home, al popup de descarga, al botón flotante y al preview social general.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
            <div className="aspect-[1.4/1] bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImageUrl} alt={settings.shareTitle} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-3 p-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                <Globe2 className="size-3.5" />
                Preview estimado
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">{settings.shareTitle}</h2>
              <p className="text-sm leading-6 text-slate-600">{settings.shareDescription}</p>
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400">lakja.top</p>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400">Alcance actual</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>Preview general del sitio al compartir en WhatsApp, Facebook y apps similares.</li>
              <li>Textos principales de la home.</li>
              <li>Redes sociales globales y botón flotante de WhatsApp.</li>
              <li>Copy del popup de descarga para clientes.</li>
            </ul>
          </section>
          <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#fafaf9,#ffffff)] p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400">Vista rapida</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Home</p>
                <p className="mt-2 text-lg font-black tracking-tight text-slate-950">{settings.homeTitle}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Instagram</p>
                  <p className="mt-2 truncate text-sm font-semibold text-slate-700">{settings.instagramUrl}</p>
                </div>
                <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">WhatsApp</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{settings.whatsappNumber}</p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
