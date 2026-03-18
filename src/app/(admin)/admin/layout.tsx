import Link from "next/link";

import { getServerAuthSession, isSuperAdminEmail } from "@/lib/auth";
import { requireAdminSession } from "@/lib/auth-guard";
import { LogoMark } from "@/components/ui/logo";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdminSession("/admin");
  const session = await getServerAuthSession();
  const isSuperAdmin = isSuperAdminEmail(session?.user?.email);
  const adminNav = [
    { label: "Resumen", href: "/admin" },
    { label: "Albumes", href: "/admin/albums" },
    { label: "Nuevo album", href: "/admin/albums/new" },
    ...(isSuperAdmin ? [{ label: "Sitio", href: "/admin/site" }] : [])
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
      <aside className="rounded-[34px] border border-white/80 bg-white/90 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)] backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/92 dark:shadow-[0_18px_40px_rgba(2,6,23,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <LogoMark className="h-[58px] w-[58px]" />
          <span className="inline-flex rounded-full bg-lime-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.28em] text-lime-700 dark:bg-lime-500/12 dark:text-lime-300">
            Admin
          </span>
        </div>
        <nav className="mt-6 space-y-3">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-500 transition hover:border-lime-300 hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-lime-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
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
