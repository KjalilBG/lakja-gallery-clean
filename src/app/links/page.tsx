import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpDown,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link2,
  MousePointerClick,
  PauseCircle,
  Rocket,
  Search,
  ShieldCheck,
  TimerReset,
  Trash2
} from "lucide-react";

import { CopyPublicLinkButton } from "@/components/admin/copy-public-link-button";
import { LinksCreateForm } from "@/components/links/links-create-form";
import { ShortLinkQr } from "@/components/links/short-link-qr";
import { requireSuperAdminSession } from "@/lib/auth-guard";
import {
  buildShortLinkUrl,
  getShortLinksDashboardData,
  resolveShortLinkDestination,
  type ShortLinkAnalyticsDay,
  type ShortLinkAnalyticsSource
} from "@/lib/short-links";

import { deleteShortLinkAction, toggleShortLinkAction, updateShortLinkAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Links | La Kja",
  robots: { index: false, follow: false }
};

type LinksPageProps = {
  searchParams?: Promise<{ saved?: string; error?: string; q?: string; sort?: string }>;
};

type LinkItem = Awaited<ReturnType<typeof getShortLinksDashboardData>>["shortLinks"][number];
type LinkSortOption = "recent" | "clicks" | "slug";

const LINK_SORT_LABELS: Record<LinkSortOption, string> = {
  recent: "Mas recientes",
  clicks: "Mas clicks",
  slug: "A-Z"
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">{children}</label>;
}

function HiddenListStateFields({ query, sort }: { query: string; sort: LinkSortOption }) {
  return (
    <>
      <input type="hidden" name="q" value={query} />
      <input type="hidden" name="sort" value={sort} />
    </>
  );
}

function formatDate(value: Date | null) {
  if (!value) return "Aun sin visitas";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function getSavedMessage(saved?: string) {
  if (saved === "created") return "El enlace corto se creo correctamente.";
  if (saved === "updated") return "El enlace corto se actualizo correctamente.";
  if (saved === "enabled") return "El enlace corto se activo otra vez.";
  if (saved === "disabled") return "El enlace corto se desactivo.";
  if (saved === "deleted") return "El enlace corto se elimino.";
  return null;
}

function getDestinationMeta(destinationUrl: string) {
  try {
    const parsed = new URL(resolveShortLinkDestination(destinationUrl));
    return {
      host: parsed.hostname.replace(/^www\./, ""),
      path: `${parsed.pathname}${parsed.search}` || "/"
    };
  } catch {
    return { host: "Ruta interna", path: destinationUrl };
  }
}

function normalizeSortOption(value?: string): LinkSortOption {
  if (value === "clicks" || value === "slug") {
    return value;
  }

  return "recent";
}

function sortShortLinks(shortLinks: LinkItem[], sort: LinkSortOption) {
  return [...shortLinks].sort((left, right) => {
    if (sort === "clicks") {
      return right.clicks - left.clicks || right.recentClicks - left.recentClicks || right.updatedAt.getTime() - left.updatedAt.getTime();
    }

    if (sort === "slug") {
      return left.slug.localeCompare(right.slug, "es", { sensitivity: "base" });
    }

    const rightActivity = right.lastClickedAt?.getTime() ?? right.updatedAt.getTime();
    const leftActivity = left.lastClickedAt?.getTime() ?? left.updatedAt.getTime();
    return rightActivity - leftActivity || right.updatedAt.getTime() - left.updatedAt.getTime();
  });
}

function filterShortLinks(shortLinks: LinkItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return shortLinks;
  }

  return shortLinks.filter((item) =>
    [item.title, item.slug, item.destinationUrl]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  );
}

function MiniBarChart({ data }: { data: ShortLinkAnalyticsDay[] }) {
  const maxValue = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="grid h-28 grid-cols-7 items-end gap-2">
      {data.map((item) => (
        <div key={item.date} className="flex h-full flex-col items-center justify-end gap-2">
          <div
            className="w-full rounded-full bg-[linear-gradient(180deg,#84cc16,#4d7c0f)]"
            style={{ height: `${Math.max((item.count / maxValue) * 100, item.count > 0 ? 16 : 8)}%` }}
            title={`${item.date}: ${item.count}`}
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{item.date.slice(5).replace("-", "/")}</span>
        </div>
      ))}
    </div>
  );
}

function SourcePills({ sources }: { sources: ShortLinkAnalyticsSource[] }) {
  if (sources.length === 0) {
    return <p className="text-sm text-slate-400">Sin datos todavia.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((source) => (
        <span key={`${source.label}-${source.count}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
          <span>{source.label}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
            {source.count}
          </span>
        </span>
      ))}
    </div>
  );
}

async function LinkCard({
  shortLink,
  paused = false,
  query,
  sort
}: {
  shortLink: LinkItem;
  paused?: boolean;
  query: string;
  sort: LinkSortOption;
}) {
  const publicUrl = buildShortLinkUrl(shortLink.slug);
  const destinationMeta = getDestinationMeta(shortLink.destinationUrl);

  return (
    <details className="group rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${paused ? "bg-slate-300" : "bg-lime-500"}`} />
            <h3 className="truncate text-lg font-black tracking-tight text-slate-950">{shortLink.title || `/${shortLink.slug}`}</h3>
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-slate-400">/{shortLink.slug}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <CopyPublicLinkButton slug={shortLink.slug} url={publicUrl} defaultLabel="Copiar" copiedLabel="Copiado" />
          <span className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-3 text-slate-500 transition group-open:hidden">
            <ChevronDown className="size-4" />
          </span>
          <span className="hidden items-center justify-center rounded-full border border-slate-200 px-3 py-3 text-slate-500 transition group-open:inline-flex">
            <ChevronUp className="size-4" />
          </span>
        </div>
      </summary>

      <div className="grid gap-5 border-t border-slate-200 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Estado</p>
              <p className="mt-2 text-sm font-bold text-slate-700">{paused ? "Pausado" : "Activo"}</p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Clicks</p>
              <p className="mt-2 text-sm font-bold text-slate-700">{shortLink.clicks}</p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">7 dias</p>
              <p className="mt-2 text-sm font-bold text-slate-700">{shortLink.recentClicks}</p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Ultimo click</p>
              <p className="mt-2 text-sm font-bold text-slate-700">{formatDate(shortLink.lastClickedAt)}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">URL publica</p>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-2 break-all text-sm font-bold text-slate-700 hover:text-lime-700">
                {publicUrl}
                <ExternalLink className="size-4 shrink-0" />
              </a>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Destino</p>
              <p className="mt-2 break-all text-sm font-semibold leading-6 text-slate-700">{destinationMeta.host}</p>
              <p className="mt-1 break-all text-xs font-medium leading-5 text-slate-500">{destinationMeta.path}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Origenes principales</p>
            <div className="mt-2">
              <SourcePills sources={shortLink.topSources} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <form action={toggleShortLinkAction}>
              <HiddenListStateFields query={query} sort={sort} />
              <input type="hidden" name="id" value={shortLink.id} />
              <input type="hidden" name="nextValue" value={paused ? "true" : "false"} />
              <button type="submit" className={`inline-flex items-center justify-center rounded-full px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] transition md:text-sm md:tracking-[0.16em] ${paused ? "border border-lime-200 bg-lime-50 text-lime-700 hover:border-lime-300 hover:bg-lime-100" : "border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-950"}`}>
                {paused ? <Rocket className="mr-2 size-4" /> : <PauseCircle className="mr-2 size-4" />}
                {paused ? "Reactivar" : "Pausar"}
              </button>
            </form>
            <form action={deleteShortLinkAction}>
              <HiddenListStateFields query={query} sort={sort} />
              <input type="hidden" name="id" value={shortLink.id} />
              <button type="submit" className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 md:text-sm md:tracking-[0.16em]">
                <Trash2 className="mr-2 size-4" />
                Borrar
              </button>
            </form>
          </div>

          <form action={updateShortLinkAction} className="grid gap-4 rounded-[22px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff,#f8fafc)] px-4 py-4 lg:grid-cols-2">
            <HiddenListStateFields query={query} sort={sort} />
            <input type="hidden" name="id" value={shortLink.id} />
            <div className="space-y-2">
              <FieldLabel>Slug</FieldLabel>
              <input name="slug" defaultValue={shortLink.slug} className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-100" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Destino</FieldLabel>
              <input name="destinationUrl" defaultValue={shortLink.destinationUrl} className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-100" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Nombre</FieldLabel>
              <input name="title" defaultValue={shortLink.title ?? ""} className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-100" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Estado</FieldLabel>
              <label className="flex items-start gap-4 rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                <input type="hidden" name="isActive" value="false" />
                <input type="checkbox" name="isActive" value="true" defaultChecked={!paused} className="mt-0.5 h-5 w-5 rounded border-slate-300 text-lime-500 focus:ring-lime-400" />
                <span className="text-sm font-semibold text-slate-700">{paused ? "Volver a activarlo" : "Mantener activo"}</span>
              </label>
            </div>
            <div className="lg:col-span-2">
              <button type="submit" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800">
                Guardar cambios
              </button>
            </div>
          </form>
        </div>

        <ShortLinkQr url={publicUrl} label={shortLink.slug} />
      </div>
    </details>
  );
}

export default async function LinksPage({ searchParams }: LinksPageProps) {
  const session = await requireSuperAdminSession("/links");
  const [{ shortLinks, overview }, resolvedSearchParams] = await Promise.all([
    getShortLinksDashboardData(),
    searchParams ?? Promise.resolve({} as { saved?: string; error?: string; q?: string; sort?: string })
  ]);

  const query = String(resolvedSearchParams.q ?? "").trim();
  const sort = normalizeSortOption(resolvedSearchParams.sort);
  const savedMessage = getSavedMessage(resolvedSearchParams.saved);
  const errorMessage = resolvedSearchParams.error ?? null;
  const filteredLinks = sortShortLinks(filterShortLinks(shortLinks, query), sort);
  const activeLinks = filteredLinks.filter((item) => item.isActive);
  const pausedLinks = filteredLinks.filter((item) => !item.isActive);
  const topLink = shortLinks[0] ?? null;
  const hasFilters = Boolean(query) || sort !== "recent";
  const totalVisibleLinks = activeLinks.length + pausedLinks.length;

  return (
    <div className="space-y-8 pb-10 pt-6 md:pt-10">
      <section className="rounded-[34px] border border-slate-200 bg-[linear-gradient(140deg,#ffffff_0%,#f8fafc_55%,#eefbf4_100%)] p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-black tracking-tight text-slate-950">Links</h1>
            <p className="mt-3 text-base leading-7 text-slate-500">Crea, pausa, comparte y mide links cortos desde un solo lugar.</p>
          </div>
          <div className="space-y-3 text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-700">
              <ShieldCheck className="size-4 text-lime-600" />
              Solo super admin
            </span>
            <p className="text-sm font-semibold text-slate-500">{session.user?.email ?? "Super admin"}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[22px] border border-white/70 bg-white/80 px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Links</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{overview.totalLinks}</p>
          </div>
          <div className="rounded-[22px] border border-white/70 bg-white/80 px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Activos</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{overview.activeLinks}</p>
          </div>
          <div className="rounded-[22px] border border-white/70 bg-white/80 px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Clicks totales</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{overview.totalClicks}</p>
          </div>
          <div className="rounded-[22px] border border-white/70 bg-white/80 px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Ultimos 7 dias</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{overview.last7DaysClicks}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/appfotos/admin" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:text-slate-950">
            Volver al admin
          </Link>
        </div>
      </section>

      {savedMessage ? (
        <div className="flex items-center gap-3 rounded-[26px] border border-lime-200 bg-lime-50 px-5 py-4 text-sm font-semibold text-lime-800">
          <CheckCircle2 className="size-5" />
          {savedMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">{errorMessage}</div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <LinksCreateForm query={query} sort={sort} />

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-lime-50 p-3 text-lime-700">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Analitica</p>
                <p className="mt-1 text-sm font-bold text-slate-700">Clicks por dia</p>
              </div>
            </div>
            <div className="mt-5">
              <MiniBarChart data={overview.clicksByDay} />
            </div>
            <div className="mt-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Top origenes</p>
              <div className="mt-3">
                <SourcePills sources={overview.topSources} />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Gestion</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Busca y ordena rapido</h2>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-600">
                {totalVisibleLinks} visibles de {shortLinks.length}
              </div>
            </div>

            <form className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
              <label className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-lime-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-lime-100">
                <Search className="size-4 text-slate-400" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Busca por nombre, slug o destino"
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>

              <label className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-lime-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-lime-100">
                <ArrowUpDown className="size-4 text-slate-400" />
                <select
                  name="sort"
                  defaultValue={sort}
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                >
                  {Object.entries(LINK_SORT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-3">
                <button type="submit" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800">
                  Aplicar
                </button>
                {hasFilters ? (
                  <Link
                    href="/links"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                  >
                    Limpiar
                  </Link>
                ) : null}
              </div>
            </form>
          </section>

          {topLink ? (
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-lime-50 p-3 text-lime-700">
                    <MousePointerClick className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Top link</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">/{topLink.slug}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-slate-100 p-3 text-slate-600">
                    <PauseCircle className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Pausados</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">{overview.pausedLinks} guardados</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-sky-50 p-3 text-sky-700">
                    <Link2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">QR</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">Automatico por link</p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {pausedLinks.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Pausados</h2>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-600">
                  <TimerReset className="size-4" />
                  {pausedLinks.length}
                </span>
              </div>
              <div className="space-y-4">
                {pausedLinks.map((shortLink) => (
                  <LinkCard key={shortLink.id} shortLink={shortLink} paused query={query} sort={sort} />
                ))}
              </div>
            </section>
          ) : null}

          {activeLinks.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Links encendidos</h2>
                <span className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-lime-700">
                  <MousePointerClick className="size-4" />
                  {activeLinks.length}
                </span>
              </div>
              <div className="space-y-4">
                {activeLinks.map((shortLink) => (
                  <LinkCard key={shortLink.id} shortLink={shortLink} query={query} sort={sort} />
                ))}
              </div>
            </section>
          ) : null}

          {totalVisibleLinks === 0 ? (
            <section className="rounded-[30px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-slate-400">Sin resultados</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">No encontre links con ese filtro</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">Prueba con otro nombre, otro slug o limpia la busqueda para volver a ver todo.</p>
              {hasFilters ? (
                <div className="mt-5">
                  <Link
                    href="/links"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                  >
                    Ver todos
                  </Link>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
