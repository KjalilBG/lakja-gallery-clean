"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { siteConfig } from "@/lib/config/site";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={
        isHome
          ? "relative z-20 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:flex-row md:items-center md:justify-between md:px-4"
          : "sticky top-3 z-20 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:top-5 md:flex-row md:items-center md:justify-between md:gap-4 md:rounded-[28px] md:px-5 md:py-4"
      }
    >
      <Logo />
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 md:gap-3">
        <ThemeToggle />
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 md:gap-3">
        {siteConfig.nav.map((item) => (
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
