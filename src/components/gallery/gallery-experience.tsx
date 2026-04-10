"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Facebook, Heart, Images, Instagram, LoaderCircle, MessageCircle, Search, Send, X } from "lucide-react";

import type { GalleryPhoto } from "@/features/albums/types";

import { CopyPublicLinkButton } from "@/components/admin/copy-public-link-button";
import { PhotoGrid } from "@/components/gallery/photo-grid";
import { Button } from "@/components/ui/button";

type DownloadIntent =
  | { type: "all" }
  | { type: "favorites" }
  | { type: "single"; photoUrl: string; photoTitle: string };

type GalleryExperienceProps = {
  photos: GalleryPhoto[];
  slug: string;
  albumTitle: string;
  storageKey?: string;
  allowSingleDownload?: boolean;
  allowFavoritesDownload?: boolean;
  allowFullDownload?: boolean;
  fullDownloadPasswordRequired?: boolean;
  favoritesEnabled: boolean;
  downloadsEnabled: boolean;
  downloadPopupEnabled: boolean;
  bibRecognitionEnabled?: boolean;
  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;
  downloadPopupTitle: string;
  downloadPopupBody: string;
};

export function GalleryExperience({
  photos,
  slug,
  albumTitle,
  storageKey = "lakja-gallery-favorites",
  allowSingleDownload = false,
  allowFavoritesDownload = false,
  allowFullDownload = false,
  fullDownloadPasswordRequired = false,
  favoritesEnabled,
  downloadsEnabled,
  downloadPopupEnabled,
  bibRecognitionEnabled = false,
  instagramUrl,
  facebookUrl,
  whatsappNumber,
  downloadPopupTitle,
  downloadPopupBody
}: GalleryExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [downloadIntent, setDownloadIntent] = useState<DownloadIntent | null>(null);
  const [isClosingDownloadPopup, setIsClosingDownloadPopup] = useState(false);
  const [showSendFavorites, setShowSendFavorites] = useState(false);
  const [bibQuery, setBibQuery] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderWhatsapp, setSenderWhatsapp] = useState("");
  const [senderMessage, setSenderMessage] = useState("");
  const [isSendingFavorites, setIsSendingFavorites] = useState(false);
  const [sendFavoritesError, setSendFavoritesError] = useState("");
  const [origin, setOrigin] = useState("");
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(storageKey);
      if (!rawValue) return;

      const parsedValue = JSON.parse(rawValue);
      if (Array.isArray(parsedValue)) {
        setFavoriteIds(parsedValue.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      // Ignore malformed local storage data.
    }
  }, [storageKey]);

  const senderStorageKey = `${storageKey}-sender`;

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(senderStorageKey);
      if (!rawValue) return;

      const parsedValue = JSON.parse(rawValue) as { name?: string; whatsapp?: string };
      if (typeof parsedValue.name === "string") {
        setSenderName(parsedValue.name);
      }
      if (typeof parsedValue.whatsapp === "string") {
        setSenderWhatsapp(parsedValue.whatsapp);
      }
    } catch {
      // Ignore malformed local storage data.
    }
  }, [senderStorageKey]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const photosWithFavorites = useMemo(
    () =>
      photos.map((photo) => ({
        ...photo,
        isFavorite: favoriteIds.includes(photo.id)
      })),
    [favoriteIds, photos]
  );

  const visiblePhotos = useMemo(
    () =>
      photosWithFavorites.filter((photo) => {
        const matchesFavorite = !showOnlyFavorites || photo.isFavorite;
        const normalizedQuery = bibQuery.trim();
        const matchesBib =
          normalizedQuery.length === 0 ||
          !bibRecognitionEnabled ||
          (photo.detectedBibs ?? []).some((bib) => bib.includes(normalizedQuery));

        return matchesFavorite && matchesBib;
      }),
    [photosWithFavorites, showOnlyFavorites, bibQuery, bibRecognitionEnabled]
  );

  const activePhoto = activeIndex === null ? null : visiblePhotos[activeIndex];
  const activePosition = activeIndex === null ? 0 : activeIndex + 1;
  const activePhotoUrl = activePhoto && origin ? `${origin}${pathname}?photo=${encodeURIComponent(activePhoto.id)}` : null;

  useEffect(() => {
    if (activeIndex === null) return;
    if (activeIndex <= visiblePhotos.length - 1) return;
    setActiveIndex(visiblePhotos.length > 0 ? visiblePhotos.length - 1 : null);
  }, [activeIndex, visiblePhotos.length]);

  useEffect(() => {
    const photoId = searchParams.get("photo");

    if (!photoId) {
      if (activeIndex !== null) {
        setActiveIndex(null);
      }
      return;
    }

    const nextIndex = visiblePhotos.findIndex((photo) => photo.id === photoId);
    if (nextIndex >= 0 && nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
    if (nextIndex < 0 && activeIndex !== null) {
      setActiveIndex(null);
    }
  }, [activeIndex, searchParams, visiblePhotos]);

  useEffect(() => {
    if (activeIndex === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => {
          if (current === null) return current;
          return current === 0 ? visiblePhotos.length - 1 : current - 1;
        });
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => {
          if (current === null) return current;
          return current === visiblePhotos.length - 1 ? 0 : current + 1;
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeIndex, visiblePhotos.length]);

  function goPrevious() {
    setActiveIndex((current) => {
      const nextIndex = current === null ? 0 : current === 0 ? visiblePhotos.length - 1 : current - 1;
      const nextPhoto = visiblePhotos[nextIndex];
      if (nextPhoto) {
        updatePhotoParam(nextPhoto.id);
      }
      return nextIndex;
    });
  }

  function goNext() {
    setActiveIndex((current) => {
      const nextIndex = current === null ? 0 : current === visiblePhotos.length - 1 ? 0 : current + 1;
      const nextPhoto = visiblePhotos[nextIndex];
      if (nextPhoto) {
        updatePhotoParam(nextPhoto.id);
      }
      return nextIndex;
    });
  }

  function handleViewerTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }

  function handleViewerTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    const touch = event.changedTouches[0];

    touchStartX.current = null;
    touchStartY.current = null;

    if (startX === null || startY === null) {
      return;
    }

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (Math.abs(deltaX) < 56 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) {
      return;
    }

    if (deltaX < 0) {
      goNext();
      return;
    }

    goPrevious();
  }

  function toggleFavorite(photoId: string) {
    setFavoriteIds((current) => {
      const nextValue = current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId];

      window.localStorage.setItem(storageKey, JSON.stringify(nextValue));
      return nextValue;
    });
  }

  function getSessionId() {
    const sessionStorageKey = `${storageKey}-session`;
    const existingValue = window.localStorage.getItem(sessionStorageKey);

    if (existingValue) {
      return existingValue;
    }

    const nextValue = window.crypto.randomUUID();
    window.localStorage.setItem(sessionStorageKey, nextValue);
    return nextValue;
  }

  useEffect(() => {
    const viewedKey = `${storageKey}-viewed`;

    if (window.localStorage.getItem(viewedKey)) {
      return;
    }

    const sessionId = getSessionId();

    void fetch(`/api/albums/${slug}/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sessionId })
    })
      .then((response) => {
        if (response.ok) {
          window.localStorage.setItem(viewedKey, "1");
        }
      })
      .catch(() => undefined);
  }, [slug, storageKey]);

  async function submitFavorites() {
    if (favoriteIds.length === 0 || isSendingFavorites) return;

    setIsSendingFavorites(true);
    setSendFavoritesError("");

    try {
      const response = await fetch(`/api/albums/${slug}/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId: getSessionId(),
          clientName: senderName.trim(),
          whatsapp: senderWhatsapp.trim(),
          message: senderMessage.trim(),
          photoIds: favoriteIds
        })
      });

      const data = (await response.json()) as { ok?: boolean; error?: string; serials?: number[]; albumTitle?: string };

      if (!response.ok || !data.ok || !data.serials) {
        throw new Error(data.error || "No se pudo enviar la seleccion.");
      }

      window.localStorage.setItem(
        senderStorageKey,
        JSON.stringify({
          name: senderName.trim(),
          whatsapp: senderWhatsapp.trim()
        })
      );

      const serialText = data.serials.map((serial) => `#${serial}`).join(", ");
      const messageLines = [
        `Hola, soy ${senderName.trim()}.`,
        `Te envio mis favoritas del album "${data.albumTitle ?? albumTitle}".`,
        `Fotos seleccionadas: ${serialText}.`
      ];

      if (senderMessage.trim()) {
        messageLines.push(`Mensaje: ${senderMessage.trim()}`);
      }

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messageLines.join("\n"))}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setShowSendFavorites(false);
      setSenderMessage("");
    } catch (error) {
      setSendFavoritesError(error instanceof Error ? error.message : "No se pudo enviar la seleccion.");
    } finally {
      setIsSendingFavorites(false);
    }
  }

  async function startDownload(intent: DownloadIntent) {
    if (!downloadsEnabled) {
      return;
    }

    const sessionId = getSessionId();

    if (intent.type === "all") {
      const downloadPassword = fullDownloadPasswordRequired
        ? window.prompt("Escribe la contrasena de descarga completa para bajar este ZIP.")?.trim() ?? ""
        : "";

      if (fullDownloadPasswordRequired && !downloadPassword) {
        return;
      }

      try {
        const response = await fetch(`/api/albums/${slug}/download`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "all",
            sessionId,
            downloadPassword
          })
        });

        const data = (await response.json()) as { signedUrl?: string; error?: string };

        if (!response.ok || !data.signedUrl) {
          throw new Error(data.error || "No se pudo preparar la descarga completa.");
        }

        window.location.href = data.signedUrl;
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "No se pudo preparar la descarga completa.");
      }
      return;
    }

    if (intent.type === "favorites") {
      const params = new URLSearchParams({
        type: "favorites",
        favorites: favoriteIds.join(","),
        sessionId
      });

      window.location.href = `/api/albums/${slug}/download?${params.toString()}`;
    }

    if (intent.type === "single") {
      const photo = photos.find((item) => item.id === resolvedActivePhoto?.id || item.url === intent.photoUrl);
      if (!photo || !allowSingleDownload) {
        return;
      }

      const params = new URLSearchParams({
        type: "single",
        photoId: photo.id,
        sessionId
      });

      window.location.href = `/api/albums/${slug}/download?${params.toString()}`;
    }

    if (downloadPopupEnabled) {
      setIsClosingDownloadPopup(false);
      setDownloadIntent(intent);
    }
  }

  function closeDownloadPopup() {
    setIsClosingDownloadPopup(true);
    window.setTimeout(() => {
      setDownloadIntent(null);
      setIsClosingDownloadPopup(false);
    }, 280);
  }

  const resolvedActivePhoto = activePhoto
    ? {
        ...activePhoto,
        isFavorite: favoriteIds.includes(activePhoto.id)
      }
    : null;
  const canShowFavoritesFlow = favoritesEnabled;
  const canShowFavoritesDownload = favoritesEnabled && downloadsEnabled && allowFavoritesDownload;
  const canShowFullDownload = downloadsEnabled && allowFullDownload;
  const canShowSingleDownload = downloadsEnabled && allowSingleDownload;

  function updatePhotoParam(photoId: string | null) {
    const params = new URLSearchParams(window.location.search);

    if (photoId) {
      params.set("photo", photoId);
    } else {
      params.delete("photo");
    }

    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  function openPhoto(index: number) {
    const photo = visiblePhotos[index];
    if (photo) {
      setActiveIndex(index);
      updatePhotoParam(photo.id);
    }
  }

  function closePhotoViewer() {
    updatePhotoParam(null);
  }

  return (
    <>
      <div className="sticky top-0 z-10 -mx-3 bg-gradient-to-b from-white via-white/96 to-white/0 px-3 pt-4 pb-5 dark:from-[#0b1120] dark:via-[#0b1120]/96 dark:to-[#0b1120]/0 md:-mx-5 md:px-5 md:pt-6 md:pb-6">
        <section className="rounded-[20px] border border-slate-200 bg-white px-3 py-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] md:rounded-[28px] md:px-4 md:py-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="-mx-1 flex snap-x snap-mandatory flex-nowrap items-center gap-2 overflow-x-auto px-1 pb-1 xl:mx-0 xl:flex-wrap xl:overflow-visible xl:px-0 xl:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="shrink-0 snap-start rounded-full border border-slate-200 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 md:px-4 md:py-2.5 md:text-sm md:tracking-[0.16em]">
              <span className="inline-flex items-center gap-2">
                <Images className="size-3.5" />
                <span>{visiblePhotos.length}</span>
              </span>
            </div>
            {canShowFavoritesFlow ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowOnlyFavorites(false)}
                  className={`shrink-0 snap-start rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition md:px-4 md:py-2.5 md:text-sm md:tracking-[0.16em] ${
                    !showOnlyFavorites ? "border-lime-300 bg-lime-50 text-lime-700" : "border-slate-200 text-slate-500"
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setShowOnlyFavorites((current) => !current)}
                  className={`shrink-0 snap-start rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition md:px-4 md:py-2.5 md:text-sm md:tracking-[0.16em] ${
                    showOnlyFavorites ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700" : "border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Heart className={`size-3.5 ${showOnlyFavorites ? "fill-current" : ""}`} />
                    <span>Favoritas {favoriteIds.length > 0 ? `(${favoriteIds.length})` : ""}</span>
                  </span>
                </button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowSendFavorites(true)}
                  disabled={favoriteIds.length === 0}
                  className="shrink-0 min-h-10 px-4 py-2 text-[10px] tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-50 md:min-h-11 md:px-4 md:py-2.5 md:text-[11px] md:tracking-[0.12em]"
                >
                  <Send className="mr-2 size-4" />
                  Enviar favoritas
                </Button>
              </>
            ) : null}
            </div>

            <div className="flex flex-col gap-2 xl:min-w-[600px] xl:items-end">
              <div className="flex flex-wrap items-center justify-end gap-2">
                {bibRecognitionEnabled ? (
                  <label className="flex min-w-[220px] items-center gap-3 rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <Search className="size-4 text-slate-400" />
                  <input
                    value={bibQuery}
                    onChange={(event) => setBibQuery(event.target.value.replace(/\D+/g, ""))}
                    placeholder="Buscar por numero de bib"
                    className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  </label>
                ) : null}
                {canShowFavoritesDownload ? (
                  <Button
                    variant="pink"
                    onClick={() => void startDownload({ type: "favorites" })}
                    disabled={favoriteIds.length === 0}
                    className="min-h-10 shrink-0 justify-center px-4 py-2.5 text-[10px] tracking-[0.06em] disabled:cursor-not-allowed disabled:opacity-50 md:min-h-11 md:px-4 md:text-[11px] md:tracking-[0.12em]"
                  >
                    <Heart className="mr-2 size-4" />
                    Descargar favoritas
                  </Button>
                ) : null}
                {canShowFullDownload ? (
                  <Button
                    onClick={() => void startDownload({ type: "all" })}
                    className="min-h-10 shrink-0 justify-center px-4 py-2.5 text-[10px] tracking-[0.06em] md:min-h-11 md:px-4 md:text-[11px] md:tracking-[0.12em]"
                  >
                    <Download className="mr-2 size-4" />
                    Descargar todo
                  </Button>
                ) : null}
                <CopyPublicLinkButton
                  slug={slug}
                  className="min-h-10 shrink-0 px-4 py-2.5 text-[10px] tracking-[0.08em] md:min-h-11 md:text-[11px] md:tracking-[0.12em]"
                  defaultLabel="Enlace"
                  copiedLabel="Copiado"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {visiblePhotos.length > 0 ? (
        <PhotoGrid photos={visiblePhotos} onPhotoClick={openPhoto} onFavoriteToggle={toggleFavorite} />
      ) : (
        <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fuchsia-50 text-fuchsia-600">
            <Images className="size-6" />
          </div>
          <p className="mt-4 text-xl font-black text-slate-900">Todavia no tienes favoritas guardadas</p>
          <p className="mt-3 text-slate-500">Marca fotos desde el visor para que aparezcan aqui y puedas descargarlas juntas.</p>
        </div>
      )}

      {resolvedActivePhoto ? (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex min-h-screen items-center justify-center px-3 py-3 sm:px-4 sm:py-6 lg:px-10">
            <button
              type="button"
              onClick={closePhotoViewer}
              className="absolute right-3 top-3 z-10 rounded-full border border-slate-200 bg-white p-2.5 text-slate-400 shadow-[0_10px_25px_rgba(15,23,42,0.10)] transition hover:text-slate-700 sm:right-5 sm:top-5 sm:p-3"
              aria-label="Cerrar visor"
            >
              <X className="size-5 sm:size-6" />
            </button>

            <button
              type="button"
              onClick={goPrevious}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2.5 text-slate-400 shadow-[0_10px_25px_rgba(15,23,42,0.10)] transition hover:text-slate-700 sm:left-4 sm:p-4 lg:left-7"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="size-5 sm:size-7" />
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2.5 text-slate-400 shadow-[0_10px_25px_rgba(15,23,42,0.10)] transition hover:text-slate-700 sm:right-4 sm:p-4 lg:right-7"
              aria-label="Foto siguiente"
            >
              <ChevronRight className="size-5 sm:size-7" />
            </button>

            <div className="relative w-full max-w-[1280px]">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center xl:gap-6">
                <div
                  className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)] sm:rounded-[34px]"
                  onTouchStart={handleViewerTouchStart}
                  onTouchEnd={handleViewerTouchEnd}
                >
                  <img src={resolvedActivePhoto.url} alt={resolvedActivePhoto.title} className="max-h-[72vh] w-full object-contain bg-[#fcfcfb] sm:max-h-[82vh]" />
                  <div className="absolute left-4 top-4 text-xs font-extrabold tracking-[0.18em] text-white drop-shadow-[0_6px_18px_rgba(15,23,42,0.62)] sm:left-5 sm:top-5 sm:text-sm">
                    {resolvedActivePhoto.isCover ? "IMPORTADA" : `${activePosition}`}
                  </div>
                </div>

                <div className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_14px_30px_rgba(15,23,42,0.10)] lg:mx-0 lg:max-w-none lg:flex-col lg:items-stretch lg:gap-4 lg:rounded-[28px] lg:p-5">
                  <div className="hidden lg:block space-y-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                      {resolvedActivePhoto.isCover ? "Portada" : `Foto ${activePosition} de ${visiblePhotos.length}`}
                    </p>
                    <p className="text-2xl font-black tracking-tight text-slate-950">{albumTitle}</p>
                  </div>

                    {canShowFavoritesFlow ? (
                    <button
                      type="button"
                      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] transition sm:min-w-[190px] sm:flex-none sm:px-5 lg:min-w-0 lg:w-full lg:justify-center ${
                        resolvedActivePhoto.isFavorite ? "bg-fuchsia-50 text-fuchsia-600" : "text-slate-500 hover:bg-slate-100"
                    }`}
                    onClick={() => toggleFavorite(resolvedActivePhoto.id)}
                  >
                      <Heart className={`size-4 ${resolvedActivePhoto.isFavorite ? "fill-current" : ""}`} />
                      Favorita
                    </button>
                    ) : null}
                    {canShowSingleDownload ? (
                      <button
                        type="button"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 transition hover:bg-slate-100 sm:min-w-[190px] sm:flex-none sm:px-5 lg:min-w-0 lg:w-full lg:justify-center"
                          onClick={() =>
                          void startDownload({
                            type: "single",
                            photoUrl: resolvedActivePhoto.url,
                            photoTitle: resolvedActivePhoto.title
                          })
                        }
                      >
                        <Download className="size-4" />
                        Descargar
                      </button>
                    ) : null}
                  {activePhotoUrl ? (
                    <CopyPublicLinkButton
                      slug={slug}
                      url={activePhotoUrl}
                      defaultLabel="Copiar foto"
                      copiedLabel="Foto copiada"
                      className="inline-flex flex-1 items-center justify-center gap-2 px-3 py-3 text-[11px] tracking-[0.12em] sm:min-w-[190px] sm:flex-none sm:px-5 lg:min-w-0 lg:w-full lg:justify-center"
                    />
                  ) : null}
                  <button
                    type="button"
                    className="hidden rounded-full border border-slate-200 px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 transition hover:border-slate-300 hover:text-slate-900 lg:inline-flex lg:items-center lg:justify-center"
                    onClick={closePhotoViewer}
                  >
                    Cerrar visor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {downloadIntent ? (
        <div
          className={`fixed inset-0 z-[60] transition-all duration-300 ${
            isClosingDownloadPopup ? "bg-slate-950/0" : "bg-slate-950/68"
          }`}
        >
          <div className="flex min-h-screen items-center justify-center px-4">
            <div
              className={`w-full max-w-md rounded-[28px] border border-white/20 bg-white p-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.25)] transition-all duration-300 ease-out sm:rounded-[34px] sm:p-8 ${
                isClosingDownloadPopup ? "translate-y-3 scale-[0.97] opacity-0 blur-[4px]" : "translate-y-0 scale-100 opacity-100 blur-0"
              }`}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f59e0b,#ec4899)] text-white shadow-[0_14px_35px_rgba(236,72,153,0.28)] sm:h-20 sm:w-20">
                <Instagram className="size-7 sm:size-9" />
              </div>
              <h3 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:mt-6 sm:text-4xl">
                {downloadPopupTitle}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                {downloadPopupBody}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="block">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(90deg,#fb923c,#db2777)] px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_rgba(219,39,119,0.22)] transition hover:opacity-95"
                  >
                    <Instagram className="mr-2 size-4" />
                    Instagram
                  </button>
                </a>
                <a href={facebookUrl} target="_blank" rel="noreferrer" className="block">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(90deg,#60a5fa,#2563eb)] px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:opacity-95"
                  >
                    <Facebook className="mr-2 size-4" />
                    Facebook
                  </button>
                </a>
              </div>
              <div className="mt-6">
                <Button variant="secondary" onClick={closeDownloadPopup} className="w-full">
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {favoritesEnabled && showSendFavorites ? (
        <div className="fixed inset-0 z-[65] bg-slate-950/60">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-lg rounded-[30px] border border-white/20 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.25)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Favoritas</p>
                  <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Enviar seleccion</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Guardaremos tu seleccion y despues abriremos WhatsApp con el resumen de fotos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSendFavorites(false)}
                  className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:text-slate-700"
                  aria-label="Cerrar envio de favoritas"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-500">Tu nombre</span>
                  <input
                    value={senderName}
                    onChange={(event) => setSenderName(event.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
                    placeholder="Escribe tu nombre"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-500">WhatsApp (opcional)</span>
                  <input
                    value={senderWhatsapp}
                    onChange={(event) => setSenderWhatsapp(event.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
                    placeholder={whatsappNumber.replace(/^52/, "")}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-500">Mensaje (opcional)</span>
                  <textarea
                    value={senderMessage}
                    onChange={(event) => setSenderMessage(event.target.value)}
                    className="min-h-28 w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
                    placeholder="Quisiera estas favoritas para mi seleccion final."
                  />
                </label>
              </div>

              <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <p className="font-bold text-slate-900">{favoriteIds.length} foto(s) favorita(s)</p>
                <p className="mt-2">Se enviaran los numeros de serie que ya marcaste en esta galeria.</p>
              </div>

              {sendFavoritesError ? (
                <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {sendFavoritesError}
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button variant="secondary" onClick={() => setShowSendFavorites(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => void submitFavorites()} disabled={isSendingFavorites || senderName.trim().length < 2}>
                  {isSendingFavorites ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <MessageCircle className="mr-2 size-4" />}
                  Enviar por WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
