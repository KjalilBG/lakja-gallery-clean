import type { AlbumSummary, GalleryPhoto } from "@/features/albums/types";

export const dashboardAlbums: AlbumSummary[] = [
  {
    id: "album_1",
    slug: "editorial-demo",
    title: "Civil Alejandra & Marco",
    clientName: "Alejandra + Marco",
    coverUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    coverPosition: "center",
    coverFocusX: 50,
    coverFocusY: 50,
    status: "published",
    photoCount: 248,
    favorites: 37,
    downloads: 18,
    views: 124,
    eventDate: "2026-02-21",
    permissions: {
      allowSingleDownload: true,
      allowFavoritesDownload: true,
      allowFullDownload: false
    }
  },
  {
    id: "album_2",
    slug: "familia-orozco",
    title: "Sesion Familia Orozco",
    clientName: "Familia Orozco",
    coverUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    coverPosition: "center",
    coverFocusX: 50,
    coverFocusY: 50,
    status: "draft",
    photoCount: 112,
    favorites: 0,
    downloads: 0,
    views: 0,
    eventDate: "2026-03-08",
    permissions: {
      allowSingleDownload: true,
      allowFavoritesDownload: true,
      allowFullDownload: true
    }
  }
];

export const galleryPhotos: GalleryPhoto[] = [
  {
    id: "photo_1",
    url: "https://images.unsplash.com/photo-1513279922550-250c2129b13a?auto=format&fit=crop&w=1400&q=80",
    title: "Momento editorial",
    aspect: "portrait",
    isFavorite: true
  },
  {
    id: "photo_2",
    url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1400&q=80",
    title: "Mirada en ceremonia",
    aspect: "landscape"
  },
  {
    id: "photo_3",
    url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=80",
    title: "Retrato natural",
    aspect: "square"
  },
  {
    id: "photo_4",
    url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1400&q=80",
    title: "Entrada principal",
    aspect: "landscape"
  },
  {
    id: "photo_5",
    url: "https://images.unsplash.com/photo-1516589091380-5d8e87df6999?auto=format&fit=crop&w=1400&q=80",
    title: "Detalle de ramo",
    aspect: "portrait"
  },
  {
    id: "photo_6",
    url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=80",
    title: "Celebracion final",
    aspect: "landscape"
  }
];
