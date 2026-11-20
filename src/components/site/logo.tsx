"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "dark" | "light";
  className?: string;
  enableTapShortcut?: boolean;
};

const TAP_KEY = "angels_logo_taps";
const TAP_WINDOW_MS = 3000;
const TAP_THRESHOLD = 5;
const NAV_DELAY_MS = 600;

// Module-level timer — survives component re-renders but not page navigations.
// Combined with sessionStorage for the tap count, this handles the case where
// the user clicks from a non-homepage page (first click navigates, component
// remounts, but sessionStorage preserves the count).
let navTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function Logo({ variant = "dark", className, enableTapShortcut = false }: LogoProps) {
  const isLight = variant === "light";
  const wordColor = isLight ? "#FAF6F0" : "#1B4332";
  const subColor = isLight ? "#F2C4C2" : "#E8B4B8";
  const router = useRouter();
  const { data: session } = useSession();
  const elRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (!enableTapShortcut) {
      router.push("/");
      return;
    }

    // Cancel any pending homepage navigation from a previous tap
    if (navTimeoutId) {
      clearTimeout(navTimeoutId);
      navTimeoutId = null;
    }

    const now = Date.now();

    // Read tap timestamps from sessionStorage (survives navigation/remounts)
    let taps: number[] = [];
    try {
      const raw = sessionStorage.getItem(TAP_KEY);
      if (raw) taps = JSON.parse(raw);
    } catch {}

    // Remove expired taps
    taps = taps.filter((t) => now - t < TAP_WINDOW_MS);
    taps.push(now);

    // Persist
    try {
      sessionStorage.setItem(TAP_KEY, JSON.stringify(taps));
    } catch {}

    if (taps.length >= TAP_THRESHOLD) {
      // 5 taps — trigger admin shortcut
      try { sessionStorage.removeItem(TAP_KEY); } catch {}

      // Pulse feedback
      if (elRef.current) {
        elRef.current.style.transform = "scale(1.15)";
        setTimeout(() => {
          if (elRef.current) elRef.current.style.transform = "scale(1)";
        }, 400);
      }

      const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
      if (isAdmin) {
        toast.success("Opening admin dashboard...", { duration: 1500 });
        router.push("/admin");
      } else {
        toast.info("Redirecting to admin login...", { duration: 1500 });
        router.push("/login?callbackUrl=/admin");
      }
      return;
    }

    // Fewer than 5 taps — schedule homepage navigation after a delay.
    // The delay must be long enough for 5 rapid taps to complete (typically
    // 400-600ms for a human), but short enough that a single tap feels
    // responsive. 600ms is a good balance.
    //
    // If more taps come before this fires, the clearTimeout above cancels it.
    navTimeoutId = setTimeout(() => {
      navTimeoutId = null;
      // Check if we reached 5 (in case the last tap + this timeout race)
      let current: number[] = [];
      try {
        const raw = sessionStorage.getItem(TAP_KEY);
        if (raw) current = JSON.parse(raw);
      } catch {}
      if (current.length < TAP_THRESHOLD) {
        try { sessionStorage.removeItem(TAP_KEY); } catch {}
        router.push("/");
      }
    }, NAV_DELAY_MS);
  }, [enableTapShortcut, session, router]);

  return (
    <div
      ref={elRef}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      aria-label="Angels Beauty home"
      onKeyDown={(e) => { if (e.key === "Enter") handleClick(); }}
      className={cn("flex items-center gap-2.5 select-none cursor-pointer", className)}
      style={{ transition: "transform 0.4s ease" }}
    >
      <span className="relative inline-flex h-14 w-14 items-center justify-center">
        <img src="/images/angels-beauty-logo.png" alt="Angels Beauty crest logo" className="h-full w-full object-contain" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[22px] font-bold tracking-tight" style={{ color: wordColor }}>
          Angels
        </span>
        <span className="font-script text-[15px] leading-none -mt-0.5" style={{ color: subColor }}>
          Beauty
        </span>
      </span>
    </div>
  );
}
