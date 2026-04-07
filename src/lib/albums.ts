import { AlbumStatus, AlbumVisibility, CoverPosition, FavoriteSelectionStatus, JobStatus, JobType } from "@prisma/client";
import path from "node:path";
import { mkdir, rm, unlink, writeFile } from "node:fs/promises";

import exifr from "exifr";

import type { AlbumDetail, AlbumSummary, GalleryPhoto } from "@/features/albums/types";
import { detectBibs } from "@/lib/bib-ocr";
import { buildImageDerivatives } from "@/lib/image";
import { prisma } from "@/lib/prisma";
import { isR2Configured, parseStorageKey, readFromR2, removeFromR2, toMediaRoute, uploadToR2 } from "@/lib/r2";

function createSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function mapStatus(status: AlbumStatus): AlbumSummary["status"] {
  return status === AlbumStatus.PUBLISHED
    ? "published"
    : status === AlbumStatus.HIDDEN || status === AlbumStatus.ARCHIVED
      ? "hidden"
      : "draft";
}

function mapVisibility(visibility: AlbumVisibility): AlbumDetail["visibility"] {
  return visibility === AlbumVisibility.PASSWORD ? "password" : "public_link";
}

function mapCoverPosition(coverPosition: CoverPosition): AlbumDetail["coverPosition"] {
  return coverPosition === CoverPosition.TOP ? "top" : coverPosition === CoverPosition.BOTTOM ? "bottom" : "center";
}

function mapFavoriteSelectionStatus(status: FavoriteSelectionStatus): "pending" | "editing" | "delivered" {
  return status === FavoriteSelectionStatus.EDITING
    ? "editing"
    : status === FavoriteSelectionStatus.DELIVERED
      ? "delivered"
      : "pending";
}

function defaultCoverUrl() {
  return "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80";
}

function buildPhotoUrl(photo: { previewKey: string | null; originalKey: string }) {
  return toMediaRoute(photo.previewKey ?? photo.originalKey);
}

function detectAspect(fileName: string): GalleryPhoto["aspect"] {
  const lowerName = fileName.toLowerCase();

  if (lowerName.includes("vertical") || lowerName.includes("portrait")) {
    return "portrait";
  }

  if (lowerName.includes("square")) {
    return "square";
  }

  return "landscape";
}

function buildPublicPhotoTitle(albumTitle: string, sortOrder: number) {
  return `${sortOrder + 1} - ${albumTitle}`;
}

type BibJobPayload = {
  mode: "all" | "pending";
  batchSize: number;
  remainingPhotoIds: string[];
  total: number;
  processed: number;
  recognized: number;
  failed: number;
  skipped: number;
};

function isBibJobPayload(value: unknown): value is BibJobPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    (payload.mode === "all" || payload.mode === "pending") &&
    typeof payload.batchSize === "number" &&
    Array.isArray(payload.remainingPhotoIds) &&
    typeof payload.total === "number" &&
    typeof payload.processed === "number" &&
    typeof payload.recognized === "number" &&
    typeof payload.failed === "number" &&
    typeof payload.skipped === "number"
  );
}

function normalizeBibJobPayload(value: unknown): BibJobPayload | null {
  return isBibJobPayload(value) ? value : null;
}

async function ensureUniqueSlug(base: string, excludeAlbumId?: string) {
  const normalized = createSlug(base) || `album-${Date.now()}`;
  let candidate = normalized;
  let suffix = 1;

  while (true) {
    const existingAlbum = await prisma.album.findUnique({ where: { slug: candidate }, select: { id: true } });

    if (!existingAlbum || existingAlbum.id === excludeAlbumId) {
      break;
    }

    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function normalizeAlbumPhotoOrder(albumId: string) {
  const photos = await prisma.photo.findMany({
    where: { albumId },
    orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      sortOrder: true
    }
  });

  await prisma.$transaction(
    photos.map((photo, index) =>
      prisma.photo.update({
        where: { id: photo.id },
        data: { sortOrder: index }
      })
    )
  );
}

async function getNextAlbumPhotoSortOrder(albumId: string) {
  const result = await prisma.photo.aggregate({
    where: { albumId },
    _max: {
      sortOrder: true
    }
  });

  return (result._max.sortOrder ?? -1) + 1;
}

export async function reserveAlbumPhotoSortOrders(albumId: string, totalFiles: number) {
  if (!Number.isInteger(totalFiles) || totalFiles <= 0) {
    throw new Error("La cantidad de fotos a reservar no es valida.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${albumId}))`;

    const album = await tx.album.findUnique({
      where: { id: albumId },
      select: { id: true }
    });

    if (!album) {
      throw new Error("El album no existe.");
    }

    const result = await tx.photo.aggregate({
      where: { albumId },
      _max: {
        sortOrder: true
      }
    });

    const startSortOrder = (result._max.sortOrder ?? -1) + 1;
    return Array.from({ length: totalFiles }, (_, index) => startSortOrder + index);
  });
}

async function extractCapturedAt(buffer: Buffer, fallbackTimestamp: number) {
  try {
    const metadata = await exifr.parse(buffer, ["DateTimeOriginal", "CreateDate", "ModifyDate"]);
    const candidate = metadata?.DateTimeOriginal ?? metadata?.CreateDate ?? metadata?.ModifyDate;

    if (candidate instanceof Date && !Number.isNaN(candidate.getTime())) {
      return candidate;
    }
  } catch {
    // Ignore metadata parse failures and fallback to file timestamp.
  }

  return fallbackTimestamp > 0 ? new Date(fallbackTimestamp) : null;
}

export async function createAlbum(input: {
  title: string;
  clientName: string;
  description?: string;
  eventDate?: string;
  status: AlbumStatus;
  visibility: AlbumVisibility;
  coverPosition?: CoverPosition;
  coverFocusX?: number;
  coverFocusY?: number;
  passwordHash?: string | null;
  allowSingleDownload: boolean;
  allowFavoritesDownload: boolean;
  allowFullDownload: boolean;
  bibRecognitionEnabled?: boolean;
}) {
  const slug = await ensureUniqueSlug(input.title);

  return prisma.album.create({
    data: {
      slug,
      title: input.title,
      clientName: input.clientName,
      description: input.description || null,
      eventDate: input.eventDate ? new Date(input.eventDate) : null,
      status: input.status,
      visibility: input.visibility,
      coverPosition: input.coverPosition ?? CoverPosition.CENTER,
      coverFocusX: input.coverFocusX ?? 50,
      coverFocusY: input.coverFocusY ?? 50,
        passwordHash: input.visibility === AlbumVisibility.PASSWORD ? input.passwordHash ?? null : null,
        allowSingleDownload: input.allowSingleDownload,
        allowFavoritesDownload: input.allowFavoritesDownload,
        allowFullDownload: input.allowFullDownload,
        bibRecognitionEnabled: input.bibRecognitionEnabled ?? false
      }
    });
}

export async function updateAlbum(
  albumId: string,
  input: {
    title: string;
    clientName: string;
    description?: string;
    eventDate?: string;
    status: AlbumStatus;
    visibility: AlbumVisibility;
    coverPosition?: CoverPosition;
    coverFocusX?: number;
    coverFocusY?: number;
    passwordHash?: string | null;
    allowSingleDownload: boolean;
    allowFavoritesDownload: boolean;
    allowFullDownload: boolean;
    bibRecognitionEnabled?: boolean;
  }
) {
  const slug = await ensureUniqueSlug(input.title, albumId);

  const updateData: {
    slug: string;
    title: string;
    clientName: string;
    description: string | null;
    eventDate: Date | null;
    status: AlbumStatus;
    visibility: AlbumVisibility;
    coverPosition: CoverPosition;
    coverFocusX: number;
    coverFocusY: number;
      passwordHash?: string | null;
      allowSingleDownload: boolean;
      allowFavoritesDownload: boolean;
      allowFullDownload: boolean;
      bibRecognitionEnabled: boolean;
  } = {
    slug,
    title: input.title,
    clientName: input.clientName,
    description: input.description || null,
    eventDate: input.eventDate ? new Date(input.eventDate) : null,
    status: input.status,
    visibility: input.visibility,
    coverPosition: input.coverPosition ?? CoverPosition.CENTER,
    coverFocusX: input.coverFocusX ?? 50,
      coverFocusY: input.coverFocusY ?? 50,
      allowSingleDownload: input.allowSingleDownload,
      allowFavoritesDownload: input.allowFavoritesDownload,
      allowFullDownload: input.allowFullDownload,
      bibRecognitionEnabled: input.bibRecognitionEnabled ?? false
    };

  if (input.visibility === AlbumVisibility.PUBLIC_LINK) {
    updateData.passwordHash = null;
  } else if (input.passwordHash !== undefined) {
    updateData.passwordHash = input.passwordHash;
  }

  return prisma.album.update({
    where: { id: albumId },
    data: updateData
  });
}

export async function getAdminAlbums(): Promise<AlbumSummary[]> {
  const albums = await prisma.album.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    include: {
      coverPhoto: true,
      _count: {
        select: {
          photos: true,
          favoriteSelections: true,
          downloads: true,
          views: true
        }
      }
    }
  });

  return albums.map((album) => ({
    id: album.id,
    slug: album.slug,
    title: album.title,
    clientName: album.clientName,
    coverUrl: album.coverPhoto ? buildPhotoUrl(album.coverPhoto) : defaultCoverUrl(),
    coverPosition: mapCoverPosition(album.coverPosition),
    coverFocusX: album.coverFocusX,
    coverFocusY: album.coverFocusY,
    status: mapStatus(album.status),
    photoCount: album._count.photos,
    favorites: album._count.favoriteSelections,
    downloads: album._count.downloads,
    views: album._count.views,
    eventDate: album.eventDate ? album.eventDate.toISOString() : album.createdAt.toISOString(),
    permissions: {
      allowSingleDownload: album.allowSingleDownload,
      allowFavoritesDownload: album.allowFavoritesDownload,
      allowFullDownload: album.allowFullDownload
    }
  }));
}

export async function getPublishedAlbums(limit = 6): Promise<AlbumSummary[]> {
  const albums = await prisma.album.findMany({
    where: { status: AlbumStatus.PUBLISHED },
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      coverPhoto: true,
      _count: {
        select: {
          photos: true,
          favoriteSelections: true,
          downloads: true,
          views: true
        }
      }
    }
  });

  return albums.map((album) => ({
    id: album.id,
    slug: album.slug,
    title: album.title,
    clientName: album.clientName,
    coverUrl: album.coverPhoto ? buildPhotoUrl(album.coverPhoto) : defaultCoverUrl(),
    coverPosition: mapCoverPosition(album.coverPosition),
    coverFocusX: album.coverFocusX,
    coverFocusY: album.coverFocusY,
    status: mapStatus(album.status),
    photoCount: album._count.photos,
    favorites: album._count.favoriteSelections,
    downloads: album._count.downloads,
    views: album._count.views,
    eventDate: album.eventDate ? album.eventDate.toISOString() : album.createdAt.toISOString(),
    permissions: {
      allowSingleDownload: album.allowSingleDownload,
      allowFavoritesDownload: album.allowFavoritesDownload,
      allowFullDownload: album.allowFullDownload
    }
  }));
}

export async function getHomepageAlbums(limit = 6, featuredAlbumIds: string[] = []): Promise<AlbumSummary[]> {
  const featuredIds = Array.from(new Set(featuredAlbumIds.filter(Boolean)));

  if (featuredIds.length === 0) {
    return getPublishedAlbums(limit);
  }

  const albums = await prisma.album.findMany({
    where: { status: AlbumStatus.PUBLISHED },
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    include: {
      coverPhoto: true,
      _count: {
        select: {
          photos: true,
          favoriteSelections: true,
          downloads: true,
          views: true
        }
      }
    }
  });

  const mappedAlbums = albums.map((album) => ({
    id: album.id,
    slug: album.slug,
    title: album.title,
    clientName: album.clientName,
    coverUrl: album.coverPhoto ? buildPhotoUrl(album.coverPhoto) : defaultCoverUrl(),
    coverPosition: mapCoverPosition(album.coverPosition),
    coverFocusX: album.coverFocusX,
    coverFocusY: album.coverFocusY,
    status: mapStatus(album.status),
    photoCount: album._count.photos,
    favorites: album._count.favoriteSelections,
    downloads: album._count.downloads,
    views: album._count.views,
    eventDate: album.eventDate ? album.eventDate.toISOString() : album.createdAt.toISOString(),
    permissions: {
      allowSingleDownload: album.allowSingleDownload,
      allowFavoritesDownload: album.allowFavoritesDownload,
      allowFullDownload: album.allowFullDownload
    }
  }));

  const featuredAlbums = featuredIds
    .map((featuredId) => mappedAlbums.find((album) => album.id === featuredId))
    .filter((album): album is AlbumSummary => Boolean(album));

  const remainingAlbums = mappedAlbums.filter((album) => !featuredIds.includes(album.id));

  return [...featuredAlbums, ...remainingAlbums].slice(0, limit);
}

export async function getPublishedShowcasePhotos(limit = 10) {
  const albums = await prisma.album.findMany({
    where: { status: AlbumStatus.PUBLISHED },
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    take: 8,
    select: {
      id: true,
      slug: true,
      title: true,
      photos: {
        where: { status: "READY" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        take: 4,
        select: {
          id: true,
          originalKey: true,
          previewKey: true,
          thumbKey: true,
          filename: true,
          sortOrder: true
        }
      }
    }
  });

  const items = albums.flatMap((album) =>
    album.photos.map((photo) => ({
      id: photo.id,
      slug: album.slug,
      albumTitle: album.title,
      title: buildPublicPhotoTitle(album.title, photo.sortOrder),
      imageUrl: photo.previewKey ? toMediaRoute(photo.previewKey) : buildPhotoUrl(photo),
      thumbUrl: photo.thumbKey ? toMediaRoute(photo.thumbKey) : buildPhotoUrl(photo)
    }))
  );

  const shuffled = items
    .map((item) => ({ item, weight: Math.random() }))
    .sort((left, right) => left.weight - right.weight)
    .map(({ item }) => item);

  return shuffled.slice(0, limit);
}

export async function getAdminStats() {
  const [
    totalAlbums,
    publishedAlbums,
    totalFavorites,
    totalViews,
    totalDownloads,
    pendingSelections,
    editingSelections,
    deliveredSelections
  ] = await prisma.$transaction([
    prisma.album.count(),
    prisma.album.count({ where: { status: AlbumStatus.PUBLISHED } }),
    prisma.favoriteSelectionItem.count(),
    prisma.albumView.count(),
    prisma.download.count(),
    prisma.favoriteSelection.count({ where: { status: FavoriteSelectionStatus.PENDING } }),
    prisma.favoriteSelection.count({ where: { status: FavoriteSelectionStatus.EDITING } }),
    prisma.favoriteSelection.count({ where: { status: FavoriteSelectionStatus.DELIVERED } })
  ]);

  return {
    totalAlbums,
    publishedAlbums,
    draftAlbums: Math.max(totalAlbums - publishedAlbums, 0),
    totalFavorites,
    totalViews,
    totalDownloads,
    pendingSelections,
    editingSelections,
    deliveredSelections
  };
}

export async function getAdminNavStats() {
  const [totalAlbums, publishedAlbums, pendingSelections] = await prisma.$transaction([
    prisma.album.count(),
    prisma.album.count({ where: { status: AlbumStatus.PUBLISHED } }),
    prisma.favoriteSelection.count({ where: { status: FavoriteSelectionStatus.PENDING } })
  ]);

  return {
    draftAlbums: Math.max(totalAlbums - publishedAlbums, 0),
    pendingSelections
  };
}

export async function getAdminDashboardData() {
  const [stats, albums, recentSelections] = await Promise.all([
    getAdminStats(),
    getAdminAlbums(),
    prisma.favoriteSelection.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        clientName: true,
        createdAt: true,
        status: true,
        album: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      }
    })
  ]);

  const topViewedAlbums = [...albums].sort((left, right) => right.views - left.views).slice(0, 3);
  const topFavoriteAlbums = [...albums].sort((left, right) => right.favorites - left.favorites).slice(0, 3);
  const recentAlbums = albums.slice(0, 5);

  return {
    stats,
    recentAlbums,
    topViewedAlbums,
    topFavoriteAlbums,
    recentSelections: recentSelections.map((selection) => ({
      id: selection.id,
      clientName: selection.clientName,
      albumId: selection.album.id,
      albumTitle: selection.album.title,
      albumSlug: selection.album.slug,
      createdAt: selection.createdAt.toISOString(),
      photoCount: selection._count.items,
      status: mapFavoriteSelectionStatus(selection.status)
    }))
  };
}

export async function getAdminAlbumById(id: string): Promise<AlbumDetail | null> {
  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      coverPhoto: true,
      photos: {
        orderBy: { sortOrder: "asc" }
      },
      _count: {
        select: {
          photos: true,
          views: true,
          downloads: true,
          favoriteSelections: true
        }
      },
      favoriteSelections: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          _count: {
            select: {
              items: true
            }
          },
          items: {
            orderBy: { sortOrder: "asc" },
              include: {
                  photo: {
                    select: {
                      id: true,
                      sortOrder: true,
                      filename: true,
                      previewKey: true,
                      thumbKey: true,
                      originalKey: true
                    }
                  }
                }
            }
          }
      }
      ,
      jobs: {
        where: { type: JobType.OCR_BIB },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          payload: true,
          updatedAt: true
        }
      }
    }
  });

  if (!album) {
    return null;
  }

  const latestBibJob = album.jobs[0];
  const bibJobPayload = latestBibJob ? normalizeBibJobPayload(latestBibJob.payload) : null;

  return {
    id: album.id,
    slug: album.slug,
    title: album.title,
    clientName: album.clientName,
    description: album.description,
    eventDate: album.eventDate ? album.eventDate.toISOString() : null,
    status: mapStatus(album.status),
    visibility: mapVisibility(album.visibility),
    coverUrl: album.coverPhoto ? buildPhotoUrl(album.coverPhoto) : defaultCoverUrl(),
    coverPosition: mapCoverPosition(album.coverPosition),
    coverFocusX: album.coverFocusX,
    coverFocusY: album.coverFocusY,
    photoCount: album._count.photos,
    views: album._count.views,
    downloads: album._count.downloads,
    favoriteSelectionsCount: album._count.favoriteSelections,
    favoritePhotosCount: album.favoriteSelections.reduce((count, selection) => count + selection._count.items, 0),
    bibRecognitionEnabled: album.bibRecognitionEnabled,
    bibRecognitionProcessedAt: album.bibRecognitionProcessedAt ? album.bibRecognitionProcessedAt.toISOString() : null,
    bibRecognizedPhotosCount: album.photos.filter((photo) => photo.detectedBibs.length > 0).length,
    bibJob:
      latestBibJob && bibJobPayload
        ? {
            id: latestBibJob.id,
            status:
              latestBibJob.status === JobStatus.RUNNING
                ? "running"
                : latestBibJob.status === JobStatus.COMPLETED
                  ? "completed"
                  : latestBibJob.status === JobStatus.FAILED
                    ? "failed"
                    : "pending",
            total: bibJobPayload.total,
            processed: bibJobPayload.processed,
            recognized: bibJobPayload.recognized,
            failed: bibJobPayload.failed,
            skipped: bibJobPayload.skipped,
            remaining: bibJobPayload.remainingPhotoIds.length,
            batchSize: bibJobPayload.batchSize,
            mode: bibJobPayload.mode,
            updatedAt: latestBibJob.updatedAt.toISOString()
          }
        : null,
    permissions: {
      allowSingleDownload: album.allowSingleDownload,
      allowFavoritesDownload: album.allowFavoritesDownload,
      allowFullDownload: album.allowFullDownload
    },
    favoriteSelections: album.favoriteSelections.map((selection) => ({
      id: selection.id,
      clientName: selection.clientName,
      message: selection.message,
      whatsapp: selection.whatsapp,
      status: mapFavoriteSelectionStatus(selection.status),
      createdAt: selection.createdAt.toISOString(),
      photoCount: selection.items.length,
      serials: selection.items.map((item) => item.photo.sortOrder + 1),
      photos: selection.items.map((item) => ({
        id: item.photo.id,
        title: item.photo.filename,
        platformName: buildPublicPhotoTitle(album.title, item.photo.sortOrder),
        originalName: item.photo.filename,
        thumbUrl: item.photo.thumbKey ? toMediaRoute(item.photo.thumbKey) : buildPhotoUrl(item.photo),
        serial: item.photo.sortOrder + 1
      }))
    })),
    photos: album.photos.map((photo) => ({
      id: photo.id,
      url: buildPhotoUrl(photo),
      thumbUrl: photo.thumbKey ? toMediaRoute(photo.thumbKey) : buildPhotoUrl(photo),
      title: photo.filename,
      aspect: detectAspect(photo.filename),
      isCover: album.coverPhotoId === photo.id,
      sortOrder: photo.sortOrder,
      detectedBibs: photo.detectedBibs,
      bibOcrText: photo.bibOcrText,
      bibOcrProcessedAt: photo.bibOcrProcessedAt ? photo.bibOcrProcessedAt.toISOString() : null
    }))
  };
}

export async function getAlbumPasswordMetaById(id: string) {
  return prisma.album.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      passwordHash: true,
      visibility: true
    }
  });
}

export async function getAlbumBySlug(slug: string) {
  return prisma.album.findUnique({
    where: { slug },
    include: {
      coverPhoto: true,
      photos: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      },
      _count: {
        select: {
          photos: true,
          favorites: true
        }
      }
    }
  });
}

export async function saveFavoriteSelection(input: {
  slug: string;
  sessionId: string;
  clientName: string;
  message?: string;
  whatsapp?: string;
  photoIds: string[];
}) {
  const album = await prisma.album.findUnique({
    where: { slug: input.slug },
    select: {
      id: true,
      slug: true,
      title: true,
      photos: {
        where: {
          id: {
            in: input.photoIds
          }
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          sortOrder: true
        }
      }
    }
  });

  if (!album) {
    return null;
  }

  if (album.photos.length === 0) {
    throw new Error("No hay favoritas para enviar.");
  }

  const selection = await prisma.favoriteSelection.create({
    data: {
      albumId: album.id,
      sessionId: input.sessionId,
      clientName: input.clientName,
      message: input.message?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
      status: FavoriteSelectionStatus.PENDING,
      items: {
        create: album.photos.map((photo, index) => ({
          photoId: photo.id,
          sortOrder: index
        }))
      }
    },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          photo: {
            select: {
              sortOrder: true
            }
          }
        }
      }
    }
  });

  return {
    id: selection.id,
    albumTitle: album.title,
    serials: selection.items.map((item) => item.photo.sortOrder + 1)
  };
}

export async function recordAlbumView(slug: string, sessionId: string) {
  const album = await prisma.album.findUnique({
    where: { slug },
    select: { id: true }
  });

  if (!album) {
    return null;
  }

  return prisma.albumView.create({
    data: {
      albumId: album.id,
      sessionId
    }
  });
}

export async function recordAlbumDownload(input: {
  slug: string;
  sessionId: string;
  type: "SINGLE" | "FAVORITES_ZIP" | "FULL_ZIP";
  photoId?: string | null;
}) {
  const album = await prisma.album.findUnique({
    where: { slug: input.slug },
    select: {
      id: true,
      photos: input.photoId
        ? {
            where: { id: input.photoId },
            select: { id: true }
          }
        : false
    }
  });

  if (!album) {
    return null;
  }

  const photoId = input.photoId && Array.isArray(album.photos) && album.photos[0] ? album.photos[0].id : null;

  return prisma.download.create({
    data: {
      albumId: album.id,
      sessionId: input.sessionId,
      type: input.type,
      photoId
    }
  });
}

export async function getFavoriteSelectionExport(selectionId: string, albumId: string) {
  const selection = await prisma.favoriteSelection.findUnique({
    where: { id: selectionId },
    include: {
      album: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      },
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          photo: {
            select: {
              id: true,
              filename: true,
              sortOrder: true,
              originalKey: true,
              previewKey: true,
              thumbKey: true
            }
          }
        }
      }
    }
  });

  if (!selection || selection.albumId !== albumId) {
    return null;
  }

  return {
    id: selection.id,
    albumTitle: selection.album.title,
    albumSlug: selection.album.slug,
    clientName: selection.clientName,
    message: selection.message,
    whatsapp: selection.whatsapp,
    createdAt: selection.createdAt,
    photos: selection.items.map((item) => ({
      id: item.photo.id,
      serial: item.photo.sortOrder + 1,
      platformName: buildPublicPhotoTitle(selection.album.title, item.photo.sortOrder),
      originalName: item.photo.filename,
      originalKey: item.photo.originalKey,
      previewKey: item.photo.previewKey,
      thumbKey: item.photo.thumbKey
    }))
  };
}

export async function deleteFavoriteSelection(selectionId: string, albumId: string) {
  const selection = await prisma.favoriteSelection.findUnique({
    where: { id: selectionId },
    select: { id: true, albumId: true }
  });

  if (!selection || selection.albumId !== albumId) {
    return;
  }

  await prisma.favoriteSelection.delete({
    where: { id: selectionId }
  });
}

export async function updateFavoriteSelectionStatus(
  selectionId: string,
  albumId: string,
  status: FavoriteSelectionStatus
) {
  return prisma.favoriteSelection.updateMany({
    where: {
      id: selectionId,
      albumId
    },
    data: {
      status
    }
  });
}

export async function processAlbumBibRecognition(albumId: string, mode: "all" | "pending" = "all") {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: {
      id: true,
      slug: true,
      bibRecognitionEnabled: true,
      photos: {
        where: { status: "READY" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          filename: true,
          originalKey: true,
          previewKey: true,
          detectedBibs: true
        }
      }
    }
  });

  if (!album) {
    throw new Error("No se encontro el album.");
  }

  if (!album.bibRecognitionEnabled) {
    throw new Error("Activa reconocimiento de bibs en este album antes de procesarlo.");
  }

  let processedCount = 0;
  let recognizedCount = 0;
  let failedCount = 0;

  const photosToProcess =
    mode === "pending" ? album.photos.filter((photo) => photo.detectedBibs.length === 0) : album.photos;

  for (const photo of photosToProcess) {
      try {
        const sourceKey = photo.previewKey ?? photo.originalKey;
        const { body } = await readPhotoBinary(sourceKey);
        const result = await detectBibs(body, photo.filename);

        await prisma.photo.update({
        where: { id: photo.id },
        data: {
          detectedBibs: result.bibs,
          bibOcrText: result.parsedText || null,
          bibOcrProcessedAt: new Date()
        }
      });

      processedCount += 1;
      if (result.bibs.length > 0) {
        recognizedCount += 1;
      }
    } catch {
      await prisma.photo.update({
        where: { id: photo.id },
        data: {
          detectedBibs: [],
          bibOcrText: null,
          bibOcrProcessedAt: new Date()
        }
      });
      processedCount += 1;
      failedCount += 1;
    }
  }

  await prisma.album.update({
    where: { id: album.id },
    data: { bibRecognitionProcessedAt: new Date() }
  });

  return {
    slug: album.slug,
    processedCount,
    recognizedCount,
    failedCount,
    skippedCount: album.photos.length - photosToProcess.length
  };
}

export async function enqueueAlbumBibRecognitionJob(albumId: string, mode: "all" | "pending" = "pending", batchSize = 25) {
  const safeBatchSize = Math.min(Math.max(batchSize, 5), 50);
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: {
      id: true,
      bibRecognitionEnabled: true,
      photos: {
        where: { status: "READY" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          detectedBibs: true
        }
      }
    }
  });

  if (!album) {
    throw new Error("No se encontro el album.");
  }

  if (!album.bibRecognitionEnabled) {
    throw new Error("Activa reconocimiento de bibs en este album antes de procesarlo.");
  }

  const remainingPhotoIds =
    mode === "pending"
      ? album.photos.filter((photo) => photo.detectedBibs.length === 0).map((photo) => photo.id)
      : album.photos.map((photo) => photo.id);

  const payload: BibJobPayload = {
    mode,
    batchSize: safeBatchSize,
    remainingPhotoIds,
    total: remainingPhotoIds.length,
    processed: 0,
    recognized: 0,
    failed: 0,
    skipped: album.photos.length - remainingPhotoIds.length
  };

  const existingJob = await prisma.job.findFirst({
    where: {
      albumId,
      type: JobType.OCR_BIB,
      status: {
        in: [JobStatus.PENDING, JobStatus.RUNNING]
      }
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true }
  });

  const job = existingJob
    ? await prisma.job.update({
        where: { id: existingJob.id },
        data: {
          status: JobStatus.PENDING,
          payload,
          attempts: 0,
          runAt: new Date()
        }
      })
    : await prisma.job.create({
        data: {
          albumId,
          type: JobType.OCR_BIB,
          status: JobStatus.PENDING,
          payload
        }
      });

  return {
    jobId: job.id,
    total: payload.total,
    batchSize: payload.batchSize,
    remaining: payload.remainingPhotoIds.length
  };
}

export async function processNextBibRecognitionBatch(albumId: string) {
  const job = await prisma.job.findFirst({
    where: {
      albumId,
      type: JobType.OCR_BIB,
      status: {
        in: [JobStatus.PENDING, JobStatus.RUNNING]
      }
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      albumId: true,
      status: true,
      payload: true
    }
  });

  if (!job) {
    throw new Error("No hay una cola OCR activa para este album.");
  }

  const payload = normalizeBibJobPayload(job.payload);

  if (!payload) {
    throw new Error("La cola OCR no tiene un formato valido.");
  }

  if (payload.remainingPhotoIds.length === 0) {
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.COMPLETED
      }
    });

    return {
      jobId: job.id,
      processedInBatch: 0,
      recognizedInBatch: 0,
      failedInBatch: 0,
      remaining: 0,
      completed: true,
      totals: payload
    };
  }

  await prisma.job.update({
    where: { id: job.id },
    data: {
      status: JobStatus.RUNNING,
      attempts: {
        increment: 1
      }
    }
  });

  const photoIds = payload.remainingPhotoIds.slice(0, payload.batchSize);
  let processedInBatch = 0;
  let recognizedInBatch = 0;
  let failedInBatch = 0;

  for (const photoId of photoIds) {
    try {
      const result = await processSinglePhotoBibRecognition(albumId, photoId);
      processedInBatch += 1;
      if (result.bibs.length > 0) {
        recognizedInBatch += 1;
      }
    } catch {
      processedInBatch += 1;
      failedInBatch += 1;
    }
  }

  const nextPayload: BibJobPayload = {
    ...payload,
    remainingPhotoIds: payload.remainingPhotoIds.slice(photoIds.length),
    processed: payload.processed + processedInBatch,
    recognized: payload.recognized + recognizedInBatch,
    failed: payload.failed + failedInBatch
  };

  const completed = nextPayload.remainingPhotoIds.length === 0;

  await prisma.job.update({
    where: { id: job.id },
    data: {
      status: completed ? JobStatus.COMPLETED : JobStatus.PENDING,
      payload: nextPayload,
      runAt: new Date()
    }
  });

  return {
    jobId: job.id,
    processedInBatch,
    recognizedInBatch,
    failedInBatch,
    remaining: nextPayload.remainingPhotoIds.length,
    completed,
    totals: nextPayload
  };
}

export async function processSinglePhotoBibRecognition(albumId: string, photoId: string) {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      albumId: true,
      filename: true,
      originalKey: true,
      previewKey: true,
      album: {
        select: {
          id: true,
          slug: true,
          bibRecognitionEnabled: true
        }
      }
    }
  });

  if (!photo || photo.albumId !== albumId) {
    throw new Error("No se encontro la foto.");
  }

  if (!photo.album.bibRecognitionEnabled) {
    throw new Error("Activa reconocimiento de bibs en este album antes de procesar una foto.");
  }

  const sourceKey = photo.previewKey ?? photo.originalKey;
  const { body } = await readPhotoBinary(sourceKey);
  const result = await detectBibs(body, photo.filename);

  await prisma.photo.update({
    where: { id: photo.id },
    data: {
      detectedBibs: result.bibs,
      bibOcrText: result.parsedText || null,
      bibOcrProcessedAt: new Date()
    }
  });

  await prisma.album.update({
    where: { id: albumId },
    data: { bibRecognitionProcessedAt: new Date() }
  });

  return {
    slug: photo.album.slug,
    bibs: result.bibs
  };
}

export async function updatePhotoBibsManually(albumId: string, photoId: string, bibs: string[]) {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      albumId: true,
        album: {
          select: {
            slug: true,
            bibRecognitionEnabled: true
          }
        }
      }
    });

  if (!photo || photo.albumId !== albumId) {
    throw new Error("No se encontro la foto.");
  }

  if (!photo.album.bibRecognitionEnabled) {
    throw new Error("Activa reconocimiento de bibs en este album antes de guardar un bib manual.");
  }

  const normalizedBibs = Array.from(
    new Set(
      bibs
        .map((value) => value.replace(/\D+/g, "").trim())
        .filter((value) => value.length >= 2 && value.length <= 6)
    )
  );

  await prisma.photo.update({
    where: { id: photo.id },
    data: {
      detectedBibs: normalizedBibs,
      bibOcrText: normalizedBibs.length > 0 ? "__manual__" : null,
      bibOcrProcessedAt: new Date()
    }
  });

  return {
    slug: photo.album.slug,
    bibs: normalizedBibs
  };
}

export function buildGalleryPhotosFromAlbum(
  albumTitle: string,
  photos: Array<{
    id: string;
    previewKey: string | null;
    thumbKey?: string | null;
    originalKey: string;
    filename: string;
    sortOrder: number;
    detectedBibs?: string[];
  }>
): GalleryPhoto[] {
  return photos.map((photo, index) => ({
    id: photo.id,
    url: buildPhotoUrl(photo),
    thumbUrl: photo.thumbKey ? toMediaRoute(photo.thumbKey) : buildPhotoUrl(photo),
    title: buildPublicPhotoTitle(albumTitle, photo.sortOrder ?? index),
    aspect: detectAspect(photo.filename),
    sortOrder: photo.sortOrder ?? index,
    detectedBibs: photo.detectedBibs ?? []
  }));
}

function cleanFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, extension);

  const normalized = createSlug(baseName) || "foto";
  return `${normalized}${extension || ".jpg"}`;
}

async function saveAlbumPhotosLocally(albumId: string, files: File[]) {
  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "albums", albumId);
  const originalDirectory = path.join(uploadDirectory, "originals");
  const previewDirectory = path.join(uploadDirectory, "previews");
  const thumbDirectory = path.join(uploadDirectory, "thumbs");

  await mkdir(originalDirectory, { recursive: true });
  await mkdir(previewDirectory, { recursive: true });
  await mkdir(thumbDirectory, { recursive: true });

  const createdPhotos = [];
  const filesWithOrder = await Promise.all(
    files.map(async (file, index) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const capturedAt = await extractCapturedAt(buffer, file.lastModified);

      return {
        file,
        buffer,
        capturedAt: capturedAt?.getTime() ?? file.lastModified ?? 0,
        originalIndex: index
      };
    })
  );

  const sortedFiles = filesWithOrder.sort((left, right) => {
    if (left.capturedAt !== right.capturedAt) {
      return left.capturedAt - right.capturedAt;
    }

    return left.originalIndex - right.originalIndex;
  });

  for (const [index, entry] of sortedFiles.entries()) {
    const { file, buffer } = entry;
    const safeName = cleanFileName(file.name);
    const uniqueName = `${Date.now()}-${index}-${safeName}`;
    const originalAbsolutePath = path.join(originalDirectory, uniqueName);
    const originalPublicPath = `/uploads/albums/${albumId}/originals/${uniqueName}`;
    const derivatives = await buildImageDerivatives({
      buffer,
      fileName: file.name,
      contentType: file.type
    });
    const previewName = `${path.parse(uniqueName).name}-preview${derivatives.previewExtension}`;
    const thumbName = `${path.parse(uniqueName).name}-thumb${derivatives.thumbExtension}`;
    const previewAbsolutePath = path.join(previewDirectory, previewName);
    const thumbAbsolutePath = path.join(thumbDirectory, thumbName);
    const previewPublicPath = `/uploads/albums/${albumId}/previews/${previewName}`;
    const thumbPublicPath = `/uploads/albums/${albumId}/thumbs/${thumbName}`;

    await writeFile(originalAbsolutePath, buffer);
    await writeFile(previewAbsolutePath, derivatives.previewBuffer);
    await writeFile(thumbAbsolutePath, derivatives.thumbBuffer);

    const capturedAt = entry.capturedAt > 0 ? new Date(entry.capturedAt) : null;

    const photo = await prisma.photo.create({
      data: {
        albumId,
        filename: file.name,
        originalKey: originalPublicPath,
        previewKey: previewPublicPath,
        thumbKey: thumbPublicPath,
        capturedAt,
        width: derivatives.width,
        height: derivatives.height,
        sizeBytes: file.size,
        sortOrder: index,
        status: "READY"
      }
    });

    createdPhotos.push(photo);
  }

  await normalizeAlbumPhotoOrder(albumId);

  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: { coverPhotoId: true, photos: { orderBy: { sortOrder: "asc" }, select: { id: true } } }
  });

  if (!album?.coverPhotoId && album?.photos[0]) {
    await prisma.album.update({
      where: { id: albumId },
      data: { coverPhotoId: album.photos[0].id }
    });
  }

  return createdPhotos;
}

async function saveAlbumPhotosToR2(albumId: string, files: File[]) {
  const createdPhotos = [];
  const filesWithOrder = await Promise.all(
    files.map(async (file, index) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const capturedAt = await extractCapturedAt(buffer, file.lastModified);

      return {
        file,
        buffer,
        capturedAt: capturedAt?.getTime() ?? file.lastModified ?? 0,
        originalIndex: index
      };
    })
  );

  const sortedFiles = filesWithOrder.sort((left, right) => {
    if (left.capturedAt !== right.capturedAt) {
      return left.capturedAt - right.capturedAt;
    }

    return left.originalIndex - right.originalIndex;
  });

  for (const [index, entry] of sortedFiles.entries()) {
    const { file, buffer } = entry;
    const safeName = cleanFileName(file.name);
    const derivatives = await buildImageDerivatives({
      buffer,
      fileName: file.name,
      contentType: file.type
    });
    const uniqueBaseName = `${Date.now()}-${index}-${path.parse(safeName).name}`;
    const originalObjectKey = `albums/${albumId}/originals/${uniqueBaseName}${path.extname(safeName) || ".jpg"}`;
    const previewObjectKey = `albums/${albumId}/previews/${uniqueBaseName}-preview${derivatives.previewExtension}`;
    const thumbObjectKey = `albums/${albumId}/thumbs/${uniqueBaseName}-thumb${derivatives.thumbExtension}`;

    const originalKey = await uploadToR2({
      bucket: "originals",
      key: originalObjectKey,
      body: buffer,
      contentType: file.type || "image/jpeg"
    });

    const previewKey = await uploadToR2({
      bucket: "derivatives",
      key: previewObjectKey,
      body: derivatives.previewBuffer,
      contentType: derivatives.previewContentType
    });

    const thumbKey = await uploadToR2({
      bucket: "derivatives",
      key: thumbObjectKey,
      body: derivatives.thumbBuffer,
      contentType: derivatives.thumbContentType
    });

    const capturedAt = entry.capturedAt > 0 ? new Date(entry.capturedAt) : null;

    const photo = await prisma.photo.create({
      data: {
        albumId,
        filename: file.name,
        originalKey,
        previewKey,
        thumbKey,
        capturedAt,
        width: derivatives.width,
        height: derivatives.height,
        sizeBytes: file.size,
        sortOrder: index,
        status: "READY"
      }
    });

    createdPhotos.push(photo);
  }

  await normalizeAlbumPhotoOrder(albumId);

  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: { coverPhotoId: true, photos: { orderBy: { sortOrder: "asc" }, select: { id: true } } }
  });

  if (!album?.coverPhotoId && album?.photos[0]) {
    await prisma.album.update({
      where: { id: albumId },
      data: { coverPhotoId: album.photos[0].id }
    });
  }

  return createdPhotos;
}

export async function saveAlbumPhotos(albumId: string, files: File[]) {
  if (isR2Configured()) {
    return saveAlbumPhotosToR2(albumId, files);
  }

  return saveAlbumPhotosLocally(albumId, files);
}

export async function saveAlbumPhotoFromStorage(input: {
  albumId: string;
  filename: string;
  originalStorageKey: string;
  sizeBytes: number;
  contentType?: string;
  lastModified?: number;
  sortOrder?: number;
}) {
  if (!input.originalStorageKey.startsWith("r2://")) {
    throw new Error("La foto cargada no se encontro en R2.");
  }

  const parsedOriginalKey = parseStorageKey(input.originalStorageKey);

  if (!parsedOriginalKey) {
    throw new Error("La ruta del original no es valida.");
  }

  const { body, contentType } = await readFromR2(input.originalStorageKey);

  if (body.byteLength !== input.sizeBytes) {
    throw new Error("La foto cargada no coincide con el tamano esperado.");
  }

  const nextSortOrder = typeof input.sortOrder === "number" ? input.sortOrder : await getNextAlbumPhotoSortOrder(input.albumId);
  const derivatives = await buildImageDerivatives({
    buffer: body,
    fileName: input.filename,
    contentType: input.contentType ?? contentType
  });
  const uniqueBaseName = path.parse(path.basename(parsedOriginalKey.key)).name;
  const previewObjectKey = `albums/${input.albumId}/previews/${uniqueBaseName}-preview${derivatives.previewExtension}`;
  const thumbObjectKey = `albums/${input.albumId}/thumbs/${uniqueBaseName}-thumb${derivatives.thumbExtension}`;

  const [previewKey, thumbKey, capturedAt, album] = await Promise.all([
    uploadToR2({
      bucket: "derivatives",
      key: previewObjectKey,
      body: derivatives.previewBuffer,
      contentType: derivatives.previewContentType
    }),
    uploadToR2({
      bucket: "derivatives",
      key: thumbObjectKey,
      body: derivatives.thumbBuffer,
      contentType: derivatives.thumbContentType
    }),
    extractCapturedAt(body, input.lastModified ?? 0),
    prisma.album.findUnique({
      where: { id: input.albumId },
      select: { coverPhotoId: true }
    })
  ]);

  const photo = await prisma.photo.create({
    data: {
      albumId: input.albumId,
      filename: input.filename,
      originalKey: input.originalStorageKey,
      previewKey,
      thumbKey,
      capturedAt,
      width: derivatives.width,
      height: derivatives.height,
      sizeBytes: input.sizeBytes,
      sortOrder: nextSortOrder,
      status: "READY"
    }
  });

  if (!album?.coverPhotoId) {
    await prisma.album.update({
      where: { id: input.albumId },
      data: { coverPhotoId: photo.id }
    });
  }

  return photo;
}

export async function setAlbumCoverPhoto(albumId: string, photoId: string) {
  await prisma.album.update({
    where: { id: albumId },
    data: { coverPhotoId: photoId }
  });
}

export async function deleteAlbumPhoto(albumId: string, photoId: string) {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      albumId: true,
      originalKey: true,
      previewKey: true,
      thumbKey: true
    }
  });

  if (!photo || photo.albumId !== albumId) {
    return;
  }

  const album = await prisma.album.findUnique({
    where: { id: albumId },
    include: {
      photos: {
        where: {
          id: {
            not: photoId
          }
        },
        orderBy: {
          sortOrder: "asc"
        },
        select: {
          id: true
        }
      }
    }
  });

  await prisma.photo.delete({
    where: { id: photoId }
  });

  await normalizeAlbumPhotoOrder(albumId);

  if (album?.coverPhotoId === photoId) {
    await prisma.album.update({
      where: { id: albumId },
      data: {
        coverPhotoId: album.photos[0]?.id ?? null
      }
    });
  }

  const possibleFiles = [photo.originalKey, photo.previewKey, photo.thumbKey]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, array) => array.indexOf(value) === index);

  for (const publicPath of possibleFiles) {
    if (publicPath.startsWith("r2://")) {
      try {
        await removeFromR2(publicPath);
      } catch {
        // Ignore missing remote files in development.
      }
      continue;
    }

    if (!publicPath.startsWith("/uploads/")) {
      continue;
    }

    const absolutePath = path.join(process.cwd(), "public", publicPath.replace("/uploads/", "uploads/"));

    try {
      await unlink(absolutePath);
    } catch {
      // Ignore missing local files in development storage.
    }
  }
}

export async function moveAlbumPhoto(albumId: string, photoId: string, direction: "up" | "down") {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { id: true, albumId: true, sortOrder: true }
  });

  if (!photo || photo.albumId !== albumId) {
    return;
  }

  const neighbor = await prisma.photo.findFirst({
    where: {
      albumId,
      sortOrder: direction === "up" ? { lt: photo.sortOrder } : { gt: photo.sortOrder }
    },
    orderBy: {
      sortOrder: direction === "up" ? "desc" : "asc"
    },
    select: { id: true, sortOrder: true }
  });

  if (!neighbor) {
    return;
  }

  await prisma.$transaction([
    prisma.photo.update({
      where: { id: photo.id },
      data: { sortOrder: neighbor.sortOrder }
    }),
    prisma.photo.update({
      where: { id: neighbor.id },
      data: { sortOrder: photo.sortOrder }
    })
  ]);
}

export async function reorderAlbumPhotos(albumId: string, orderedPhotoIds: string[]) {
  const albumPhotos = await prisma.photo.findMany({
    where: { albumId },
    select: { id: true }
  });

  const validIds = new Set(albumPhotos.map((photo) => photo.id));
  const filteredIds = orderedPhotoIds.filter((photoId) => validIds.has(photoId));

  if (filteredIds.length !== albumPhotos.length) {
    return;
  }

  await prisma.$transaction(
    filteredIds.map((photoId, index) =>
      prisma.photo.update({
        where: { id: photoId },
        data: { sortOrder: index }
      })
    )
  );
}

export async function deleteAlbumPhotos(albumId: string, photoIds: string[]) {
  for (const photoId of photoIds) {
    await deleteAlbumPhoto(albumId, photoId);
  }
}

export async function getDownloadableAlbumPhotos(slug: string) {
  const album = await prisma.album.findUnique({
    where: { slug },
    select: {
      title: true,
      allowSingleDownload: true,
      allowFavoritesDownload: true,
      allowFullDownload: true,
      photos: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          filename: true,
          originalKey: true,
          sortOrder: true
        }
      }
    }
  });

  if (!album) {
    return null;
  }

  return album;
}

export async function deleteAlbum(albumId: string) {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: {
      id: true,
      slug: true,
      photos: {
        select: {
          originalKey: true,
          previewKey: true,
          thumbKey: true
        }
      }
    }
  });

  if (!album) {
    return null;
  }

  const possibleFiles = album.photos
    .flatMap((photo) => [photo.originalKey, photo.previewKey, photo.thumbKey])
    .filter((value): value is string => Boolean(value))
    .filter((value, index, array) => array.indexOf(value) === index);

  await prisma.album.delete({
    where: { id: albumId }
  });

  for (const publicPath of possibleFiles) {
    if (publicPath.startsWith("r2://")) {
      try {
        await removeFromR2(publicPath);
      } catch {
        // Ignore missing remote files in development.
      }
      continue;
    }

    if (!publicPath.startsWith("/uploads/")) {
      continue;
    }

    const absolutePath = path.join(process.cwd(), "public", publicPath.replace("/uploads/", "uploads/"));

    try {
      await unlink(absolutePath);
    } catch {
      // Ignore missing local files in development storage.
    }
  }

  try {
    await rm(path.join(process.cwd(), "public", "uploads", "albums", albumId), { recursive: true, force: true });
  } catch {
    // Ignore missing directories in development storage.
  }

  return album;
}

export async function readPhotoBinary(storageKey: string) {
  if (storageKey.startsWith("r2://")) {
    return readFromR2(storageKey);
  }

  if (storageKey.startsWith("/uploads/")) {
    const absolutePath = path.join(process.cwd(), "public", storageKey.replace("/uploads/", "uploads/"));
    return {
      contentType: "application/octet-stream",
      body: await import("node:fs/promises").then(({ readFile }) => readFile(absolutePath))
    };
  }

  throw new Error("Storage key no soportada.");
}
