"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { label: "Coberturas", href: "/ccc" },
  { label: "Staff", href: "/ccc/staff" },
  { label: "Admin", href: "/ccc/admin" }
];

export function CCCSubnav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/ccc" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "border-lime-300 bg-lime-50 text-lime-800 dark:border-lime-400/40 dark:bg-lime-500/12 dark:text-lime-300"
                : "border-slate-200 bg-white text-slate-500 hover:border-lime-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-lime-400 dark:hover:text-white"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
