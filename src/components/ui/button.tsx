import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: "primary" | "secondary" | "ghost" | "pink";
};

export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold uppercase tracking-[0.16em] transition duration-200",
        variant === "primary" &&
          "bg-lime-500 text-white shadow-[0_12px_26px_rgba(101,163,13,0.28)] hover:bg-lime-600",
        variant === "pink" &&
          "bg-fuchsia-500 text-white shadow-[0_14px_26px_rgba(217,70,239,0.26)] hover:bg-fuchsia-600",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-700 hover:border-lime-300 hover:text-slate-900",
        variant === "ghost" && "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
