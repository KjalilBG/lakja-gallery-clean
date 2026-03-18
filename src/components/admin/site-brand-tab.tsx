"use client";

import { Globe2 } from "lucide-react";
import { useState } from "react";

import { SiteShareImageField } from "@/components/admin/site-share-image-field";

type SiteBrandTabProps = {
  initialShareTitle: string;
  initialShareDescription: string;
  initialShareImageValue: string;
  initialPreviewImageUrl: string;
  initialInstagramUrl: string;
  initialFacebookUrl: string;
  initialWhatsappNumber: string;
  initialWhatsappMessage: string;
};

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

export function SiteBrandTab({
  initialShareTitle,
  initialShareDescription,
  initialShareImageValue,
  initialPreviewImageUrl,
  initialInstagramUrl,
  initialFacebookUrl,
  initialWhatsappNumber,
  initialWhatsappMessage
}: SiteBrandTabProps) {
  const [shareTitle, setShareTitle] = useState(initialShareTitle);
  const [shareDescription, setShareDescription] = useState(initialShareDescription);
  const [shareImageUrl, setShareImageUrl] = useState(initialShareImageValue);
  const [previewImageUrl, setPreviewImageUrl] = useState(initialPreviewImageUrl);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
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
                value={shareTitle}
                onChange={(event) => setShareTitle(event.target.value)}
                maxLength={90}
                className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-lime-500/40 dark:focus:bg-slate-900 dark:focus:ring-lime-500/10"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>Descripcion al compartir</FieldLabel>
              <textarea
                name="shareDescription"
                value={shareDescription}
                onChange={(event) => setShareDescription(event.target.value)}
                rows={4}
                maxLength={180}
                className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-lime-500/40 dark:focus:bg-slate-900 dark:focus:ring-lime-500/10"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>Imagen al compartir</FieldLabel>
              <SiteShareImageField
                initialValue={shareImageUrl}
                initialPreviewUrl={previewImageUrl}
                onValueChange={(nextValue, nextPreviewUrl) => {
                  setShareImageUrl(nextValue);
                  setPreviewImageUrl(nextPreviewUrl);
                }}
              />
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard eyebrow="Redes" title="Canales sociales" description="Actualiza las ligas globales que usa la home y el popup de descarga.">
            <div className="grid gap-5">
              <div className="space-y-2">
                <FieldLabel>Instagram</FieldLabel>
                <input
                  name="instagramUrl"
                  defaultValue={initialInstagramUrl}
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-lime-500/40 dark:focus:bg-slate-900 dark:focus:ring-lime-500/10"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Facebook</FieldLabel>
                <input
                  name="facebookUrl"
                  defaultValue={initialFacebookUrl}
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-lime-500/40 dark:focus:bg-slate-900 dark:focus:ring-lime-500/10"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Contacto" title="WhatsApp" description="Controla el número general y el mensaje inicial del botón flotante.">
            <div className="grid gap-5">
              <div className="space-y-2">
                <FieldLabel>WhatsApp</FieldLabel>
                <input
                  name="whatsappNumber"
                  defaultValue={initialWhatsappNumber}
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-lime-500/40 dark:focus:bg-slate-900 dark:focus:ring-lime-500/10"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Mensaje inicial</FieldLabel>
                <textarea
                  name="whatsappMessage"
                  defaultValue={initialWhatsappMessage}
                  rows={4}
                  className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-700 outline-none transition focus:border-lime-300 focus:bg-white focus:ring-4 focus:ring-lime-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-lime-500/40 dark:focus:bg-slate-900 dark:focus:ring-lime-500/10"
                />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
          <div className="aspect-[1.4/1] bg-slate-100 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImageUrl} alt={shareTitle} className="h-full w-full object-cover" />
          </div>
          <div className="space-y-3 p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Globe2 className="size-3.5" />
              Preview estimado
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{shareTitle}</h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{shareDescription}</p>
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">lakja.top</p>
          </div>
        </section>
      </aside>
    </div>
  );
}
