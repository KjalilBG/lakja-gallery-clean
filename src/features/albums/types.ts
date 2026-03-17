export type AlbumPermissionSet = {
  allowSingleDownload: boolean;
  allowFavoritesDownload: boolean;
  allowFullDownload: boolean;
};

export type AlbumSummary = {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  coverUrl: string;
  coverPosition: "top" | "center" | "bottom";
  coverFocusX: number;
  coverFocusY: number;
  status: "draft" | "published" | "hidden";
  photoCount: number;
  favorites: number;
  downloads: number;
  views: number;
  eventDate: string;
  permissions: AlbumPermissionSet;
};

export type GalleryPhoto = {
  id: string;
  url: string;
  thumbUrl?: string;
  title: string;
  aspect: "portrait" | "landscape" | "square";
  isFavorite?: boolean;
  isCover?: boolean;
  sortOrder?: number;
};

export type AlbumDetail = {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  description: string | null;
  eventDate: string | null;
  status: "draft" | "published" | "hidden";
  visibility: "public_link" | "password";
  coverUrl: string;
  coverPosition: "top" | "center" | "bottom";
  coverFocusX: number;
  coverFocusY: number;
  photoCount: number;
  permissions: AlbumPermissionSet;
  photos: GalleryPhoto[];
  favoriteSelections?: FavoriteSelectionSummary[];
};

export type FavoriteSelectionSummary = {
  id: string;
  clientName: string;
  message: string | null;
  whatsapp: string | null;
  createdAt: string;
  photoCount: number;
  serials: number[];
  photos: {
    id: string;
    title: string;
    thumbUrl: string;
    serial: number;
  }[];
};
