import { getAdminNavStats } from "@/lib/albums";
import { getServerAuthSession, isSuperAdminEmail } from "@/lib/auth";
import { requireAdminSession } from "@/lib/auth-guard";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { LogoMark } from "@/components/ui/logo";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdminSession("/admin");
  const [session, stats] = await Promise.all([getServerAuthSession(), getAdminNavStats()]);
  const isSuperAdmin = isSuperAdminEmail(session?.user?.email);
  const adminNav = [
    { label: "Resumen", href: "/admin" },
    { label: "Albumes", href: "/admin/albums", badge: stats.draftAlbums > 0 ? String(stats.draftAlbums) : null },
    { label: "Nuevo album", href: "/admin/albums/new" },
    ...(isSuperAdmin
      ? [{ label: "Sitio", href: "/admin/site", badge: stats.pendingSelections > 0 ? String(stats.pendingSelections) : null }]
      : [])
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
      <aside className="rounded-[34px] border border-white/80 bg-white/90 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)] backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/92 dark:shadow-[0_18px_40px_rgba(2,6,23,0.45)] lg:sticky lg:top-24 lg:h-fit">
        <div className="flex items-center justify-between gap-3">
          <LogoMark className="h-[58px] w-[58px]" />
          <span className="inline-flex rounded-full bg-lime-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.28em] text-lime-700 dark:bg-lime-500/12 dark:text-lime-300">
            Admin
          </span>
        </div>
        <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/80">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Atajo</p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-700 dark:text-slate-100">
            {isSuperAdmin ? "Administra entregas y marca desde un solo panel." : "Administra entregas y retoma rápido el trabajo del día."}
          </p>
        </div>
        <AdminSidebarNav items={adminNav} />
        <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Sesion</p>
          <p className="mt-2 truncate text-sm font-bold text-slate-900 dark:text-white">{session?.user?.email ?? "Admin"}</p>
          <div className="mt-4">
            <AdminSignOutButton />
          </div>
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}
