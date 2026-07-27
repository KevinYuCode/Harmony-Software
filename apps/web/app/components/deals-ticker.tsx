import { cn } from "@/lib/utils";

type TickerItem = {
  emoji: string;
  label: string;
  price?: string;
};

export function DealsTicker({
  items,
  className,
}: {
  items: TickerItem[];
  className?: string;
}) {
  const looped = [...items, ...items];

  return (
    <div
      className={cn(
        "w-full shrink-0 overflow-hidden border-y border-accent-muted/50 bg-accent py-2",
        className,
      )}
    >
      <div className="flex w-max animate-marquee gap-10 motion-reduce:animate-none">
        {looped.map((item, i) => (
          <span
            key={`${item.label}-${i}`}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap font-[family-name:var(--font-label)] text-[0.8rem] font-bold uppercase tracking-[0.02em] text-secondary"
          >
            <span aria-hidden>{item.emoji}</span>
            {item.label}
            {item.price && <span className="text-primary">{item.price}</span>}
            <span className="ml-8 text-secondary/25" aria-hidden>
              •
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
