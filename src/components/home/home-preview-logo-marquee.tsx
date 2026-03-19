"use client";

type HomePreviewLogoMarqueeProps = {
  items: readonly string[];
};

export function HomePreviewLogoMarquee({ items }: HomePreviewLogoMarqueeProps) {
  const duplicatedItems = [...items, ...items];

  return (
    <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white/80 py-4 shadow-[0_10px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#151821]">
      <div className="flex min-w-max animate-[lkj-marquee_24s_linear_infinite] gap-3 px-3">
        {duplicatedItems.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex items-center gap-3 rounded-full border border-black/10 bg-[#f6f1e7] px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#20211d] dark:border-white/10 dark:bg-[#20211d] dark:text-white"
          >
            <span className="inline-flex h-3 w-3 rounded-full bg-[#5aab14]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
