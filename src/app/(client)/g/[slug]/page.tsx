import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { AlbumPasswordGate } from "@/components/gallery/album-password-gate";
import { GalleryExperience } from "@/components/gallery/gallery-experience";
import { galleryPhotos } from "@/features/albums/mock-data";
import { SiteMaintenanceState } from "@/components/site/site-maintenance-state";
import { getAlbumAccessCookieName, verifyAlbumAccessToken } from "@/lib/album-access";
import { siteConfig } from "@/lib/config/site";
import { getObjectPositionFromFocus } from "@/lib/cover";
import { buildGalleryPhotosFromAlbum, getAlbumBySlug } from "@/lib/albums";
import { formatDate } from "@/lib/format";
import { toMediaRoute } from "@/lib/r2";
import { getSiteSettings, resolveAppUrl } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

type GalleryPageProps = {
  params: Promise<{ slug: string }>;
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function resolveAbsoluteImageUrl(input: string | null | undefined) {
  const baseUrl = resolveAppUrl();

  if (!input) {
    return `${baseUrl}${siteConfig.shareImageUrl}`;
  }

  return /^https?:\/\//i.test(input) ? input : `${baseUrl}${input.startsWith("/") ? input : `/${input}`}`;
}

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [album, siteSettings] = await Promise.all([getAlbumBySlug(slug), getSiteSettings()]);

  const title = album?.title ? `${album.title} | La Kja` : siteSettings.shareTitle;
  const description =
    album?.description?.trim() ||
    (album ? `${album.clientName} · Galeria fotografica en La Kja.` : siteSettings.shareDescription);
  const canonicalUrl = `${resolveAppUrl()}/appfotos/g/${slug}`;
  const imageUrl = album ? `${resolveAppUrl()}/api/og/albums/${encodeURIComponent(slug)}` : resolveAbsoluteImageUrl(siteSettings.shareImageUrl);

  return {
    title,
    description,
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    }
  };
}

export default async function GalleryPage({ params, searchParams }: GalleryPageProps & { searchParams: SearchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const [album, siteSettings] = await Promise.all([getAlbumBySlug(slug), getSiteSettings()]);

  if (siteSettings.maintenanceMode) {
    return (
      <SiteMaintenanceState
        title={siteSettings.maintenanceTitle}
        message={siteSettings.maintenanceMessage}
        whatsappNumber={siteSettings.whatsappNumber}
      />
    );
  }

  if (!album && slug !== "editorial-demo") {
    notFound();
  }

  if (album?.visibility === "PASSWORD" && album.passwordHash) {
    const cookieStore = await cookies();
    const accessCookie = cookieStore.get(getAlbumAccessCookieName(slug))?.value;
    const hasAccess = verifyAlbumAccessToken(slug, album.passwordHash, accessCookie);

    if (!hasAccess) {
      return <AlbumPasswordGate slug={slug} hasError={resolvedSearchParams.error === "password"} />;
    }
  }

  const title = album?.title ?? "Tizzy | Feb26";
  const clientName = album?.clientName ?? "Sesion editorial";
  const description =
    album?.description ?? '"Gracias por tu confianza..." Una galeria ligera y enfocada en disfrutar la seleccion.';
  const displayPhotos =
    album && album.photos.length > 0 ? buildGalleryPhotosFromAlbum(title, album.photos) : galleryPhotos;
  const heroPhoto =
    album?.coverPhoto
      ? toMediaRoute(album.coverPhoto.previewKey ?? album.coverPhoto.originalKey)
      : displayPhotos[0]?.url ?? "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80";
  const heroPosition = album ? getObjectPositionFromFocus(album.coverFocusX, album.coverFocusY) : "center center";

  return (
    <div className="space-y-5 md:space-y-10">
      <section className="space-y-4 rounded-[26px] border border-slate-200 bg-white px-3 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:space-y-8 md:rounded-[42px] md:px-6 md:py-6 lg:px-8 lg:py-8">
        <div
          className="min-h-[190px] rounded-[20px] bg-cover bg-center shadow-[0_16px_40px_rgba(15,23,42,0.12)] sm:min-h-[320px] md:min-h-[420px] md:rounded-[34px]"
          style={{ backgroundImage: `url(${heroPhoto})`, backgroundPosition: heroPosition }}
        />
        <div className="space-y-3 px-1 text-center md:space-y-5">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500 md:px-4 md:text-xs md:tracking-[0.26em]">
              {formatDate(album?.eventDate)}
            </span>
          </div>

          <div className="mx-auto max-w-4xl space-y-2.5 md:space-y-4">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 md:text-sm md:tracking-[0.32em]">{clientName}</p>
            <h1 className="text-[2rem] font-black tracking-tight text-slate-900 sm:text-4xl md:text-7xl">{title}</h1>
            <p className="mx-auto max-w-3xl text-sm font-medium italic leading-6 text-slate-600 md:text-xl md:leading-9">
              {description}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <GalleryExperience
          photos={displayPhotos}
          slug={slug}
          albumTitle={title}
          storageKey={`lakja-favorites-${slug}`}
          allowSingleDownload={siteSettings.downloadsEnabled && (album?.allowSingleDownload ?? true)}
          allowFavoritesDownload={siteSettings.downloadsEnabled && (album?.allowFavoritesDownload ?? true)}
          allowFullDownload={siteSettings.downloadsEnabled && (album?.allowFullDownload ?? true)}
          favoritesEnabled={siteSettings.favoritesEnabled}
          downloadsEnabled={siteSettings.downloadsEnabled}
          downloadPopupEnabled={siteSettings.downloadPopupEnabled}
          bibRecognitionEnabled={album?.bibRecognitionEnabled ?? false}
          instagramUrl={siteSettings.instagramUrl}
          facebookUrl={siteSettings.facebookUrl}
          whatsappNumber={siteSettings.whatsappNumber}
          downloadPopupTitle={siteSettings.downloadPopupTitle}
          downloadPopupBody={siteSettings.downloadPopupBody}
        />
      </section>
    </div>
  );
}
