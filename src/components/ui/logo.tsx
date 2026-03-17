import Image from "next/image";
import Link from "next/link";

type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className = "h-[72px] w-[72px]" }: LogoMarkProps) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <Image
        src="/branding/lakja-logo.svg"
        alt="La Kja"
        fill
        sizes="(max-width: 768px) 64px, 96px"
        className="object-contain drop-shadow-[0_14px_26px_rgba(101,163,13,0.22)]"
        priority
      />
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3">
      <LogoMark className="h-[56px] w-[56px] md:h-[72px] md:w-[72px]" />
      <span className="block truncate text-base font-black uppercase tracking-[0.28em] text-slate-900 md:text-lg md:tracking-[0.35em]">
        La Kja
      </span>
    </Link>
  );
}
