import { createCampusAction, createLugarAction, createSeccionAction } from "@/app/catalogos/actions";
import { CatalogAdminPanel } from "@/components/coberturas/catalog-admin-panel";
import { HonorariosAdminPanel } from "@/components/coberturas/honorarios-admin-panel";
import { StaffAdminPanel } from "@/components/coberturas/staff-admin-panel";
import { requireAdminSession } from "@/lib/auth-guard";
import { getCatalogWorkspace } from "@/lib/catalogos";
import { getHonorariosWorkspace } from "@/lib/honorarios";
import { getStaffAdminWorkspace } from "@/lib/staff-admin";

export const dynamic = "force-dynamic";

export default async function CCCAdminPage() {
  await requireAdminSession("/ccc/admin");
  const [staff, catalogs, honorarios] = await Promise.all([getStaffAdminWorkspace(), getCatalogWorkspace(), getHonorariosWorkspace()]);

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">CCC / Admin</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Configuración operativa</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Todo lo que solo toca admin vive aquí: staff, catálogos y honorarios.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="#staff" className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Staff</a>
          <a href="#catalogos" className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Catálogos</a>
          <a href="#honorarios" className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Honorarios</a>
        </div>
      </section>

      <details id="staff" open className="rounded-[20px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="cursor-pointer list-none px-4 py-3">
          <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Staff</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{staff.length} personas</p>
        </summary>
        <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
          <StaffAdminPanel staff={staff} />
        </div>
      </details>

      <details id="catalogos" className="rounded-[20px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="cursor-pointer list-none px-4 py-3">
          <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Catálogos</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{catalogs.campus.length} campus · {catalogs.secciones.length} secciones · {catalogs.lugares.length} lugares</p>
        </summary>
        <div className="space-y-4 border-t border-slate-200 px-4 py-4 dark:border-slate-800">
          <section className="grid gap-4 xl:grid-cols-3">
            <form action={createCampusAction} className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Nuevo campus</p>
              <div className="mt-3 flex gap-2">
                <input name="nombre" placeholder="Nombre campus" className="min-w-0 flex-1 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                <button className="rounded-full bg-lime-500 px-4 py-2 text-sm font-semibold text-white">Agregar</button>
              </div>
            </form>

            <form action={createSeccionAction} className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Nueva sección</p>
              <div className="mt-3 flex gap-2">
                <input name="nombre" placeholder="Nombre sección" className="min-w-0 flex-1 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                <button className="rounded-full bg-lime-500 px-4 py-2 text-sm font-semibold text-white">Agregar</button>
              </div>
            </form>

            <form action={createLugarAction} className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Nuevo lugar</p>
              <div className="mt-3 grid gap-2">
                <input name="nombre" placeholder="Nombre lugar" className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                <div className="flex gap-2">
                  <select name="campusId" className="min-w-0 flex-1 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900">
                    <option value="">General</option>
                    {catalogs.campus.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                  </select>
                  <button className="rounded-full bg-lime-500 px-4 py-2 text-sm font-semibold text-white">Agregar</button>
                </div>
              </div>
            </form>
          </section>

          <CatalogAdminPanel workspace={catalogs} />
        </div>
      </details>

      <details id="honorarios" className="rounded-[20px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="cursor-pointer list-none px-4 py-3">
          <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Honorarios</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{honorarios.length} personas</p>
        </summary>
        <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
          <HonorariosAdminPanel staff={honorarios} />
        </div>
      </details>
    </div>
  );
}
