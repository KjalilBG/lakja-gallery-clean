"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { siteConfig } from "@/lib/config/site";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAppFotos = pathname?.startsWith("/appfotos");
  const navItems = siteConfig.nav.filter((item) => (item.href === "/appfotos/admin" ? isAppFotos : true));

  return (
    <header
      className={
        isHome
          ? "relative z-20 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:flex-row md:items-center md:justify-between md:px-4"
          : "relative z-20 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:flex-row md:items-center md:justify-between md:gap-4 md:rounded-[28px] md:px-5 md:py-4"
      }
    >
      <Logo />
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 md:gap-3">
        <ThemeToggle />
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 md:gap-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              isHome
                ? "rounded-full border border-slate-200 px-3 py-2 text-xs transition hover:border-slate-300 hover:text-slate-900 md:px-4 md:text-sm"
                : "rounded-full border border-slate-200 px-3 py-2 text-xs transition hover:border-slate-300 hover:text-slate-900 md:px-4 md:text-sm"
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
