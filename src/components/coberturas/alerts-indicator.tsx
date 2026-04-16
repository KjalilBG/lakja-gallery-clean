import type { CoverageAlert } from "@/lib/alerts";
import { cn } from "@/lib/utils";

export function AlertsIndicator({ alerts }: { alerts: CoverageAlert[] }) {
  if (alerts.length === 0) {
    return <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Sin alertas</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {alerts.map((alert) => (
        <span
          key={alert.type}
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em]",
            alert.tone === "red" && "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-300",
            alert.tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-300",
            alert.tone === "slate" && "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          )}
        >
          {alert.label}
        </span>
      ))}
    </div>
  );
}
