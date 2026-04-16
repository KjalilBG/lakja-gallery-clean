import Link from "next/link";

import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getServerAuthSession } from "@/lib/auth";
import { siteConfig } from "@/lib/config/site";

export async function SiteHeader() {
  const session = await getServerAuthSession();
  const canSeePrivateApps = Boolean(session?.user?.role);
  const navItems = canSeePrivateApps ? siteConfig.nav.filter((item) => item.href !== "/appfotos") : siteConfig.nav;

  return (
    <header
      className="relative z-20 flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:flex-row md:items-center md:justify-between md:gap-4 md:px-5 md:py-4"
    >
      <Logo />
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 md:gap-3">
        <ThemeToggle />
        {canSeePrivateApps ? (
          <details className="relative">
            <summary className="list-none cursor-pointer rounded-full border border-slate-200 px-3 py-2 text-xs transition hover:border-slate-300 hover:text-slate-900 md:px-4 md:text-sm">
              Apps
            </summary>
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
              <div className="p-2">
                <Link href="/appfotos/admin" className="block rounded-[14px] px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  AppFotos
                </Link>
                <Link href="/links" className="block rounded-[14px] px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Links
                </Link>
              </div>
            </div>
          </details>
        ) : null}
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 md:gap-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              "rounded-full border border-slate-200 px-3 py-2 text-xs transition hover:border-slate-300 hover:text-slate-900 md:px-4 md:text-sm"
            }
          >
            {item.label}
          </Link>
        ))}
        </nav>
      </div>
    </header>
  );
}
