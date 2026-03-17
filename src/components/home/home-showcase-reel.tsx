"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";

type ShowcasePhoto = {
  id: string;
  slug: string;
  albumTitle: string;
  title: string;
  imageUrl: string;
  thumbUrl: string;
};

type HomeShowcaseReelProps = {
  photos: ShowcasePhoto[];
};

type ReelCard = {
  key: string;
  photo: ShowcasePhoto;
  slot: -1 | 0 | 1 | 2 | 3;
};

function getSlotStyle(slot: ReelCard["slot"]): CSSProperties {
  switch (slot) {
    case -1:
      return {
        left: "-8%",
        top: "24%",
        zIndex: 6,
        opacity: 0,
        filter: "blur(4px)",
        transform: "rotate(-15deg) scale(0.82)"
      };
    case 0:
      return {
        left: "2.5%",
        top: "20%",
        zIndex: 12,
        opacity: 0.82,
        filter: "blur(0px)",
        transform: "rotate(-12deg) scale(0.89)"
      };
    case 1:
      return {
        left: "24%",
        top: "0%",
        zIndex: 22,
        opacity: 1,
        filter: "blur(0px)",
        transform: "rotate(4deg) scale(1.1)"
      };
    case 2:
      return {
        left: "60%",
        top: "25%",
        zIndex: 10,
        opacity: 0.8,
        filter: "blur(0px)",
        transform: "rotate(-7deg) scale(0.88)"
      };
    case 3:
      return {
        left: "84%",
        top: "20%",
        zIndex: 4,
        opacity: 0,
        filter: "blur(6px)",
        transform: "rotate(12deg) scale(0.82)"
      };
  }
}

function getCardClass(slot: ReelCard["slot"]) {
  const hero = slot === 1;
  return hero
    ? "w-[210px] md:w-[278px] shadow-[0_34px_64px_rgba(15,23,42,0.24)]"
    : "w-[182px] md:w-[236px] shadow-[0_18px_34px_rgba(15,23,42,0.12)]";
}

export function HomeShowcaseReel({ photos }: HomeShowcaseReelProps) {
  const [cards, setCards] = useState<ReelCard[]>([]);
  const [frontIndex, setFrontIndex] = useState(0);
  const frontIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const cycleRef = useRef<number | null>(null);
  const settleRef = useRef<number | null>(null);

  const totalVisible = Math.min(3, photos.length);

  useEffect(() => {
    if (photos.length === 0) {
      setCards([]);
      return;
    }

    const initialCards = Array.from({ length: totalVisible }, (_, index) => ({
      key: `${photos[index].id}-initial-${index}`,
      photo: photos[index],
      slot: index as 0 | 1 | 2
    }));

    setCards(initialCards);
    setFrontIndex(0);
    frontIndexRef.current = 0;
    isAnimatingRef.current = false;
  }, [photos, totalVisible]);

  useEffect(() => {
    if (photos.length <= 3 || totalVisible === 0) return;

    function runCycle() {
      if (isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      const currentFrontIndex = frontIndexRef.current;
      const nextPhotoIndex = (currentFrontIndex + totalVisible) % photos.length;
      const nextPhoto = photos[nextPhotoIndex];

      setCards((current) => {
        if (current.length !== totalVisible) return current;

        return [
          { ...current[0], slot: -1 },
          { ...current[1], slot: 0 },
          { ...current[2], slot: 1 },
          {
            key: `${nextPhoto.id}-${Date.now()}`,
            photo: nextPhoto,
            slot: 3
          }
        ];
      });

      window.clearTimeout(settleRef.current ?? undefined);
      settleRef.current = window.setTimeout(() => {
        setCards((current) =>
          current.map((card) => {
            if (card.slot === 3) {
              return { ...card, slot: 2 };
            }

            return card;
          })
        );
      }, 50);

      window.clearTimeout(cycleRef.current ?? undefined);
      cycleRef.current = window.setTimeout(() => {
        setCards((current) => current.filter((card) => card.slot !== -1));
        const nextFront = (currentFrontIndex + 1) % photos.length;
        frontIndexRef.current = nextFront;
        setFrontIndex(nextFront);
        isAnimatingRef.current = false;
      }, 1180);
    }

    const intervalId = window.setInterval(runCycle, 4600);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(settleRef.current ?? undefined);
      window.clearTimeout(cycleRef.current ?? undefined);
    };
  }, [photos, totalVisible]);

  const dots = useMemo(
    () => Array.from({ length: totalVisible }, (_, index) => photos[(frontIndex + index) % photos.length]),
    [frontIndex, photos, totalVisible]
  );

  function jumpToIndex(nextFrontIndex: number) {
    window.clearTimeout(settleRef.current ?? undefined);
    window.clearTimeout(cycleRef.current ?? undefined);
    isAnimatingRef.current = false;
    const nextCards = Array.from({ length: totalVisible }, (_, index) => ({
      key: `${photos[(nextFrontIndex + index) % photos.length].id}-jump-${index}-${Date.now()}`,
      photo: photos[(nextFrontIndex + index) % photos.length],
      slot: index as 0 | 1 | 2
    }));

    setCards(nextCards);
    setFrontIndex(nextFrontIndex);
    frontIndexRef.current = nextFrontIndex;
  }

  if (photos.length === 0) {
    return <div className="relative min-h-[360px] md:min-h-[520px]" />;
  }

  return (
    <div className="relative min-h-[360px] md:min-h-[520px]">
      <div className="absolute inset-x-6 top-6 h-20 rounded-full bg-[radial-gradient(circle,rgba(132,204,22,0.10),transparent_70%)] blur-2xl" />

      {cards.map((card) => {
        const slotStyle = getSlotStyle(card.slot);
        const hero = card.slot === 1;

        return (
          <Link
            key={card.key}
            href={`/g/${card.photo.slug}`}
            className={`group absolute block rounded-[8px] bg-white p-3 transition-[left,top,transform,opacity,filter,box-shadow] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 ${getCardClass(card.slot)}`}
            style={{
              ...slotStyle,
              animation:
                card.slot === 1
                  ? "polaroidFloat 6.2s ease-in-out infinite"
                  : card.slot === 0
                    ? "polaroidFloat 8.5s ease-in-out infinite"
                    : card.slot === 2
                      ? "polaroidFloat 8.9s ease-in-out 0.6s infinite"
                      : undefined
            }}
          >
            <div className="overflow-hidden rounded-[4px] bg-slate-100">
              <div
                className={`aspect-[4/5] bg-cover bg-center transition duration-700 group-hover:scale-[1.04] ${
                  hero ? "brightness-[1.02] saturate-[1.02]" : "brightness-[0.99] saturate-[0.94]"
                }`}
                style={{ backgroundImage: `url(${card.photo.imageUrl})` }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-1 pb-1 pt-3 text-slate-900">
              <div className="min-w-0">
                <p className={`truncate text-[10px] font-extrabold uppercase tracking-[0.22em] ${hero ? "text-slate-500" : "text-slate-400"}`}>
                  {card.photo.albumTitle}
                </p>
                <p className={`mt-1 truncate font-black tracking-tight ${hero ? "text-base md:text-[1.08rem]" : "text-sm md:text-base"}`}>
                  {card.photo.title}
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center justify-center rounded-full border transition group-hover:border-slate-300 group-hover:text-slate-900 ${
                  hero ? "h-10 w-10 border-slate-300 text-slate-700" : "h-9 w-9 border-slate-200 text-slate-500"
                }`}
              >
                <ArrowUpRight className="size-4" />
              </span>
            </div>
          </Link>
        );
      })}

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 md:bottom-5">
        {dots.map((photo, index) => (
          <button
            key={`${photo.id}-dot`}
            type="button"
            onClick={() => jumpToIndex((frontIndex + index) % photos.length)}
            className={`rounded-full transition-all ${index === 0 ? "h-2.5 w-8 bg-slate-900" : "h-2.5 w-2.5 bg-slate-300 hover:bg-slate-400"}`}
            aria-label={`Ver composicion ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
