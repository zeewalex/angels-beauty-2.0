import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "dark" | "light";
  className?: string;
};

/**
 * Angels Beauty brand logo — uses the official uploaded crest image
 * (gold crown, angel wings, "ABS" shield, "ANGELS BEAUTY" ribbon banner,
 * "SKINCARE" subtitle). The image has a transparent background.
 *
 * `variant="light"` is for dark backgrounds (footer, admin header).
 * `variant="dark"` is for light backgrounds (storefront header).
 * The crest image works on both since it has transparency + gold/dark tones.
 */
export function Logo({ variant = "dark", className }: LogoProps) {
  const isLight = variant === "light";
  const wordColor = isLight ? "#FAF6F0" : "#1B4332";
  const subColor = isLight ? "#F2C4C2" : "#E8B4B8";

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <span className="relative inline-flex h-14 w-14 items-center justify-center">
        <img
          src="/images/angels-beauty-logo.png"
          alt="Angels Beauty crest logo"
          className="h-full w-full object-contain"
        />
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
