import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumStatus, AlbumVisibility } from "@prisma/client";
import { ArrowLeft, Download, ExternalLink, Eye, FileText, Heart, Settings2, Trash2, UploadCloud } from "lucide-react";

import { AlbumPhotoWorkspace } from "@/components/admin/album-photo-workspace";
import { AlbumPhotoUploader } from "@/components/admin/album-photo-uploader";
import { AlbumPhotoProcessingSync } from "@/components/admin/album-photo-processing-sync";
import { AlbumRetryDerivativesButton } from "@/components/admin/album-retry-derivatives-button";
import { AlbumSettingsFields } from "@/components/admin/album-settings-fields";
import { AlbumBibOcrPanel } from "@/components/admin/album-bib-ocr-panel";
import { ConfirmDeleteAlbumButton } from "@/components/admin/confirm-delete-album-button";
import { CopyAlbumLinkButton } from "@/components/admin/copy-album-link-button";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { getObjectPositionFromFocus } from "@/lib/cover";
import { getAdminAlbumById } from "@/lib/albums";
import { formatDate } from "@/lib/format";

import { deleteAlbumAction, deleteFavoriteSelectionAction, updateAlbumAction } from "../actions";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type AlbumDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AlbumDetailPage({ params, searchParams }: AlbumDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const album = await getAdminAlbumById(id);

  if (!album) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AlbumPhotoProcessingSync albumId={album.id} enabled={album.processingPhotosCount > 0} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <Link href="/appfotos/admin/albums" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 transition hover:border-lime-300 hover:text-slate-900">
            <ArrowLeft className="size-4" />
            Volver a albumes
          </Link>
          <span className="hidden text-slate-300 md:inline">/</span>
          <span className="truncate text-slate-900">{album.title}</span>
        </div>
        <CopyAlbumLinkButton slug={album.slug} />
      </div>

      {resolvedSearchParams.saved === "1" ? (
        <div className="rounded-[24px] border border-lime-200 bg-lime-50 px-5 py-4 text-sm font-bold text-lime-800">
          Los cambios del album se guardaron correctamente.
        </div>
      ) : null}
      {resolvedSearchParams.uploaded === "1" ? (
        <div className="rounded-[24px] border border-lime-200 bg-lime-50 px-5 py-4 text-sm font-bold text-lime-800">
          Las fotos se subieron correctamente al album.
        </div>
      ) : null}
      {resolvedSearchParams.photoDeleted === "1" ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          La foto fue eliminada del album.
        </div>
      ) : null}
      {album.processingPhotosCount > 0 ? (
        <div className="rounded-[24px] border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-bold text-sky-800">
          {album.processingPhotosCount === 1
            ? "1 foto ya se subio y sigue preparando preview y thumb en segundo plano."
            : `${album.processingPhotosCount} fotos ya se subieron y siguen preparando preview y thumb en segundo plano.`}
        </div>
      ) : null}
      {album.failedPhotosCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-800 md:flex-row md:items-center md:justify-between">
          <p>
            {album.failedPhotosCount === 1
              ? "1 foto no pudo generar sus derivados y se marco como fallida."
              : `${album.failedPhotosCount} fotos no pudieron generar sus derivados y se marcaron como fallidas.`}
          </p>
          <AlbumRetryDerivativesButton
            albumId={album.id}
            slug={album.slug}
            disabled={album.processingPhotosCount > 0}
          />
        </div>
      ) : null}
      {resolvedSearchParams.ocrError ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-800">
          {String(resolvedSearchParams.ocrError)}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6 p-7 lg:p-8">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.24em]">
              <span className="rounded-full bg-lime-50 px-4 py-2 text-lime-700">{album.status}</span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-500">
                {album.visibility === "password" ? "Contrasena" : "Link publico"}
              </span>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">{album.clientName}</p>
              <h1 className="text-5xl font-black tracking-tight text-slate-950 md:text-6xl">{album.title}</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-500">
                {album.description || "Gestiona portada, orden y entrega del album desde una sola vista limpia."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/appfotos/g/${album.slug}`} target="_blank" rel="noreferrer">
                <Button variant="pink">
                  <ExternalLink className="mr-2 size-4" />
                  Ver galeria
                </Button>
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Fecha</p>
                <p className="mt-2 text-lg font-black text-slate-900">{formatDate(album.eventDate)}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Fotos</p>
                <p className="mt-2 text-lg font-black text-slate-900">{album.photoCount}</p>
                {album.processingPhotosCount > 0 || album.failedPhotosCount > 0 ? (
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {album.processingPhotosCount} procesando · {album.failedPhotosCount} fallidas
                  </p>
                ) : null}
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">URL publica</p>
                <p className="mt-2 truncate text-sm font-bold text-slate-700">lakja.top/appfotos/g/{album.slug}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Listas recibidas</p>
                <p className="mt-2 text-lg font-black text-slate-900">{album.favoriteSelectionsCount}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <div
                className="h-[300px] bg-cover"
                style={{ backgroundImage: `url(${album.coverUrl})`, backgroundPosition: getObjectPositionFromFocus(album.coverFocusX, album.coverFocusY) }}
              />
              <div className="space-y-3 px-5 py-5">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Portada actual</p>
                <p className="text-xl font-black text-slate-900">Vista principal del album</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3 text-slate-400">
            <Eye className="size-5" />
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em]">Visitas</p>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">{album.views}</p>
          <p className="mt-2 text-sm text-slate-500">Se registran una vez por sesion en la galeria publica.</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3 text-slate-400">
            <Download className="size-5" />
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em]">Descargas</p>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">{album.downloads}</p>
          <p className="mt-2 text-sm text-slate-500">Incluye descargas individuales y ZIP del album.</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3 text-slate-400">
            <Heart className="size-5" />
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em]">Favoritas</p>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">{album.favoritePhotosCount}</p>
          <p className="mt-2 text-sm text-slate-500">Total de fotos incluidas en listas enviadas.</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3 text-slate-400">
            <FileText className="size-5" />
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em]">Listas</p>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">{album.favoriteSelectionsCount}</p>
          <p className="mt-2 text-sm text-slate-500">Listas de seleccion que ya te enviaron clientes.</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form
          action={updateAlbumAction}
          className="space-y-6 rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
        >
          <input type="hidden" name="albumId" value={album.id} />
          <input type="hidden" name="slug" value={album.slug} />
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-slate-100 p-3 text-slate-600">
              <Settings2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Configuracion del album</p>
              <p className="text-sm text-slate-500">Nombre, fecha, visibilidad y permisos en una sola tarjeta.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-500">Nombre del album</span>
              <input name="title" defaultValue={album.title} className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-500">Cliente o evento</span>
              <input name="clientName" defaultValue={album.clientName} className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white" required />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-500">Fecha</span>
              <input
                name="eventDate"
                type="date"
                defaultValue={album.eventDate ? album.eventDate.slice(0, 10) : ""}
                className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-500">Estado</span>
              <select
                name="status"
                defaultValue={
                  album.status === "published"
                    ? AlbumStatus.PUBLISHED
                    : album.status === "hidden"
                      ? AlbumStatus.HIDDEN
                      : AlbumStatus.DRAFT
                }
                className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
              >
                <option value={AlbumStatus.DRAFT}>Borrador</option>
                <option value={AlbumStatus.PUBLISHED}>Publicado</option>
                <option value={AlbumStatus.HIDDEN}>Oculto</option>
              </select>
            </label>
          </div>

          <AlbumSettingsFields
            initialVisibility={album.visibility === "password" ? AlbumVisibility.PASSWORD : AlbumVisibility.PUBLIC_LINK}
            coverUrl={album.coverUrl}
            coverPosition={album.coverPosition}
            coverFocusX={album.coverFocusX}
            coverFocusY={album.coverFocusY}
            hasPassword={album.visibility === "password"}
          />

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-500">Descripcion</span>
            <textarea
              name="description"
              defaultValue={album.description ?? ""}
              className="min-h-28 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-lime-400 focus:bg-white"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="allowSingleDownload"
                  defaultChecked={album.permissions.allowSingleDownload}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-lime-500 focus:ring-lime-400"
                />
                <div>
                  <p className="font-bold text-slate-900">Descarga individual</p>
                  <p className="mt-1 text-sm text-slate-500">Permite bajar fotos sueltas.</p>
                </div>
              </div>
            </label>
            <label className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="allowFavoritesDownload"
                  defaultChecked={album.permissions.allowFavoritesDownload}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-lime-500 focus:ring-lime-400"
                />
                <div>
                  <p className="font-bold text-slate-900">Descarga favoritas</p>
                  <p className="mt-1 text-sm text-slate-500">Entrega la seleccion del cliente.</p>
                </div>
              </div>
            </label>
            <label className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="allowFullDownload"
                  defaultChecked={album.permissions.allowFullDownload}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-lime-500 focus:ring-lime-400"
                />
                <div>
                  <p className="font-bold text-slate-900">Descarga completa</p>
                  <p className="mt-1 text-sm text-slate-500">Habilita ZIP del album completo.</p>
                </div>
              </div>
            </label>
            <label className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 md:col-span-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="bibRecognitionEnabled"
                  defaultChecked={album.bibRecognitionEnabled}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-lime-500 focus:ring-lime-400"
                />
                <div>
                  <p className="font-bold text-slate-900">Reconocimiento de bibs</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Activa OCR para este album deportivo y permite buscar fotos por numero de bib en la galeria publica.
                  </p>
                </div>
              </div>
            </label>
          </div>

          <SubmitButton idleLabel="Guardar cambios" pendingLabel="Guardando..." />
        </form>

        <aside className="space-y-4">
          {album.bibRecognitionEnabled ? (
            <AlbumBibOcrPanel
              albumId={album.id}
              enabled={album.bibRecognitionEnabled}
              photoCount={album.photoCount}
              recognizedCount={album.bibRecognizedPhotosCount}
              processedAt={album.bibRecognitionProcessedAt ? formatDate(album.bibRecognitionProcessedAt) : null}
              job={album.bibJob}
            />
          ) : null}

          <div className="rounded-[30px] border border-rose-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <Trash2 className="size-5 text-rose-500" />
              <p className="font-black uppercase tracking-[0.18em] text-slate-900">Eliminar album</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Borra el album completo junto con sus fotos locales, portada y registros asociados.
            </p>
            <form action={deleteAlbumAction} className="mt-4">
              <input type="hidden" name="albumId" value={album.id} />
              <ConfirmDeleteAlbumButton />
            </form>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5 rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-slate-100 p-3 text-slate-600">
              <UploadCloud className="size-5" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Subida de fotos</p>
              <p className="text-sm text-slate-500">Arrastra archivos, prepara una cola y sube con progreso real al album.</p>
            </div>
          </div>
          <AlbumPhotoUploader albumId={album.id} existingFileNames={album.photos.map((photo) => photo.title)} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <Heart className="size-5 text-slate-500" />
              <p className="font-black uppercase tracking-[0.18em] text-slate-900">Favoritas recibidas</p>
            </div>
            {album.favoriteSelections && album.favoriteSelections.length > 0 ? (
              <div className="mt-4 space-y-4">
                  {album.favoriteSelections.map((selection) => (
                    <div key={selection.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900">Lista de favoritos de {selection.clientName}</p>
                          <p className="mt-2 text-sm text-slate-500">
                            {selection.photoCount} foto(s) · {selection.serials.map((serial) => `#${serial}`).join(", ")}
                          </p>
                          <span className="mt-2 inline-block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                            {formatDate(selection.createdAt)}
                          </span>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <form action={deleteFavoriteSelectionAction}>
                            <input type="hidden" name="albumId" value={album.id} />
                            <input type="hidden" name="selectionId" value={selection.id} />
                            <button
                              type="submit"
                              title="Borrar lista"
                              aria-label="Borrar lista"
                              className="inline-flex size-10 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </form>
                        </div>
                      </div>
                      {selection.message ? <p className="mt-3 text-sm leading-6 text-slate-600">{selection.message}</p> : null}
                      {selection.whatsapp ? <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{selection.whatsapp}</p> : null}
                      <a
                        href={`/api/admin/albums/${album.id}/favorite-selections/${selection.id}/export`}
                        className="mt-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-700 transition hover:border-lime-300 hover:text-slate-950"
                      >
                        <FileText className="mr-2 size-4" />
                        Descargar PDF
                      </a>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Cuando un cliente envie sus favoritas, aqui veras su nombre, mensaje y numeros de serie.
              </p>
            )}
          </div>
        </aside>
      </section>

      <section className="space-y-5 rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400">Contenido</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Fotos del album</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Ordena por arrastre, cambia portada, busca por nombre o posicion y trabaja en modo compacto o grande.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">
            {album.photoCount} fotos
          </span>
        </div>

        {album.photos.length > 0 ? (
          <AlbumPhotoWorkspace
            albumId={album.id}
            slug={album.slug}
            photos={album.photos}
            bibRecognitionEnabled={album.bibRecognitionEnabled}
          />
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-slate-500">
            Aun no has subido fotos a este album. Usa el bloque superior para cargar las primeras imagenes.
          </div>
        )}
      </section>
    </div>
  );
}
