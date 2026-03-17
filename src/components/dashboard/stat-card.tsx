type StatCardProps = {
  label: string;
  value: string;
  hint: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-slate-400">{label}</p>
      <p className="mt-4 text-4xl font-black text-slate-900">{value}</p>
      <div className="mt-4 h-1.5 w-14 rounded-full bg-gradient-to-r from-amber-400 to-lime-500" />
      <p className="mt-4 text-sm leading-6 text-slate-500">{hint}</p>
    </div>
  );
}
