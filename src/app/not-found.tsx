import { unstable_noStore as noStore } from "next/cache";

import { RandomNotFoundState } from "@/components/site/random-not-found-state";
import { getPublishedShowcasePhotos } from "@/lib/albums";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=80"
];

export default async function NotFound() {
  noStore();

  const showcasePhotos = await getPublishedShowcasePhotos(24);
  const galleryImages = showcasePhotos
    .filter((photo) => photo.aspect === "landscape")
    .map((photo) => photo.imageUrl)
    .filter(Boolean);
  const images = galleryImages.length > 0 ? galleryImages : FALLBACK_IMAGES;

  return <RandomNotFoundState images={images} />;
}
