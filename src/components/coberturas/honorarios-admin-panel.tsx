import { addHonorarioRuleAction, removeHonorarioRuleAction, saveHonorarioAction, updateHonorarioRuleAction } from "@/app/honorarios/actions";

type HonorariosAdminPanelProps = {
  staff: Array<{
    id: string;
    nombre: string;
    role: string;
    isActive: boolean;
    honorario: {
      id: string;
      paymentType: string;
      costoHora: string;
      transporte: string;
      reglaIguala1a2: string;
      reglaIguala3a4: string;
      reglaIguala5Plus: string;
      rules: Array<{
        id: string;
        label: string;
        desdeHoras: string;
        hastaHoras: string;
        montoFijo: string;
        costoHora: string;
        transporte: string;
        sortOrder: number;
      }>;
    } | null;
  }>;
};

export function HonorariosAdminPanel({ staff }: HonorariosAdminPanelProps) {
  return (
    <div className="space-y-3">
      {staff.map((person) => (
        <details key={person.id} className="rounded-[20px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <summary className="cursor-pointer list-none px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{person.nombre}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {person.role} · {person.honorario?.rules.length ?? 0} reglas · {person.isActive ? "Activo" : "Inactivo"}
                </p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {person.honorario?.paymentType ?? "Sin configurar"}
              </div>
            </div>
          </summary>

          <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
            <form action={saveHonorarioAction} className="grid gap-3 md:grid-cols-6">
              <input type="hidden" name="userId" value={person.id} />
              <select name="paymentType" defaultValue={person.honorario?.paymentType ?? "HOURLY"} className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80">
                <option value="HOURLY">Por hora</option>
                <option value="FLAT">Fijo</option>
                <option value="MIXED">Mixto</option>
              </select>
              <input name="costoHora" defaultValue={person.honorario?.costoHora ?? ""} placeholder="Costo hora" className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
              <input name="transporte" defaultValue={person.honorario?.transporte ?? ""} placeholder="Transporte" className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
              <input name="reglaIguala1a2" defaultValue={person.honorario?.reglaIguala1a2 ?? ""} placeholder="1-2h" className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
              <input name="reglaIguala3a4" defaultValue={person.honorario?.reglaIguala3a4 ?? ""} placeholder="3-4h" className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
              <div className="flex gap-2">
                <input name="reglaIguala5Plus" defaultValue={person.honorario?.reglaIguala5Plus ?? ""} placeholder="5h+" className="min-w-0 flex-1 rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
                <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">Guardar</button>
              </div>
            </form>

            <div className="mt-4 space-y-2">
              {(person.honorario?.rules ?? []).map((rule) => (
                <form key={rule.id} action={updateHonorarioRuleAction} className="grid gap-2 rounded-[16px] border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1.1fr_repeat(5,minmax(80px,1fr))_auto] dark:border-slate-700 dark:bg-slate-800/60">
                  <input type="hidden" name="id" value={rule.id} />
                  <input name="label" defaultValue={rule.label} placeholder="Etiqueta" className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                  <input name="desdeHoras" defaultValue={rule.desdeHoras} placeholder="Desde" className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                  <input name="hastaHoras" defaultValue={rule.hastaHoras} placeholder="Hasta" className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                  <input name="montoFijo" defaultValue={rule.montoFijo} placeholder="Monto" className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                  <input name="costoHora" defaultValue={rule.costoHora} placeholder="Hora" className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                  <input name="transporte" defaultValue={rule.transporte} placeholder="Transporte" className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                  <input type="hidden" name="sortOrder" value={rule.sortOrder} />
                  <div className="flex gap-2">
                    <button className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">Guardar</button>
                    <button formAction={removeHonorarioRuleAction} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-300">Quitar</button>
                  </div>
                </form>
              ))}

              <form action={addHonorarioRuleAction} className="grid gap-2 rounded-[16px] border border-dashed border-slate-300 p-3 md:grid-cols-[1.1fr_repeat(5,minmax(80px,1fr))_auto] dark:border-slate-700">
                <input type="hidden" name="userId" value={person.id} />
                <input name="label" placeholder="Nueva regla" className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                <input name="desdeHoras" placeholder="Desde" className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                <input name="hastaHoras" placeholder="Hasta" className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                <input name="montoFijo" placeholder="Monto" className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                <input name="costoHora" placeholder="Hora" className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                <input name="transporte" placeholder="Transporte" className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                <button className="rounded-full bg-lime-500 px-3 py-2 text-xs font-semibold text-white">Agregar</button>
              </form>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
