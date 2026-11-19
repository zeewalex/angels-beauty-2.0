"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "dark" | "light";
  className?: string;
  /** Enable the five-tap admin shortcut (storefront header/footer only). */
  enableTapShortcut?: boolean;
};

/**
 * Angels Beauty brand logo — uses the official uploaded crest image.
 *
 * Five-tap admin shortcut: when `enableTapShortcut` is true, tapping/clicking
 * the logo 5 times within 3 seconds redirects to the admin dashboard (if
 * authenticated as admin) or the admin login page. The counter resets after
 * 3 seconds of inactivity. The logo remains a normal homepage link otherwise.
 *
 * Regular customers never gain admin access — the redirect goes to the login
 * page, and role-based authorization is enforced server-side.
 */
export function Logo({ variant = "dark", className, enableTapShortcut = false }: LogoProps) {
  const isLight = variant === "light";
  const wordColor = isLight ? "#FAF6F0" : "#1B4332";
  const subColor = isLight ? "#F2C4C2" : "#E8B4B8";
  const router = useRouter();
  const { data: session } = useSession();
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pulse, setPulse] = useState(false);

  const handleTap = useCallback((e: React.MouseEvent) => {
    if (!enableTapShortcut) return;

    tapCount.current += 1;

    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 3000);

    if (tapCount.current >= 5) {
      e.preventDefault();
      tapCount.current = 0;
      if (tapTimer.current) clearTimeout(tapTimer.current);

      setPulse(true);
      setTimeout(() => setPulse(false), 600);

      const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
      if (isAdmin) {
        toast.success("Opening admin dashboard...", { duration: 1500 });
        router.push("/admin");
      } else {
        toast.info("Redirecting to admin login...", { duration: 1500 });
        router.push("/login?callbackUrl=/admin");
      }
    } else {
      // Normal click — navigate to homepage (but not on the 5th tap)
      // Use a short delay so rapid taps don't navigate away before reaching 5
      if (tapCount.current === 1) {
        // First tap — schedule a homepage navigation if no more taps come
        // (if more taps come, the counter increments and this timer is cleared)
        // We use a separate timer for navigation
      }
      // Don't navigate on intermediate taps — only navigate to "/" if user
      // stops tapping (counter resets to 0 after 3s without reaching 5)
      // For immediate homepage navigation on single click, we check after a brief delay
      e.preventDefault();
      if (tapCount.current === 1) {
        // Schedule homepage navigation — will be cancelled if more taps come
        const navTimer = setTimeout(() => {
          router.push("/");
          tapCount.current = 0;
        }, 250);
        // Store on the ref so the next tap can cancel it
        (tapTimer as any).navTimer = navTimer;
      } else {
        // Cancel any pending navigation — user is multi-tapping
        if ((tapTimer as any).navTimer) {
          clearTimeout((tapTimer as any).navTimer);
          (tapTimer as any).navTimer = null;
        }
      }
    }
  }, [enableTapShortcut, session, router]);

  return (
    <div
      className={cn("flex items-center gap-2.5 select-none", pulse && "scale-105", className)}
      style={{ transition: "transform 0.3s ease" }}
      onClick={handleTap}
      role={enableTapShortcut ? "button" : undefined}
      tabIndex={enableTapShortcut ? 0 : undefined}
      onKeyDown={enableTapShortcut ? (e) => { if (e.key === "Enter") handleTap(); } : undefined}
    >
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
