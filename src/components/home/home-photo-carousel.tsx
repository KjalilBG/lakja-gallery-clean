"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type HomeCarouselPhoto = {
  id: string;
  slug: string;
  albumTitle: string;
  title: string;
  imageUrl: string;
};

type HomePhotoCarouselProps = {
  photos: HomeCarouselPhoto[];
};

export function HomePhotoCarousel({ photos }: HomePhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % photos.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <div className="relative min-h-[420px] overflow-hidden rounded-[32px] border border-fuchsia-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]" />
    );
  }

  const activePhoto = photos[activeIndex];

  return (
    <div className="space-y-4">
      <Link
        href={`/appfotos/g/${activePhoto.slug}`}
        className="group relative block min-h-[420px] overflow-hidden rounded-[32px] border border-fuchsia-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={photo.imageUrl}
              alt={photo.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/60 via-slate-950/15 to-transparent px-6 pb-6 pt-20 text-white">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/75">{photo.albumTitle}</p>
              <p className="mt-2 text-2xl font-black tracking-tight">{photo.title}</p>
            </div>
          </div>
        ))}
      </Link>

      {photos.length > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {photos.map((photo, index) => (
            <button
              key={`${photo.id}-dot`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`rounded-full transition-all ${
                index === activeIndex ? "h-2.5 w-8 bg-fuchsia-500" : "h-2.5 w-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Ver foto ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
