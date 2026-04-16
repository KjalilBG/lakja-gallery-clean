import { CoberturaStatus } from "@prisma/client";

import { BulkUploadParser } from "@/components/coberturas/bulk-upload-parser";
import { CoverageTable } from "@/components/coberturas/coverage-table";
import { FiltersBar } from "@/components/coberturas/filters-bar";
import { QuickCreateCoverageForm } from "@/components/coberturas/quick-create-coverage-form";
import { requireStaffSession } from "@/lib/auth-guard";
import { getCoverageWorkspace } from "@/lib/coberturas";

export const dynamic = "force-dynamic";

function monthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00.000Z`);
  return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export default async function CCCPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string; search?: string; status?: string }>;
}) {
  const session = await requireStaffSession("/ccc");
  const params = (await searchParams) ?? {};
  const currentMonth = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : new Date().toISOString().slice(0, 7);
  const currentStatus =
    params.status && (params.status === "ALL" || Object.values(CoberturaStatus).includes(params.status as CoberturaStatus)) ? params.status : "ALL";
  const workspace = await getCoverageWorkspace(new Date(`${currentMonth}-01T00:00:00.000Z`), params.search ?? "", currentStatus as CoberturaStatus | "ALL");
  const canEdit = session.user.role === "ADMIN";
  const today = new Date().toISOString().slice(0, 10);
  const todayRows = workspace.rows.filter((row) => row.fecha.slice(0, 10) === today);
  const overdueCount = workspace.rows.filter((row) => row.alerts.some((alert) => alert.type === "vencida")).length;
  const noStaffCount = workspace.rows.filter((row) => row.staff.length === 0).length;

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">CCC / Coberturas</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Mesa operativa</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Lee todo el mes de un vistazo y abre una fila para editarla con claridad.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.12em]">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{workspace.rows.length} del mes</span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/12 dark:text-sky-300">{todayRows.length} hoy</span>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-300">{overdueCount} vencidas</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-300">{noStaffCount} sin staff</span>
          </div>
        </div>
      </section>

      <FiltersBar currentMonth={currentMonth} monthLabel={monthLabel(currentMonth)} search={params.search ?? ""} status={currentStatus} />
      <section className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <span className="font-semibold text-slate-900 dark:text-white">{workspace.summary.total}</span> total ·{" "}
        <span className="font-semibold text-sky-700 dark:text-sky-300">{workspace.summary.agendadas}</span> agendadas ·{" "}
        <span className="font-semibold text-amber-700 dark:text-amber-300">{workspace.summary.solicitadas}</span> solicitadas ·{" "}
        <span className="font-semibold text-lime-700 dark:text-lime-300">{workspace.summary.realizadas}</span> realizadas ·{" "}
        <span className="font-semibold text-slate-600 dark:text-slate-300">{workspace.summary.canceladas}</span> canceladas ·{" "}
        <span className="font-semibold text-rose-700 dark:text-rose-300">{workspace.summary.vencidas}</span> vencidas
      </section>
      <CoverageTable rows={workspace.rows} catalogs={workspace.catalogs} canEdit={canEdit} />

      {canEdit ? (
        <section id="nueva-cobertura" className="space-y-4">
          <details className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-black text-slate-900 dark:text-white">
              Nueva cobertura
              <span className="ml-2 text-xs font-medium text-slate-400 dark:text-slate-500">Captura rápida</span>
            </summary>
            <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
              <QuickCreateCoverageForm catalogs={workspace.catalogs} />
            </div>
          </details>

          <details className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-black text-slate-900 dark:text-white">
              Carga masiva
              <span className="ml-2 text-xs font-medium text-slate-400 dark:text-slate-500">Pegar varias líneas</span>
            </summary>
            <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
              <BulkUploadParser
                campusOptions={workspace.catalogs.campus}
                seccionOptions={workspace.catalogs.secciones}
                staffOptions={workspace.catalogs.staff.map((item) => ({ id: item.id, label: item.label }))}
              />
            </div>
          </details>
        </section>
      ) : null}
    </div>
  );
}
