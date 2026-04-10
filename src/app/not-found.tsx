import Link from "next/link";
import { getPublishedShowcasePhotos } from "@/lib/albums";

const VARIANTS = [
  "Ups, esta ruta se fue a sesion de fotos sin avisar.",
  "404: la pagina se escondio detras de la camara.",
  "Esa URL no esta en el carrete.",
  "No encontramos esta toma, pero seguimos en sesion.",
  "Parece que esta ruta salio movida.",
  "Esta pagina no revelo bien.",
  "Nada por aqui... excepto estilo LaKja.",
  "404 creativo: cuadro fuera de enfoque.",
  "Esa ruta ya no vive en este album.",
  "No existe esta pagina, pero si muchas galerias lindas."
];

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1453738773917-9c3eff1db985?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80"
];

export default async function NotFound() {
  const message = VARIANTS[Math.floor(Math.random() * VARIANTS.length)] ?? VARIANTS[0];
  const showcasePhotos = await getPublishedShowcasePhotos(16);
  const galleryImages = showcasePhotos.map((photo) => photo.imageUrl).filter(Boolean);
  const sourceImages = galleryImages.length > 0 ? galleryImages : FALLBACK_IMAGES;
  const image = sourceImages[Math.floor(Math.random() * sourceImages.length)] ?? FALLBACK_IMAGES[0];

  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-2xl items-center justify-center px-4 py-12">
      <div className="w-full rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="mx-auto mb-6 overflow-hidden rounded-[20px] border border-slate-200">
          <img src={image} alt="Preview aleatorio LaKja" className="h-52 w-full object-cover md:h-64" />
        </div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.26em] text-slate-400">404 Not Found</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Ups</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{message}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            Ir al inicio
          </Link>
          <Link
            href="/appfotos"
            className="inline-flex items-center justify-center rounded-full bg-lime-500 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-lime-600"
          >
            Ver galerias
          </Link>
        </div>
      </div>
    </div>
  );
}
