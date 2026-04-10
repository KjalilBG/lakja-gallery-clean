import type { Metadata } from "next";

import {
  FinalCTASection,
  GalleryPlatformSection,
  HeroSection,
  ProcessSection,
  ServicesSection,
  TrustSection,
  ValueSection
} from "@/components/home/home-preview-sections";
import { getHomepageAlbums, getPublishedShowcasePhotos } from "@/lib/albums";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home Preview | La Kja",
  description: "Preview editorial y comercial para la nueva homepage de LaKja Casa Creativa."
};

export default async function HomePreviewPage() {
  const settings = await getSiteSettings();
  const [albums, showcasePhotos] = await Promise.all([
    getHomepageAlbums(3),
    getPublishedShowcasePhotos(6, settings.featuredAlbumIds)
  ]);

  const heroMain = showcasePhotos[0]?.imageUrl ?? albums[0]?.coverUrl ?? "";
  const heroSecond = showcasePhotos[1]?.imageUrl ?? heroMain;
  const heroThird = showcasePhotos[2]?.imageUrl ?? heroMain;
  const valuePhoto = showcasePhotos[3]?.imageUrl ?? heroMain;
  const contactPhoto = showcasePhotos[4]?.imageUrl ?? heroMain;
  const contactHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(settings.whatsappMessage)}`
    : settings.instagramUrl;

  return (
    <div className="space-y-20 pb-20 md:space-y-28">
      <HeroSection
        heroMain={heroMain}
        heroSecond={heroSecond}
        heroThird={heroThird}
        contactHref={contactHref}
      />
      <ValueSection valuePhoto={valuePhoto} />
      <ServicesSection />
      <ProcessSection />
      <TrustSection />
      <GalleryPlatformSection albums={albums} />
      <FinalCTASection
        contactPhoto={contactPhoto}
        contactHref={contactHref}
        instagramUrl={settings.instagramUrl}
        whatsappNumber={settings.whatsappNumber}
        whatsappMessage={settings.whatsappMessage}
      />
    </div>
  );
}
