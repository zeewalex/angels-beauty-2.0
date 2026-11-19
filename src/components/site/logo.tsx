"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "dark" | "light";
  className?: string;
  enableTapShortcut?: boolean;
};

export function Logo({ variant = "dark", className, enableTapShortcut = false }: LogoProps) {
  const isLight = variant === "light";
  const wordColor = isLight ? "#FAF6F0" : "#1B4332";
  const subColor = isLight ? "#F2C4C2" : "#E8B4B8";
  const router = useRouter();
  const { data: session } = useSession();
  const tapCount = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!enableTapShortcut) {
      // Normal behavior — let the link navigate to "/"
      return;
    }

    // Always prevent default — we handle navigation ourselves
    e.preventDefault();

    // Cancel any pending homepage navigation
    if (navTimer.current) {
      clearTimeout(navTimer.current);
      navTimer.current = null;
    }

    tapCount.current += 1;

    // Reset counter after 3 seconds of no taps
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 3000);

    if (tapCount.current >= 5) {
      // 5th tap — go to admin
      tapCount.current = 0;
      if (resetTimer.current) clearTimeout(resetTimer.current);

      // Pulse feedback
      if (pulseRef.current) {
        pulseRef.current.style.transform = "scale(1.15)";
        setTimeout(() => {
          if (pulseRef.current) pulseRef.current.style.transform = "scale(1)";
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
    } else {
      // Taps 1-4: schedule homepage navigation after a short delay.
      // If another tap comes before the delay fires, it's cancelled above.
      // This means: single tap = go home (after 300ms); rapid taps = count up.
      navTimer.current = setTimeout(() => {
        router.push("/");
        tapCount.current = 0;
      }, 300);
    }
  }, [enableTapShortcut, session, router]);

  return (
    <a
      href="/"
      onClick={handleClick}
      aria-label="Angels Beauty home"
      className={cn("flex items-center gap-2.5 select-none cursor-pointer", className)}
    >
      <span ref={pulseRef} className="relative inline-flex h-14 w-14 items-center justify-center" style={{ transition: "transform 0.4s ease" }}>
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
    </a>
  );
}
