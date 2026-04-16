import { moveCampusAction, moveLugarAction, moveSeccionAction, updateCampusAction, updateLugarAction, updateSeccionAction } from "@/app/catalogos/actions";

type Props = {
  workspace: {
    campus: Array<{ id: string; nombre: string; slug: string; sortOrder: number; isActive: boolean; _count: { coberturas: number; lugares: number } }>;
    secciones: Array<{ id: string; nombre: string; slug: string; sortOrder: number; isActive: boolean; _count: { coberturas: number } }>;
    lugares: Array<{ id: string; nombre: string; slug: string; sortOrder: number; isActive: boolean; campusId: string | null; campus: { nombre: string } | null; _count: { coberturas: number } }>;
  };
};

function MoveButtons({ id, onUp, onDown }: { id: string; onUp: (formData: FormData) => Promise<void>; onDown: (formData: FormData) => Promise<void> }) {
  return (
    <div className="flex gap-1">
      <form action={onUp}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="up" />
        <button className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">↑</button>
      </form>
      <form action={onDown}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="down" />
        <button className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">↓</button>
      </form>
    </div>
  );
}

export function CatalogAdminPanel({ workspace }: Props) {
  return (
    <div className="space-y-3">
      <details open className="rounded-[20px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-slate-900 dark:text-white">Campus</summary>
        <div className="border-t border-slate-200 dark:border-slate-800">
          {workspace.campus.map((item) => (
            <form key={item.id} action={updateCampusAction} className="grid gap-3 border-t border-slate-100 px-4 py-3 md:grid-cols-[minmax(0,1fr)_120px_110px_90px_auto] md:items-center dark:border-slate-800">
              <input type="hidden" name="id" value={item.id} />
              <input name="nombre" defaultValue={item.nombre} className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
              <span className="text-xs text-slate-400 dark:text-slate-500">{item._count.lugares} lugares</span>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" name="isActive" defaultChecked={item.isActive} />
                Activo
              </label>
              <input type="hidden" name="sortOrder" value={item.sortOrder} />
              <MoveButtons id={item.id} onUp={moveCampusAction} onDown={moveCampusAction} />
              <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">Guardar</button>
            </form>
          ))}
        </div>
      </details>

      <details className="rounded-[20px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-slate-900 dark:text-white">Secciones</summary>
        <div className="border-t border-slate-200 dark:border-slate-800">
          {workspace.secciones.map((item) => (
            <form key={item.id} action={updateSeccionAction} className="grid gap-3 border-t border-slate-100 px-4 py-3 md:grid-cols-[minmax(0,1fr)_120px_110px_90px_auto] md:items-center dark:border-slate-800">
              <input type="hidden" name="id" value={item.id} />
              <input name="nombre" defaultValue={item.nombre} className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
              <span className="text-xs text-slate-400 dark:text-slate-500">{item._count.coberturas} cob.</span>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" name="isActive" defaultChecked={item.isActive} />
                Activa
              </label>
              <input type="hidden" name="sortOrder" value={item.sortOrder} />
              <MoveButtons id={item.id} onUp={moveSeccionAction} onDown={moveSeccionAction} />
              <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">Guardar</button>
            </form>
          ))}
        </div>
      </details>

      <details className="rounded-[20px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-slate-900 dark:text-white">Lugares</summary>
        <div className="border-t border-slate-200 dark:border-slate-800">
          {workspace.lugares.map((item) => (
            <form key={item.id} action={updateLugarAction} className="grid gap-3 border-t border-slate-100 px-4 py-3 md:grid-cols-[minmax(0,1fr)_180px_110px_90px_auto] md:items-center dark:border-slate-800">
              <input type="hidden" name="id" value={item.id} />
              <input name="nombre" defaultValue={item.nombre} className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
              <select name="campusId" defaultValue={item.campusId ?? ""} className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80">
                <option value="">General</option>
                {workspace.campus.map((campus) => <option key={campus.id} value={campus.id}>{campus.nombre}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" name="isActive" defaultChecked={item.isActive} />
                Activo
              </label>
              <input type="hidden" name="sortOrder" value={item.sortOrder} />
              <MoveButtons id={item.id} onUp={moveLugarAction} onDown={moveLugarAction} />
              <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">Guardar</button>
            </form>
          ))}
        </div>
      </details>
    </div>
  );
}
