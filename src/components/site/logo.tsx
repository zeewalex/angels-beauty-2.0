import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "dark" | "light";
  className?: string;
};

/**
 * Angels Beauty brand logo — a botanical leaf droplet mark with the
 * "Angels" wordmark in serif and "Beauty" in script underneath.
 * `variant="light"` renders cream tones for use on dark green backgrounds.
 */
export function Logo({ variant = "dark", className }: LogoProps) {
  const isLight = variant === "light";
  const wordColor = isLight ? "#FAF6F0" : "#1B4332";
  const subColor = isLight ? "#F2C4C2" : "#E8B4B8";

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <svg
          viewBox="0 0 48 48"
          className="h-9 w-9"
          fill="none"
          aria-hidden="true"
        >
          {/* droplet / leaf mark */}
          <path
            d="M24 3C24 3 9 14 9 27a15 15 0 0 0 30 0C39 14 24 3 24 3Z"
            fill="#2D6A4F"
          />
          <path
            d="M24 9C24 9 14 18 14 27a10 10 0 0 0 20 0C34 18 24 9 24 9Z"
            fill="#1B4332"
          />
          <path
            d="M24 14v18M24 20c-2.4-1.6-5-2.2-7.5-2M24 20c2.4-1.6 5-2.2 7.5-2M24 26c-2.4-1.6-5-2.2-7.5-2M24 26c2.4-1.6 5-2.2 7.5-2"
            stroke="#F2C4C2"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className="font-serif text-[22px] font-bold tracking-tight"
          style={{ color: wordColor }}
        >
          Angels
        </span>
        <span
          className="font-script text-[15px] leading-none -mt-0.5"
          style={{ color: subColor }}
        >
          Beauty
        </span>
      </span>
    </div>
  );
}
