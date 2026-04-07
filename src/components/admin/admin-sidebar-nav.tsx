"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type AdminNavItem = {
  label: string;
  href: string;
  badge?: string | null;
};

type AdminSidebarNavProps = {
  items: AdminNavItem[];
};

function isItemActive(pathname: string, href: string) {
  if (href === "/appfotos/admin") {
    return pathname === "/appfotos/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav({ items }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mt-6 space-y-3">
      {items.map((item) => {
        const active = isItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] transition",
              active
                ? "border-lime-300 bg-lime-50 text-slate-900 shadow-[0_10px_24px_rgba(132,204,22,0.12)] dark:border-lime-400/40 dark:bg-lime-500/12 dark:text-white"
                : "border-slate-200 text-slate-500 hover:border-lime-300 hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-lime-400 dark:hover:bg-slate-800 dark:hover:text-white"
            )}
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span
                className={cn(
                  "inline-flex min-w-7 items-center justify-center rounded-full px-2 py-1 text-[10px] font-extrabold tracking-[0.1em]",
                  active
                    ? "bg-white/90 text-lime-700 dark:bg-slate-950/70 dark:text-lime-300"
                    : "bg-lime-50 text-lime-700 dark:bg-lime-500/12 dark:text-lime-300"
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
