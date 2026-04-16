type MonthlySummaryProps = {
  summary: {
    total: number;
    agendadas: number;
    solicitadas: number;
    realizadas: number;
    canceladas: number;
    vencidas: number;
  };
};

const items = [
  { key: "total", label: "Total", tone: "text-slate-900 dark:text-white" },
  { key: "agendadas", label: "Agendadas", tone: "text-sky-700 dark:text-sky-300" },
  { key: "solicitadas", label: "Solicitadas", tone: "text-amber-700 dark:text-amber-300" },
  { key: "realizadas", label: "Realizadas", tone: "text-lime-700 dark:text-lime-300" },
  { key: "canceladas", label: "Canceladas", tone: "text-slate-600 dark:text-slate-300" },
  { key: "vencidas", label: "Vencidas", tone: "text-rose-700 dark:text-rose-300" }
] as const;

export function MonthlySummary({ summary }: MonthlySummaryProps) {
  return (
    <section className="grid gap-3 md:grid-cols-6">
      {items.map((item) => (
        <article key={item.key} className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-900">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">{item.label}</p>
          <p className={`mt-1 text-xl font-black tracking-tight ${item.tone}`}>{summary[item.key]}</p>
        </article>
      ))}
    </section>
  );
}
