export type AlbumPermissionSet = {
  allowSingleDownload: boolean;
  allowFavoritesDownload: boolean;
  allowFullDownload: boolean;
  hasFullDownloadPassword: boolean;
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
  processingStatus?: "processing" | "ready" | "failed";
  detectedBibs?: string[];
  bibOcrText?: string | null;
  bibOcrProcessedAt?: string | null;
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
  views: number;
  downloads: number;
  favoriteSelectionsCount: number;
  favoritePhotosCount: number;
  bibRecognitionEnabled: boolean;
  bibRecognitionProcessedAt: string | null;
  bibRecognizedPhotosCount: number;
  processingPhotosCount: number;
  failedPhotosCount: number;
  retryablePhotosCount: number;
  bibJob?: {
    id: string;
    status: "pending" | "running" | "completed" | "failed";
    total: number;
    processed: number;
    recognized: number;
    failed: number;
    skipped: number;
    remaining: number;
    batchSize: number;
    mode: "all" | "pending";
    updatedAt: string;
  } | null;
  previewJob?: {
    id: string;
    status: "pending" | "running" | "completed" | "failed";
    total: number;
    processed: number;
    completed: number;
    failed: number;
    remaining: number;
    batchSize: number;
    emailStatus: "pending" | "sent" | "failed";
    emailSent: boolean;
    emailAttemptedAt: string | null;
    emailDeliveredAt: string | null;
    emailError: string | null;
    updatedAt: string;
  } | null;
  permissions: AlbumPermissionSet;
  photos: GalleryPhoto[];
  favoriteSelections?: FavoriteSelectionSummary[];
};

export type FavoriteSelectionSummary = {
  id: string;
  clientName: string;
  message: string | null;
  whatsapp: string | null;
  status: "pending" | "editing" | "delivered";
  createdAt: string;
  photoCount: number;
  serials: number[];
  photos: {
    id: string;
    title: string;
    platformName: string;
    originalName: string;
    thumbUrl: string;
    serial: number;
  }[];
};
