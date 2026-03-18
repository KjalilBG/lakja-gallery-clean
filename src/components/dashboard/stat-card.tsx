type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  accent?: "lime" | "amber" | "sky" | "pink";
};

const accentClassMap = {
  lime: "from-lime-400 to-emerald-500",
  amber: "from-amber-400 to-orange-500",
  sky: "from-sky-400 to-cyan-500",
  pink: "from-fuchsia-400 to-pink-500"
} as const;

export function StatCard({ label, value, hint, accent = "lime" }: StatCardProps) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_40px_rgba(2,6,23,0.35)]">
      <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-4 text-4xl font-black text-slate-900 dark:text-white">{value}</p>
      <div className={`mt-4 h-1.5 w-14 rounded-full bg-gradient-to-r ${accentClassMap[accent]}`} />
      <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-300">{hint}</p>
    </div>
  );
}
