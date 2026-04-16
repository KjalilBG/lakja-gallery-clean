import { CoverageRow } from "@/components/coberturas/coverage-row";
import type { CoverageAlert } from "@/lib/alerts";

type CoverageTableProps = {
  rows: Array<{
    id: string;
    folio: number;
    nombre: string;
    fecha: string;
    horaInicio: string;
    duracion: number;
    carpetaNombre: string;
    comentarios: string;
    detalles: string;
    estatus: "AGENDADO" | "SOLICITADO" | "REALIZADO" | "CANCELADO";
    campusId: string;
    seccionId: string;
    lugarId: string;
    campusNombre: string;
    seccionNombre: string;
    lugarNombre: string;
    staff: Array<{ id: string; nombre: string; isLead: boolean }>;
    alerts: CoverageAlert[];
  }>;
  catalogs: {
    campus: Array<{ id: string; label: string }>;
    secciones: Array<{ id: string; label: string }>;
    lugares: Array<{ id: string; label: string }>;
    staff: Array<{ id: string; label: string; role: string }>;
  };
  canEdit: boolean;
};

export function CoverageTable({ rows, catalogs, canEdit }: CoverageTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">No hay coberturas para este mes.</p>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">Empieza con una captura rápida y este tablero se convertirá en tu mesa operativa diaria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div>
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">Coberturas del mes</h3>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">Editar abre un panel claro debajo de la fila.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/80">
            <tr className="text-left text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cobertura</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((coverage) => (
              <CoverageRow key={coverage.id} coverage={coverage} catalogs={catalogs} canEdit={canEdit} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
