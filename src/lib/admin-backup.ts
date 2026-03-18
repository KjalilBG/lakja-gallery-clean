import JSZip from "jszip";

import { prisma } from "@/lib/prisma";

export async function buildAdminBackupZip() {
  const [
    albums,
    photos,
    favoriteSelections,
    favoriteSelectionItems,
    favorites,
    albumViews,
    downloads,
    siteSettings
  ] = await prisma.$transaction([
    prisma.album.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.photo.findMany({ orderBy: [{ albumId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.favoriteSelection.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.favoriteSelectionItem.findMany({ orderBy: [{ favoriteSelectionId: "asc" }, { sortOrder: "asc" }] }),
    prisma.favorite.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.albumView.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.download.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.siteSettings.findMany()
  ]);

  const exportedAt = new Date().toISOString();
  const zip = new JSZip();

  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        exportedAt,
        app: "La Kja",
        tables: {
          albums: albums.length,
          photos: photos.length,
          favoriteSelections: favoriteSelections.length,
          favoriteSelectionItems: favoriteSelectionItems.length,
          favorites: favorites.length,
          albumViews: albumViews.length,
          downloads: downloads.length,
          siteSettings: siteSettings.length
        }
      },
      null,
      2
    )
  );

  zip.file("albums.json", JSON.stringify(albums, null, 2));
  zip.file("photos.json", JSON.stringify(photos, null, 2));
  zip.file("favorite-selections.json", JSON.stringify(favoriteSelections, null, 2));
  zip.file("favorite-selection-items.json", JSON.stringify(favoriteSelectionItems, null, 2));
  zip.file("favorites.json", JSON.stringify(favorites, null, 2));
  zip.file("album-views.json", JSON.stringify(albumViews, null, 2));
  zip.file("downloads.json", JSON.stringify(downloads, null, 2));
  zip.file("site-settings.json", JSON.stringify(siteSettings, null, 2));

  const fileName = `la-kja-backup-${exportedAt.slice(0, 10)}.zip`;
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });

  return { buffer, fileName };
}
