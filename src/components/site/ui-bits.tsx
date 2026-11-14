import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small uppercase letter-spaced label inside an outlined pill badge. */
export function SectionLabel({
  children,
  tone = "green",
  className,
}: {
  children: React.ReactNode;
  tone?: "green" | "pink" | "white" | "cream";
  className?: string;
}) {
  const tones: Record<string, string> = {
    green:
      "border-forest/25 text-forest bg-forest/5",
    pink: "border-blush-dark/40 text-forest bg-blush/20",
    white: "border-white/40 text-white bg-white/10",
    cream: "border-cream/40 text-cream bg-cream/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Orange star rating row + optional review count. */
export function StarRating({
  rating,
  count,
  size = 14,
  className,
}: {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={
              i < rating
                ? "fill-[#f5a623] text-[#f5a623]"
                : "fill-none text-gray-300"
            }
            strokeWidth={1.5}
          />
        ))}
      </div>
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">
          ({count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count})
        </span>
      )}
    </div>
  );
}
