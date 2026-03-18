import { CheckCircle2, ShieldCheck, Wrench } from "lucide-react";

import { SiteBrandTab } from "@/components/admin/site-brand-tab";
import { getAdminAlbums } from "@/lib/albums";
import { requireSuperAdminSession } from "@/lib/auth-guard";
import { getSiteSettings, resolveSiteShareImageUrl } from "@/lib/site-settings";

import { saveSiteSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

type SiteSettingsPageProps = {
  searchParams?: Promise<{
    saved?: string;
    error?: string;
    tab?: string;
  }>;
};

type SiteTab = "summary" | "brand" | "home" | "client" | "operations";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">{children}</label>;
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
    <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)] md:p-8 dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_40px_rgba(2,6,23,0.4)]">
      <div className="mb-6 space-y-3 border-b border-slate-100 pb-6 dark:border-slate-800">
        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">{eyebrow}</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
        <p className="max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ToggleCard({
  name,
  title,
  description,
  defaultChecked
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-600 dark:hover:bg-slate-800">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-5 w-5 rounded border-slate-300 text-lime-500 focus:ring-lime-400"
      />
      <span className="block space-y-1">
        <span className="block text-sm font-black uppercase tracking-[0.14em] text-slate-900 dark:text-white">{title}</span>
        <span className="block text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</span>
      </span>
    </label>
  );
}

function getActiveTab(input?: string): SiteTab {
  const allowedTabs: SiteTab[] = ["summary", "brand", "home", "client", "operations"];
  return allowedTabs.includes(input as SiteTab) ? (input as SiteTab) : "summary";
}

export default async function SiteSettingsPage({ searchParams }: SiteSettingsPageProps) {
  await requireSuperAdminSession("/admin/site");

  const [settings, adminAlbums, resolvedSearchParams] = await Promise.all([
    getSiteSettings(),
    getAdminAlbums(),
    searchParams ?? Promise.resolve({} as { saved?: string; error?: string; tab?: string })
  ]);

  const saved = resolvedSearchParams.saved === "1";
  const errorMessage = resolvedSearchParams.error ?? null;
  const activeTab = getActiveTab(resolvedSearchParams.tab);
  const previewImageUrl = resolveSiteShareImageUrl(settings.shareImageUrl);
  const publishedAlbums = adminAlbums.filter((album) => album.status === "published");
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const tabs: Array<{ key: SiteTab; label: string }> = [
    { key: "summary", label: "Resumen" },
    { key: "brand", label: "Marca" },
    { key: "home", label: "Home" },
    { key: "client", label: "Cliente" },
    { key: "operations", label: "Operacion" }
  ];
  const enabledFeatureCount = [
    settings.showWhatsAppFloat,
    settings.downloadsEnabled,
    settings.favoritesEnabled,
    settings.downloadPopupEnabled
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f8fafc)] p-8 shadow-[0_14px_35px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-[linear-gradient(135deg,#111827,#0f172a)] dark:shadow-[0_18px_40px_rgba(2,6,23,0.42)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">Super admin</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-900 dark:text-white">Sitio y marca</h1>
            <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-300">
              Controla el preview social, la portada, la experiencia de cliente y el estado general de La Kja desde un
              solo lugar.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-lime-700 dark:border-lime-500/30 dark:bg-lime-500/12 dark:text-lime-300">
            <ShieldCheck className="size-4" />
            Solo super admin
          </span>
        </div>
      </section>

      {saved ? (
        <div className="flex items-center gap-3 rounded-[26px] border border-lime-200 bg-lime-50 px-5 py-4 text-sm font-semibold text-lime-800 dark:border-lime-500/30 dark:bg-lime-500/12 dark:text-lime-200">
          <CheckCircle2 className="size-5" />
          La configuracion del sitio se guardo correctamente.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-200">{errorMessage}</div>
      ) : null}

      <form action={saveSiteSettingsAction} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white px-4 py-4 shadow-[0_14px_35px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <a
                  key={tab.key}
                  href={`/admin/site?tab=${tab.key}`}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.14em] transition md:text-sm ${
                    activeTab === tab.key
                      ? "bg-slate-950 text-white shadow-[0_10px_25px_rgba(15,23,42,0.14)] dark:bg-white dark:text-slate-950"
                      : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </a>
              ))}
            </div>
          </section>

          {activeTab === "summary" ? (
            <>
              <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-800/70">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Estado publico</p>
                    <p className="mt-2 text-lg font-black tracking-tight text-slate-950 dark:text-white">
                      {settings.maintenanceMode ? "Mantenimiento" : "Activo"}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-800/70">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Galerias destacadas</p>
                    <p className="mt-2 text-lg font-black tracking-tight text-slate-950 dark:text-white">{settings.featuredAlbumIds.length}</p>
                  </div>
                  <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-800/70">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Funciones activas</p>
                    <p className="mt-2 text-lg font-black tracking-tight text-slate-950 dark:text-white">{enabledFeatureCount}/4</p>
                  </div>
                </div>
              </section>

              <SectionCard
                eyebrow="Resumen"
                title="Panorama general"
                description="Desde aqui ves de un vistazo el estado del sitio, los permisos y el alcance actual de este panel."
              >
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Alcance actual</p>
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                        <li>Preview general del sitio al compartir en WhatsApp, Facebook y apps similares.</li>
                        <li>Textos principales de la home y galerias destacadas.</li>
                        <li>Redes sociales globales y botón flotante de WhatsApp.</li>
                        <li>Popup de descarga, favoritas y toggles de cliente.</li>
                        <li>Modo mantenimiento y control de acceso público.</li>
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="flex items-center gap-2 text-slate-900">
                        <ShieldCheck className="size-4 text-lime-600" />
                        <p className="text-sm font-black uppercase tracking-[0.14em]">Super admins</p>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        {(superAdminEmails.length > 0 ? superAdminEmails : adminEmails.slice(0, 1)).map((email) => (
                          <p key={email} className="truncate font-semibold text-slate-700">
                            {email}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="flex items-center gap-2 text-slate-900">
                        <Wrench className="size-4 text-slate-500" />
                        <p className="text-sm font-black uppercase tracking-[0.14em]">Admins</p>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        {adminEmails.map((email) => (
                          <p key={email} className="truncate font-semibold text-slate-700">
                            {email}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </>
          ) : null}

          {activeTab === "brand" ? (
            <SiteBrandTab
              initialShareTitle={settings.shareTitle}
              initialShareDescription={settings.shareDescription}
              initialShareImageValue={settings.shareImageUrl ?? ""}
              initialPreviewImageUrl={previewImageUrl}
              initialInstagramUrl={settings.instagramUrl}
              initialFacebookUrl={settings.facebookUrl}
              initialWhatsappNumber={settings.whatsappNumber}
              initialWhatsappMessage={settings.whatsappMessage}
            />
          ) : null}

          {activeTab === "home" ? (
            <>
              <SectionCard eyebrow="Home" title="Textos principales" description="Ajusta el tono de bienvenida y el mensaje central de la portada sin tocar código.">
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel>Insignia superior</FieldLabel>
                    <input name="homeBadge" defaultValue={settings.homeBadge} className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100" />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Texto superior</FieldLabel>
                    <input name="homeEyebrow" defaultValue={settings.homeEyebrow} className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100" />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <FieldLabel>Titulo principal</FieldLabel>
                    <textarea name="homeTitle" defaultValue={settings.homeTitle} rows={3} className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold leading-7 text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100" />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <FieldLabel>Descripcion principal</FieldLabel>
                    <textarea name="homeDescription" defaultValue={settings.homeDescription} rows={5} className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100" />
                  </div>
                </div>
              </SectionCard>
              <SectionCard eyebrow="Curaduria" title="Galerias destacadas" description="Elige manualmente qué álbumes publicados quieres ver primero en la home.">
                {publishedAlbums.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {publishedAlbums.map((album) => (
                      <label key={album.id} className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 transition hover:border-slate-300 hover:bg-white">
                        <input type="checkbox" name="featuredAlbumIds" value={album.id} defaultChecked={settings.featuredAlbumIds.includes(album.id)} className="mt-1 h-5 w-5 rounded border-slate-300 text-lime-500 focus:ring-lime-400" />
                        <span className="block min-w-0 space-y-1">
                          <span className="block truncate text-sm font-black uppercase tracking-[0.12em] text-slate-900">{album.title}</span>
                          <span className="block truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{album.clientName}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                    Aun no hay albumes publicados para destacar.
                  </div>
                )}
              </SectionCard>
            </>
          ) : null}

          {activeTab === "client" ? (
            <>
              <SectionCard eyebrow="Experiencia cliente" title="Popup de descarga" description="Afina el mensaje de agradecimiento que aparece apenas empieza una descarga.">
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <FieldLabel>Titulo del popup</FieldLabel>
                    <input name="downloadPopupTitle" defaultValue={settings.downloadPopupTitle} className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100" />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Texto del popup</FieldLabel>
                    <textarea name="downloadPopupBody" defaultValue={settings.downloadPopupBody} rows={4} className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100" />
                  </div>
                </div>
              </SectionCard>
              <SectionCard eyebrow="Funciones" title="Toggles de cliente" description="Controla rapido lo que el cliente ve y puede hacer en galerias.">
                <div className="grid gap-4 md:grid-cols-2">
                  <ToggleCard name="showWhatsAppFloat" title="Boton flotante de WhatsApp" description="Muestra o esconde el acceso flotante de contacto en la web publica." defaultChecked={settings.showWhatsAppFloat} />
                  <ToggleCard name="downloadsEnabled" title="Descargas habilitadas" description="Control general para descargas desde galerias publicas." defaultChecked={settings.downloadsEnabled} />
                  <ToggleCard name="favoritesEnabled" title="Favoritas habilitadas" description="Permite marcar favoritas y enviar seleccion desde las galerias." defaultChecked={settings.favoritesEnabled} />
                  <ToggleCard name="downloadPopupEnabled" title="Popup social de descarga" description="Muestra el popup de agradecimiento despues de iniciar una descarga." defaultChecked={settings.downloadPopupEnabled} />
                </div>
              </SectionCard>
            </>
          ) : null}

          {activeTab === "operations" ? (
            <SectionCard eyebrow="Mantenimiento" title="Control publico" description="Si activas este modo, la home y las galerias publicas muestran una pantalla temporal de mantenimiento.">
              <div className="space-y-5">
                <ToggleCard name="maintenanceMode" title="Modo mantenimiento" description="Oculta temporalmente la experiencia publica normal y muestra un mensaje global con acceso directo a WhatsApp." defaultChecked={settings.maintenanceMode} />
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <FieldLabel>Titulo de mantenimiento</FieldLabel>
                    <input name="maintenanceTitle" defaultValue={settings.maintenanceTitle} className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100" />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Mensaje de mantenimiento</FieldLabel>
                    <textarea name="maintenanceMessage" defaultValue={settings.maintenanceMessage} rows={4} className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100" />
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                Guardar configuracion
              </button>
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">Los cambios aplican al sitio apenas se guarda la configuracion.</p>
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Tab activa</p>
            <div className="mt-4 rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-800/70">
              <p className="text-lg font-black tracking-tight text-slate-950 dark:text-white">{tabs.find((tab) => tab.key === activeTab)?.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">Trabaja por bloques para que el panel se sienta mas limpio y facil de operar.</p>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#fafaf9,#ffffff)] p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-[linear-gradient(135deg,#111827,#0f172a)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Vista rapida</p>
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
