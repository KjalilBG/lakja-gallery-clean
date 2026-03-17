"use client";

import { useEffect, useState } from "react";

import { LogoMark } from "@/components/ui/logo";

export function IntroSplash() {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => setIsClosing(true), 1400);
    const hideTimer = window.setTimeout(() => setIsVisible(false), 2000);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[120] flex items-center justify-center bg-white transition-all duration-700 ease-out ${
        isClosing ? "opacity-0 blur-[2px]" : "opacity-100 blur-0"
      }`}
    >
      <div className="relative flex flex-col items-center gap-5">
        <div className="absolute inset-0 -z-10 scale-[1.6] rounded-full bg-[radial-gradient(circle,rgba(132,204,22,0.14),rgba(255,255,255,0)_68%)] blur-2xl" />
        <div
          className={`transition-all duration-700 ease-out ${
            isClosing ? "translate-y-3 scale-[0.94] opacity-0 blur-[8px]" : "animate-[floatLogo_2.4s_ease-in-out_infinite]"
          }`}
        >
          <LogoMark className="h-[132px] w-[132px] md:h-[152px] md:w-[152px]" />
        </div>
        <p
          className={`text-xs font-extrabold uppercase tracking-[0.42em] text-slate-400 transition-all duration-700 ease-out ${
            isClosing ? "translate-y-2 opacity-0 blur-[4px]" : "opacity-100 blur-0"
          }`}
        >
          La Kja
        </p>
      </div>
    </div>
  );
}
