import Link from "next/link";
import type { ReactNode } from "react";
import {
  FinanceCategoryDirection,
  FinanceOwner,
  FinanceTransactionStatus,
  FinanceTransactionType
} from "@prisma/client";
import {
  ArrowRightLeft,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Pencil,
  PlusCircle,
  Settings2,
  ScanSearch,
  Sparkles,
  Trash2,
  TriangleAlert,
  Wallet
} from "lucide-react";

import {
  bulkUpdateFinanceTransactionsAction,
  createFinanceCategoryAction,
  confirmFinanceTransactionAction,
  createFinanceTransactionAction,
  deleteFinanceTransactionAction,
  mergeFinanceCategoryAction,
  updateFinanceCategoryAction,
  updateFinanceTelegramTemplatesAction,
  updateFinanceTransactionAction
} from "@/app/finance/actions";
import { TransactionBatchEditor } from "@/components/finance/transaction-batch-editor";
import { requireStaffSession } from "@/lib/auth-guard";
import { formatCurrency, formatDate } from "@/lib/format";
import { getFinanceBotSettings, getFinanceCategories } from "@/lib/finance/config";
import {
  financeOwnerLabels,
  financeOwners,
  financeSourceLabels,
  financeSpecialTypeLabels,
  financeStatusLabels,
  financeTypeLabels
} from "@/lib/finance/constants";
import { formatPeriodLabel, getCurrentPeriodKey } from "@/lib/finance/period";
import { getFinancePeriods, getFinanceReport } from "@/lib/finance/reports";

export const dynamic = "force-dynamic";

type SectionKey = "overview" | "transactions" | "review" | "capture" | "settings";

function pageHref(params: { view: string; owner?: string; period?: string; section?: string }) {
  const query = new URLSearchParams();
  if (params.view) query.set("view", params.view);
  if (params.owner) query.set("owner", params.owner);
  if (params.period) query.set("period", params.period);
  if (params.section) query.set("section", params.section);
  return `/finance?${query.toString()}`;
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function selectClassName() {
  return "rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
}

function inputClassName() {
  return "rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
}

function formatVerboseDate(date: Date | string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(date));
}

function getTypeTone(type: FinanceTransactionType) {
  if (type === FinanceTransactionType.INCOME) return "emerald";
  if (type === FinanceTransactionType.SPECIAL) return "amber";
  if (type === FinanceTransactionType.HONORARIOS_KJALIL || type === FinanceTransactionType.HONORARIOS_TERCEROS) {
    return "rose";
  }
  return "sky";
}

function SectionLink({
  label,
  href,
  active,
  icon: Icon
}: {
  label: string;
  href: string;
  active: boolean;
  icon: typeof BarChart3;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
          : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function FilterPill({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cx(
        "rounded-[8px] border px-3 py-2 text-xs font-bold uppercase transition-colors",
        active
          ? "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-100"
          : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      )}
    >
      {label}
    </Link>
  );
}

function Panel({
  title,
  eyebrow,
  children,
  className
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900",
        className
      )}
    >
      {eyebrow ? <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">{eyebrow}</p> : null}
      <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Wallet;
  tone: "emerald" | "sky" | "amber" | "rose";
}) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
  };

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>
        </div>
        <div className={cx("rounded-[8px] border p-2", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function FinanceBadge({ label, tone = "slate" }: { label: string; tone?: "slate" | "emerald" | "sky" | "amber" | "rose" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
  };

  return <span className={cx("rounded-[8px] border px-2 py-1 text-[11px] font-bold", tones[tone])}>{label}</span>;
}

function CategoryChart({ rows }: { rows: Array<{ label: string; amount: number; details?: Array<{ description: string; amount: number }> }> }) {
  if (!rows.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-300">Sin datos todavía.</p>;
  }

  const maxValue = Math.max(...rows.map((row) => row.amount), 1);

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.label} className="space-y-1">
          <div className="group relative flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{row.label}</span>
            <span className="text-slate-500 dark:text-slate-400">{formatCurrency(row.amount)}</span>
            {row.details?.length ? (
              <div className="pointer-events-none absolute left-0 top-full z-10 hidden min-w-[260px] rounded-[8px] border border-slate-200 bg-white p-3 shadow-lg group-hover:block dark:border-slate-700 dark:bg-slate-950">
                <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">Movimientos dentro de {row.label}</p>
                <div className="mt-2 space-y-2">
                  {row.details.map((detail, detailIndex) => (
                    <div key={`${row.label}-${detailIndex}`} className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-slate-600 dark:text-slate-300">{detail.description}</span>
                      <span className="whitespace-nowrap font-bold text-slate-900 dark:text-white">{formatCurrency(detail.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="h-2 overflow-hidden rounded-[8px] bg-slate-100 dark:bg-slate-800">
            <div
              className={cx(
                "h-full rounded-[8px]",
                ["bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-rose-500", "bg-violet-500", "bg-cyan-500"][index % 6]
              )}
              style={{ width: `${(row.amount / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function categoryDirectionLabel(direction: FinanceCategoryDirection) {
  if (direction === FinanceCategoryDirection.INCOME) return "Ingreso";
  if (direction === FinanceCategoryDirection.SPECIAL) return "Especial";
  return "Egreso";
}

function categoryDirectionTone(direction: FinanceCategoryDirection): "emerald" | "amber" | "rose" {
  if (direction === FinanceCategoryDirection.INCOME) return "emerald";
  if (direction === FinanceCategoryDirection.SPECIAL) return "amber";
  return "rose";
}

export default async function FinancePage({
  searchParams
}: {
  searchParams?: Promise<{ period?: string; owner?: string; view?: string; section?: string }>;
}) {
  await requireStaffSession("/finance");

  const params = (await searchParams) ?? {};
  const periodKey = params.period && /^\d{4}-\d{2}$/.test(params.period) ? params.period : getCurrentPeriodKey();
  const owner =
    params.owner && ["LAKJA", "KJALIL", "KK"].includes(params.owner) ? (params.owner as FinanceOwner) : undefined;
  const view = params.view === "historical" ? "historical" : "period";
  const section: SectionKey =
    params.section && ["overview", "transactions", "review", "capture", "settings"].includes(params.section)
      ? (params.section as SectionKey)
      : "overview";

  const [selected, historical, availablePeriods, categories, botSettings] = await Promise.all([
    getFinanceReport({ periodKey, owner, historical: view === "historical" }),
    getFinanceReport({ owner, historical: true }),
    getFinancePeriods(),
    getFinanceCategories(),
    getFinanceBotSettings()
  ]);

  const ownerLabel = owner ? financeOwnerLabels[owner] : "General";
  const currentTitle = view === "historical" ? "Histórico completo" : formatPeriodLabel(periodKey);
  const visiblePeriods = availablePeriods.slice(0, 12);
  const returnTo = pageHref({ view, owner, period: periodKey, section });
  const isLakjaView = !owner || owner === FinanceOwner.LAKJA;
  const categoryOptions = categories.map((item) => item.label);
  const visibleTransactions = owner ? selected.transactions.filter((item) => item.owner === owner) : selected.transactions;
  const visibleReviewTransactions = owner
    ? historical.reviewTransactions.filter((item) => item.owner === owner)
    : historical.reviewTransactions;
  const summaryCards = owner === FinanceOwner.KJALIL
    ? [
        {
          title: "Egresos Kjalil",
          value: formatCurrency(selected.totals.kjalilExpense),
          subtitle: "gasto personal del periodo",
          icon: Wallet,
          tone: "amber" as const
        },
        {
          title: "Especiales Kjalil",
          value: formatCurrency(selected.sections.kjalil.especiales.reduce((total, item) => total + Number(item.amount), 0)),
          subtitle: "préstamos, reembolsos y ajustes",
          icon: ArrowRightLeft,
          tone: "rose" as const
        },
        {
          title: "Por revisar",
          value: String(selected.reviewTransactions.length),
          subtitle: "movimientos pendientes",
          icon: TriangleAlert,
          tone: "amber" as const
        }
      ]
    : owner === FinanceOwner.KK
      ? [
          {
            title: "Egresos K&K",
            value: formatCurrency(selected.totals.kkExpense),
            subtitle: "gasto compartido del periodo",
            icon: Wallet,
            tone: "amber" as const
          },
          {
            title: "Especiales K&K",
            value: formatCurrency(selected.sections.kk.especiales.reduce((total, item) => total + Number(item.amount), 0)),
            subtitle: "movimientos no operativos",
            icon: ArrowRightLeft,
            tone: "rose" as const
          },
          {
            title: "Por revisar",
            value: String(selected.reviewTransactions.length),
            subtitle: "movimientos pendientes",
            icon: TriangleAlert,
            tone: "amber" as const
          }
        ]
      : [
          {
            title: "Ingresos LaKja",
            value: formatCurrency(selected.totals.lakjaIncome),
            subtitle: "solo ingresos operativos de LaKja",
            icon: CircleDollarSign,
            tone: "emerald" as const
          },
          {
            title: "Egresos LaKja",
            value: formatCurrency(selected.totals.lakjaOperationalExpense),
            subtitle: `${formatCurrency(selected.totals.lakjaHonorariosKjalil + selected.totals.lakjaHonorariosTerceros)} en honorarios`,
            icon: BadgeDollarSign,
            tone: "sky" as const
          },
          {
            title: "Especiales",
            value: formatCurrency(selected.totals.special),
            subtitle: selected.insights.classificationHealth,
            icon: ArrowRightLeft,
            tone: "rose" as const
          },
          {
            title: "Cola de revisión",
            value: String(historical.reviewTransactions.length),
            subtitle: "movimientos listos para aprobar o corregir",
            icon: TriangleAlert,
            tone: "amber" as const
          }
        ];

  return (
    <div className="space-y-6">
      <datalist id="finance-categories">
        {categoryOptions.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>

      <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <FinanceBadge label={ownerLabel} tone="sky" />
              <FinanceBadge label={currentTitle} tone="emerald" />
              <FinanceBadge label={view === "historical" ? "Vista histórica" : "Vista mensual"} tone={view === "historical" ? "amber" : "slate"} />
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Centro financiero</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Navegación por bolsa, cortes por periodo, revisión manual y captura web dentro de `lakja.top/finance`.
            </p>
          </div>
          <div className={cx("grid gap-2", summaryCards.length >= 4 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
            {summaryCards.map((card) => (
              <MetricCard
                key={card.title}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                icon={card.icon}
                tone={card.tone}
              />
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">Navegación</p>
          <div className="flex flex-wrap gap-2">
          <SectionLink label="Resumen" href={pageHref({ view, owner, period: periodKey, section: "overview" })} active={section === "overview"} icon={BarChart3} />
          <SectionLink label="Movimientos" href={pageHref({ view, owner, period: periodKey, section: "transactions" })} active={section === "transactions"} icon={ClipboardList} />
          <SectionLink label="Revisión" href={pageHref({ view, owner, period: periodKey, section: "review" })} active={section === "review"} icon={ScanSearch} />
          <SectionLink label="Registrar" href={pageHref({ view, owner, period: periodKey, section: "capture" })} active={section === "capture"} icon={PlusCircle} />
          <SectionLink label="Configurar" href={pageHref({ view, owner, period: periodKey, section: "settings" })} active={section === "settings"} icon={Settings2} />
          </div>
        </div>

        {section === "settings" ? null : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">Bolsa</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <FilterPill label="General" href={pageHref({ view, period: periodKey, section })} active={!owner} />
                {financeOwners.map((currentOwner) => (
                  <FilterPill
                    key={currentOwner}
                    label={financeOwnerLabels[currentOwner]}
                    href={pageHref({ view, owner: currentOwner, period: periodKey, section })}
                    active={owner === currentOwner}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">Periodo</p>
              <form action="/finance" className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                <input type="hidden" name="section" value={section} />
                {owner ? <input type="hidden" name="owner" value={owner} /> : null}
                <select className={selectClassName()} name="view" defaultValue={view}>
                  <option value="period">Por periodo</option>
                  <option value="historical">Histórico</option>
                </select>
                <select className={selectClassName()} name="period" defaultValue={periodKey}>
                  {visiblePeriods.map((item) => (
                    <option key={item} value={item}>
                      {formatPeriodLabel(item)}
                    </option>
                  ))}
                </select>
                <button className="rounded-[8px] border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Aplicar
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {section === "overview" ? (
        <div className="space-y-6">
          {isLakjaView ? (
          <section className="grid gap-4 xl:grid-cols-3">
            <Panel title="Flujo operativo" eyebrow="LaKja">
              <div className="space-y-3">
                {[
                  ["Ingresos LaKja", selected.totals.lakjaIncome],
                  ["Egreso operativo LaKja", selected.totals.lakjaOperationalExpense],
                  ["Egreso honorarios Kjalil", selected.totals.lakjaHonorariosKjalil],
                  ["Egreso honorarios terceros", selected.totals.lakjaHonorariosTerceros],
                  ["Balance LaKja", selected.totals.lakjaBalance]
                ].map(([label, amount]) => (
                  <div key={label} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-300">{label}</span>
                    <span className="font-black text-slate-950 dark:text-white">{formatCurrency(Number(amount))}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Ingresos por categoría" eyebrow="LaKja">
              <CategoryChart rows={selected.insights.lakjaIncomeCategories.length ? selected.insights.lakjaIncomeCategories : historical.insights.lakjaIncomeCategories} />
            </Panel>

            <Panel title="Egresos por categoría" eyebrow="LaKja">
              <CategoryChart rows={selected.insights.lakjaExpenseCategories.length ? selected.insights.lakjaExpenseCategories : historical.insights.lakjaExpenseCategories} />
            </Panel>
          </section>
          ) : (
          <section className="grid gap-4 xl:grid-cols-2">
            <Panel title={`Resumen ${ownerLabel}`} eyebrow="Ingreso vs egreso">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-300">Ingresos</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-300">{formatCurrency(0)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-300">Egresos</span>
                  <span className="font-black text-rose-600 dark:text-rose-300">
                    {formatCurrency(
                      owner === FinanceOwner.KJALIL
                        ? selected.totals.kjalilExpense
                        : owner === FinanceOwner.KK
                          ? selected.totals.kkExpense
                          : selected.totals.lakjaOperationalExpense + selected.totals.lakjaHonorariosKjalil + selected.totals.lakjaHonorariosTerceros
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-300">Especiales</span>
                  <span className="font-black text-amber-600 dark:text-amber-300">{formatCurrency(selected.totals.special)}</span>
                </div>
              </div>
            </Panel>

            <Panel title="Top categorías" eyebrow={ownerLabel}>
              <CategoryChart rows={selected.insights.topCategories.length ? selected.insights.topCategories : historical.insights.topCategories} />
            </Panel>
          </section>
          )}

          {isLakjaView ? null : null}
        </div>
      ) : null}

      {section === "review" ? (
        <Panel title="Cola de revisión" eyebrow="Aceptar, editar o borrar">
            <div className="space-y-4">
            {visibleReviewTransactions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-300">No hay movimientos pendientes. Aquí irán los que necesiten decisión manual.</p>
            ) : (
              visibleReviewTransactions.map((item) => (
                <div key={item.id} className="rounded-[8px] border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <FinanceBadge label={financeOwnerLabels[item.owner]} tone="sky" />
                        <FinanceBadge
                          label={
                            item.type === FinanceTransactionType.INCOME
                              ? "Ingreso"
                              : item.type === FinanceTransactionType.EXPENSE
                                ? "Egreso"
                                : financeTypeLabels[item.type]
                          }
                          tone={getTypeTone(item.type)}
                        />
                        <FinanceBadge label={financeStatusLabels[item.status]} tone="amber" />
                        <FinanceBadge label={formatVerboseDate(item.date)} tone="slate" />
                      </div>
                      <p className="text-lg font-black text-slate-950 dark:text-white">{item.description || item.rawMessage}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{item.category} · {financeSourceLabels[item.sourceChannel]}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className={cx("rounded-[8px] border px-3 py-2 text-sm font-black", item.type === FinanceTransactionType.INCOME ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300")}>
                        {item.type === FinanceTransactionType.INCOME ? "+" : "-"} {formatCurrency(Number(item.amount), item.currency)}
                      </div>
                      <form action={confirmFinanceTransactionAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button className="inline-flex items-center gap-2 rounded-[8px] border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                          <CheckCircle2 className="h-4 w-4" />
                          Aprobar
                        </button>
                      </form>

                      <form action={deleteFinanceTransactionAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button className="inline-flex items-center gap-2 rounded-[8px] border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                          <Trash2 className="h-4 w-4" />
                          Borrar
                        </button>
                      </form>
                    </div>
                  </div>

                  <details className="mt-4 rounded-[8px] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <summary className="cursor-pointer list-none text-sm font-bold text-slate-700 dark:text-slate-200">
                      <span className="inline-flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        Editar antes de confirmar
                      </span>
                    </summary>

                    <form action={updateFinanceTransactionAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Fecha</span><input className={inputClassName()} type="date" name="date" defaultValue={new Date(item.date).toISOString().slice(0, 10)} /></label>
                      <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Owner</span><select className={selectClassName()} name="owner" defaultValue={item.owner}>{financeOwners.map((currentOwner) => <option key={currentOwner} value={currentOwner}>{financeOwnerLabels[currentOwner]}</option>)}</select></label>
                      <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Tipo</span><select className={selectClassName()} name="type" defaultValue={item.type}>{Object.entries(financeTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                      <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Categoría</span><input className={inputClassName()} name="category" defaultValue={item.category} list="finance-categories" /></label>
                      <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Monto</span><input className={inputClassName()} type="number" step="0.01" name="amount" defaultValue={Number(item.amount)} /></label>
                      <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Status</span><select className={selectClassName()} name="status" defaultValue={item.status}>{Object.entries(financeStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                      <label className="grid gap-1 text-sm md:col-span-2 xl:col-span-3"><span className="text-slate-500 dark:text-slate-300">Descripción</span><input className={inputClassName()} name="description" defaultValue={item.description} /></label>
                      <label className="grid gap-1 text-sm md:col-span-2 xl:col-span-3"><span className="text-slate-500 dark:text-slate-300">Raw message</span><input className={inputClassName()} name="rawMessage" defaultValue={item.rawMessage} /></label>
                      <div className="md:col-span-2 xl:col-span-3">
                        <button className="inline-flex items-center gap-2 rounded-[8px] border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                          <Pencil className="h-4 w-4" />
                          Guardar cambios
                        </button>
                      </div>
                    </form>
                  </details>
                </div>
              ))
            )}
          </div>
        </Panel>
      ) : null}

      {section === "capture" ? (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Registrar movimiento" eyebrow="Dashboard input">
            <form action={createFinanceTransactionAction} className="grid gap-3 md:grid-cols-2">
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Fecha</span><input className={inputClassName()} type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
              <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Owner</span><select className={selectClassName()} name="owner" defaultValue={owner ?? FinanceOwner.LAKJA}>{financeOwners.map((currentOwner) => <option key={currentOwner} value={currentOwner}>{financeOwnerLabels[currentOwner]}</option>)}</select></label>
              <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Tipo</span><select className={selectClassName()} name="type" defaultValue={FinanceTransactionType.EXPENSE}>{Object.entries(financeTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Status</span><select className={selectClassName()} name="status" defaultValue={FinanceTransactionStatus.CONFIRMED}>{Object.entries(financeStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Monto</span><input className={inputClassName()} type="number" step="0.01" name="amount" placeholder="0.00" /></label>
              <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Categoría</span><input className={inputClassName()} name="category" placeholder="comida, viajes, honorarios..." list="finance-categories" /></label>
              <label className="grid gap-1 text-sm md:col-span-2"><span className="text-slate-500 dark:text-slate-300">Descripción</span><input className={inputClassName()} name="description" placeholder="Pago de..." /></label>
              <label className="grid gap-1 text-sm md:col-span-2"><span className="text-slate-500 dark:text-slate-300">Raw message / nota</span><input className={inputClassName()} name="rawMessage" placeholder="Texto libre o mensaje original" /></label>
              <div className="md:col-span-2">
                <button className="inline-flex items-center gap-2 rounded-[8px] border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <PlusCircle className="h-4 w-4" />
                  Registrar movimiento
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="Qué más podemos hacer" eyebrow="Siguiente UX">
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>1. edición tipo hoja de cálculo con guardado inline</p>
              <p>2. reglas visuales para recategorizar y enseñar al sistema</p>
              <p>3. comparativos mes vs mes con variación porcentual</p>
              <p>4. búsqueda global por proveedor, alias o mensaje raw</p>
              <p>5. tags de cuenta origen, método de pago y proyecto</p>
              <p>6. vista móvil más parecida a una app de finanzas</p>
              <p>7. acciones masivas: aprobar, mover owner, borrar duplicados</p>
            </div>
          </Panel>
        </div>
      ) : null}

      {section === "transactions" ? (
        <div className="space-y-4">
          <Panel title="Editor rápido" eyebrow="Descripción y categoría">
            <TransactionBatchEditor
              transactions={visibleTransactions.slice(0, 60).map((item) => ({
                id: item.id,
                date: formatDate(item.date),
                owner: item.owner,
                type: item.type,
                category: item.category,
                description: item.description,
                amount: Number(item.amount),
                currency: item.currency,
                status: item.status
              }))}
              returnTo={returnTo}
              ownerLabels={financeOwnerLabels}
              typeLabels={financeTypeLabels}
              statusLabels={financeStatusLabels}
              key={`${owner ?? "GENERAL"}-${periodKey}-${view}`}
              action={bulkUpdateFinanceTransactionsAction}
            />
          </Panel>

          <Panel title="Edición detallada" eyebrow="Casos especiales">
            <div className="space-y-3">
              {visibleTransactions.slice(0, 20).map((item) => (
                <details key={item.id} className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <summary className="cursor-pointer list-none text-sm font-bold text-slate-700 dark:text-slate-200">
                    <span className="inline-flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      {item.description} · {formatCurrency(Number(item.amount), item.currency)}
                    </span>
                  </summary>

                  <form action={updateFinanceTransactionAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Fecha</span><input className={inputClassName()} type="date" name="date" defaultValue={new Date(item.date).toISOString().slice(0, 10)} /></label>
                    <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Owner</span><select className={selectClassName()} name="owner" defaultValue={item.owner}>{financeOwners.map((currentOwner) => <option key={currentOwner} value={currentOwner}>{financeOwnerLabels[currentOwner]}</option>)}</select></label>
                    <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Tipo</span><select className={selectClassName()} name="type" defaultValue={item.type}>{Object.entries(financeTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Categoría</span><input className={inputClassName()} name="category" defaultValue={item.category} list="finance-categories" /></label>
                    <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Monto</span><input className={inputClassName()} type="number" step="0.01" name="amount" defaultValue={Number(item.amount)} /></label>
                    <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Status</span><select className={selectClassName()} name="status" defaultValue={item.status}>{Object.entries(financeStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Tipo especial</span><select className={selectClassName()} name="specialType" defaultValue={item.specialType ?? ""}><option value="">Sin tipo especial</option>{Object.entries(financeSpecialTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Contraparte</span><input className={inputClassName()} name="counterpartyName" defaultValue={item.counterpartyName ?? ""} /></label>
                    <label className="grid gap-1 text-sm"><span className="text-slate-500 dark:text-slate-300">Alias</span><input className={inputClassName()} name="alias" defaultValue={item.alias ?? ""} /></label>
                    <label className="grid gap-1 text-sm md:col-span-2 xl:col-span-3"><span className="text-slate-500 dark:text-slate-300">Descripción</span><input className={inputClassName()} name="description" defaultValue={item.description} /></label>
                    <label className="grid gap-1 text-sm md:col-span-2 xl:col-span-3"><span className="text-slate-500 dark:text-slate-300">Raw message</span><input className={inputClassName()} name="rawMessage" defaultValue={item.rawMessage} /></label>
                    <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-3">
                      <button className="inline-flex items-center gap-2 rounded-[8px] border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"><Pencil className="h-4 w-4" />Guardar detalle</button>
                    </div>
                  </form>

                  <form action={deleteFinanceTransactionAction} className="mt-3">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button className="inline-flex items-center gap-2 rounded-[8px] border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"><Trash2 className="h-4 w-4" />Eliminar movimiento</button>
                  </form>
                </details>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}

      {section === "settings" ? (
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel title="Categorías" eyebrow="Catálogo editable">
            <div className="space-y-4">
              <form action={createFinanceCategoryAction} className="grid gap-3 rounded-[8px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 dark:border-slate-700 dark:bg-slate-950">
                <input type="hidden" name="returnTo" value={returnTo} />
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Nombre visible</span>
                  <input className={inputClassName()} name="label" placeholder="Ej. Supermercado" />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Slug opcional</span>
                  <input className={inputClassName()} name="slug" placeholder="supermercado" />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Dirección</span>
                  <select className={selectClassName()} name="direction" defaultValue={FinanceCategoryDirection.EXPENSE}>
                    <option value={FinanceCategoryDirection.EXPENSE}>Egreso</option>
                    <option value={FinanceCategoryDirection.INCOME}>Ingreso</option>
                    <option value={FinanceCategoryDirection.SPECIAL}>Especial</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Owner</span>
                  <select className={selectClassName()} name="owner" defaultValue="">
                    <option value="">General</option>
                    {financeOwners.map((currentOwner) => (
                      <option key={currentOwner} value={currentOwner}>
                        {financeOwnerLabels[currentOwner]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Color</span>
                  <input className={inputClassName()} name="color" placeholder="#10b981" />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Icono</span>
                  <input className={inputClassName()} name="icon" placeholder="wallet, car, gift..." />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Orden</span>
                  <input className={inputClassName()} type="number" name="sortOrder" defaultValue="0" />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Activa</span>
                  <select className={selectClassName()} name="isActive" defaultValue="true">
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm md:col-span-2">
                  <span className="text-slate-500 dark:text-slate-300">Descripción</span>
                  <input className={inputClassName()} name="description" placeholder="Para compras del súper, comida del hogar, etc." />
                </label>
                <div className="md:col-span-2">
                  <button className="inline-flex items-center gap-2 rounded-[8px] border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <PlusCircle className="h-4 w-4" />
                    Crear o actualizar por slug
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {categories.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-300">Todavía no hay categorías administradas.</p>
                ) : (
                  categories.map((category) => (
                    <details key={category.id} className="rounded-[8px] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <FinanceBadge label={category.label} tone="slate" />
                          <FinanceBadge label={categoryDirectionLabel(category.direction)} tone={categoryDirectionTone(category.direction)} />
                          <FinanceBadge label={category.owner ? financeOwnerLabels[category.owner] : "General"} tone="sky" />
                          <FinanceBadge label={category.isActive ? "Activa" : "Inactiva"} tone={category.isActive ? "emerald" : "amber"} />
                        </div>
                        <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">{category.slug}</span>
                      </summary>

                      <form action={updateFinanceCategoryAction} className="mt-4 grid gap-3 md:grid-cols-2">
                        <input type="hidden" name="id" value={category.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <label className="grid gap-1 text-sm">
                          <span className="text-slate-500 dark:text-slate-300">Nombre visible</span>
                          <input className={inputClassName()} name="label" defaultValue={category.label} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span className="text-slate-500 dark:text-slate-300">Slug</span>
                          <input className={inputClassName()} name="slug" defaultValue={category.slug} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span className="text-slate-500 dark:text-slate-300">Dirección</span>
                          <select className={selectClassName()} name="direction" defaultValue={category.direction}>
                            <option value={FinanceCategoryDirection.EXPENSE}>Egreso</option>
                            <option value={FinanceCategoryDirection.INCOME}>Ingreso</option>
                            <option value={FinanceCategoryDirection.SPECIAL}>Especial</option>
                          </select>
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span className="text-slate-500 dark:text-slate-300">Owner</span>
                          <select className={selectClassName()} name="owner" defaultValue={category.owner ?? ""}>
                            <option value="">General</option>
                            {financeOwners.map((currentOwner) => (
                              <option key={currentOwner} value={currentOwner}>
                                {financeOwnerLabels[currentOwner]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span className="text-slate-500 dark:text-slate-300">Color</span>
                          <input className={inputClassName()} name="color" defaultValue={category.color ?? ""} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span className="text-slate-500 dark:text-slate-300">Icono</span>
                          <input className={inputClassName()} name="icon" defaultValue={category.icon ?? ""} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span className="text-slate-500 dark:text-slate-300">Orden</span>
                          <input className={inputClassName()} type="number" name="sortOrder" defaultValue={category.sortOrder} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span className="text-slate-500 dark:text-slate-300">Activa</span>
                          <select className={selectClassName()} name="isActive" defaultValue={String(category.isActive)}>
                            <option value="true">Sí</option>
                            <option value="false">No</option>
                          </select>
                        </label>
                        <label className="grid gap-1 text-sm md:col-span-2">
                          <span className="text-slate-500 dark:text-slate-300">Descripción</span>
                          <input className={inputClassName()} name="description" defaultValue={category.description ?? ""} />
                        </label>
                        <div className="md:col-span-2">
                          <button className="inline-flex items-center gap-2 rounded-[8px] border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                            <Pencil className="h-4 w-4" />
                            Guardar categoría
                          </button>
                        </div>
                      </form>
                    </details>
                  ))
                )}
              </div>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel title="Mensajes de Telegram" eyebrow="Plantillas editables">
              <form action={updateFinanceTelegramTemplatesAction} className="space-y-3">
                <input type="hidden" name="returnTo" value={returnTo} />
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Variables disponibles: <code>{"{amount}"}</code>, <code>{"{description}"}</code>, <code>{"{ownerLabel}"}</code>, <code>{"{periodLabel}"}</code>.
                </p>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Movimiento default</span>
                  <textarea className={inputClassName()} name="transactionDefaultTemplate" rows={3} defaultValue={botSettings.transactionDefaultTemplate} />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Gasto LaKja</span>
                  <textarea className={inputClassName()} name="transactionLakjaExpenseTemplate" rows={3} defaultValue={botSettings.transactionLakjaExpenseTemplate} />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Honorarios Kjalil</span>
                  <textarea className={inputClassName()} name="transactionHonorariosKjalilTemplate" rows={2} defaultValue={botSettings.transactionHonorariosKjalilTemplate} />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Honorarios terceros</span>
                  <textarea className={inputClassName()} name="transactionHonorariosTercerosTemplate" rows={2} defaultValue={botSettings.transactionHonorariosTercerosTemplate} />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Encabezado reporte</span>
                  <textarea className={inputClassName()} name="reportHeaderTemplate" rows={3} defaultValue={botSettings.reportHeaderTemplate} />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Pie de reporte</span>
                  <textarea className={inputClassName()} name="reportFooterTemplate" rows={3} defaultValue={botSettings.reportFooterTemplate ?? ""} />
                </label>
                <button className="inline-flex items-center gap-2 rounded-[8px] border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <Settings2 className="h-4 w-4" />
                  Guardar plantillas
                </button>
              </form>
            </Panel>

            <Panel title="Fusionar categorías" eyebrow="Mover histórico">
              <form action={mergeFinanceCategoryAction} className="space-y-3">
                <input type="hidden" name="returnTo" value={returnTo} />
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Esto mueve transacciones históricas y memory rules de una categoría a otra, y desactiva la anterior.
                </p>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Desde</span>
                  <input className={inputClassName()} name="fromCategory" list="finance-categories" placeholder="Ej. Ocio" />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Hacia</span>
                  <input className={inputClassName()} name="toCategory" list="finance-categories" placeholder="Ej. Entretenimiento" />
                </label>
                <button className="inline-flex items-center gap-2 rounded-[8px] border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <ArrowRightLeft className="h-4 w-4" />
                  Fusionar categoría
                </button>
              </form>
            </Panel>

            <Panel title="Qué haría después" eyebrow="Para eficientar clasificación">
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>1. convertir categorías libres a select dependiente por tipo y owner</p>
                <p>2. crear reglas desde una transacción: proveedor - categoría - owner - alias</p>
                <p>3. separar subcategoría y categoría contable para mejores reportes</p>
                <p>4. permitir fusionar categorías y mover histórico completo en una sola acción</p>
                <p>5. mostrar sugerencia IA al lado de la categoría real para auditar aciertos y errores</p>
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      <Panel title="Ideas de siguiente fase" eyebrow="Qué más haría yo">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Sparkles, title: "Reglas aprendidas", body: "convertir correcciones manuales en memory rules desde UI" },
            { icon: BarChart3, title: "Comparativo mes a mes", body: "variación absoluta y porcentual por owner y categoría" },
            { icon: ScanSearch, title: "Búsqueda inteligente", body: "filtro por proveedor, texto raw, alias o rango de monto" },
            { icon: ClipboardList, title: "Acciones masivas", body: "aprobar, mover owner, recategorizar y borrar duplicados por lote" }
          ].map((item) => (
            <div key={item.title} className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <item.icon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              <p className="mt-3 font-black text-slate-950 dark:text-white">{item.title}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{item.body}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
