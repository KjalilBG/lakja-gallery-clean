import { CCCSubnav } from "@/components/coberturas/ccc-subnav";

export default function CCCLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Calendario de Coberturas CCC</h2>
          </div>
          <CCCSubnav />
        </div>
      </section>
      {children}
    </div>
  );
}
