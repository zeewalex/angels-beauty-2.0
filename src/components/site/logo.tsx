import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "dark" | "light";
  className?: string;
};

/**
 * Angels Beauty brand logo — a crest emblem matching the original branding
 * seen on product packaging: a gold crown, spread angel wings, a central
 * shield with "AB", and a ribbon banner reading "ANGELS BEAUTY".
 *
 * `variant="light"` renders cream/gold tones for use on dark green backgrounds.
 * `variant="dark"` renders the standard gold/dark tones for light backgrounds.
 */
export function Logo({ variant = "dark", className }: LogoProps) {
  const isLight = variant === "light";
  const gold = "#D4A843";
  const goldDark = "#B8902F";
  const goldLight = "#E8C868";
  const shieldFill = isLight ? "#FAF6F0" : "#1B4332";
  const shieldText = isLight ? "#1B4332" : "#D4A843";
  const ribbonFill = isLight ? "#FAF6F0" : "#1B4332";
  const ribbonText = isLight ? "#1B4332" : "#D4A843";
  const wingColor = gold;
  const crownColor = gold;
  const wordColor = isLight ? "#FAF6F0" : "#1B4332";
  const subColor = isLight ? "#F2C4C2" : "#E8B4B8";

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <span className="relative inline-flex h-12 w-12 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-12 w-12" fill="none" aria-hidden="true">
          {/* Crown */}
          <path
            d="M35 18 L40 12 L45 18 L50 10 L55 18 L60 12 L65 18 L63 24 L37 24 Z"
            fill={crownColor}
            stroke={goldDark}
            strokeWidth="0.5"
          />
          <circle cx="40" cy="13" r="1.5" fill={goldLight} />
          <circle cx="50" cy="11" r="1.5" fill={goldLight} />
          <circle cx="60" cy="13" r="1.5" fill={goldLight} />

          {/* Left wing */}
          <path
            d="M38 26 C30 26 20 30 12 38 C18 34 24 32 30 33 C22 36 16 42 10 48 C18 42 24 40 30 40 C22 44 16 50 12 56 C20 50 26 48 32 47 C26 50 22 54 20 58 C26 54 32 52 36 50 L38 38 Z"
            fill={wingColor}
            stroke={goldDark}
            strokeWidth="0.3"
          />
          {/* Right wing (mirror) */}
          <path
            d="M62 26 C70 26 80 30 88 38 C82 34 76 32 70 33 C78 36 84 42 90 48 C82 42 76 40 70 40 C78 44 84 50 88 56 C80 50 74 48 68 47 C74 50 78 54 80 58 C74 54 68 52 64 50 L62 38 Z"
            fill={wingColor}
            stroke={goldDark}
            strokeWidth="0.3"
          />

          {/* Shield */}
          <path
            d="M34 24 L66 24 L66 42 C66 52 58 58 50 62 C42 58 34 52 34 42 Z"
            fill={shieldFill}
            stroke={gold}
            strokeWidth="1.5"
          />
          {/* Shield inner border */}
          <path
            d="M37 27 L63 27 L63 41 C63 49 57 54 50 58 C43 54 37 49 37 41 Z"
            fill="none"
            stroke={goldDark}
            strokeWidth="0.5"
          />
          {/* "AB" text on shield */}
          <text
            x="50"
            y="44"
            textAnchor="middle"
            fontSize="16"
            fontWeight="bold"
            fill={shieldText}
            fontFamily="serif"
          >
            AB
          </text>

          {/* Ribbon banner */}
          <path
            d="M22 60 L78 60 L74 68 L78 76 L22 76 L26 68 Z"
            fill={ribbonFill}
            stroke={gold}
            strokeWidth="1"
          />
          {/* Ribbon tails */}
          <path d="M22 60 L16 64 L18 72 L22 76" fill={ribbonFill} stroke={gold} strokeWidth="0.8" />
          <path d="M78 60 L84 64 L82 72 L78 76" fill={ribbonFill} stroke={gold} strokeWidth="0.8" />
          {/* Ribbon text */}
          <text
            x="50"
            y="71"
            textAnchor="middle"
            fontSize="7"
            fontWeight="bold"
            fill={ribbonText}
            fontFamily="sans-serif"
            letterSpacing="0.5"
          >
            ANGELS BEAUTY
          </text>
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
