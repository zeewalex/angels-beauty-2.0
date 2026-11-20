"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "dark" | "light";
  className?: string;
  enableTapShortcut?: boolean;
};

const TAP_KEY = "angels_logo_taps";
const TAP_WINDOW_MS = 3000; // 5 taps must happen within 3 seconds
const TAP_THRESHOLD = 5;
// Delay before a single/double/triple tap navigates to the homepage.
// Must be long enough for a human to complete 5 rapid taps (~500ms) but
// short enough that a normal click feels responsive.
const NAV_DELAY_MS = 500;

// Module-level timer — survives component re-renders but not page navigations.
// Combined with sessionStorage for the tap count, this handles the case where
// the user clicks from a non-homepage page (first tap would navigate, component
// remounts, but sessionStorage preserves the count).
let navTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Check whether the current device is trusted for admin access.
 * Returns true if there's a valid NextAuth admin session OR a valid
 * trusted-device cookie.
 *
 * This is a real cookie-attached HTTP request — authoritative, not a stale
 * client-side cache like next-auth/react's `useSession()` hook (which
 * returns null on first render and wrongly redirects authenticated admins).
 */
async function isDeviceTrusted(): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/device-status", { credentials: "include", cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.trusted === true;
  } catch {
    return false;
  }
}

/**
 * Logo component for Angels Beauty.
 *
 * Five-tap admin shortcut (when `enableTapShortcut` is set):
 *   - 5 rapid taps within 3 seconds → check device trust, then navigate.
 *     • Trusted device (valid session OR trusted-device cookie) → /admin
 *       (dashboard opens immediately, no login prompt).
 *     • Not trusted → /admin-login (PIN-gated one-time enrollment page).
 *   - Fewer taps → navigate to the homepage (normal click behaviour).
 *
 * The device-trust check is a fetch to /api/admin/device-status — a real HTTP
 * request with the cookie attached. This is authoritative and avoids the
 * stale-state bug that `useSession()` causes on first render. Auth is never
 * bypassed: if the device isn't trusted, the user is sent to /admin-login
 * (which requires email + password + PIN to trust the device).
 *
 * Normal single click always navigates to the homepage (requirement #7).
 */
export function Logo({ variant = "dark", className, enableTapShortcut = false }: LogoProps) {
  const isLight = variant === "light";
  const wordColor = isLight ? "#FAF6F0" : "#1B4332";
  const subColor = isLight ? "#F2C4C2" : "#E8B4B8";
  const router = useRouter();
  const elRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (!enableTapShortcut) {
      // Shortcut disabled — every click goes home.
      router.push("/");
      return;
    }

    // Cancel any pending homepage navigation from a previous tap.
    if (navTimeoutId) {
      clearTimeout(navTimeoutId);
      navTimeoutId = null;
    }

    const now = Date.now();

    // Read tap timestamps from sessionStorage (survives navigation/remounts).
    let taps: number[] = [];
    try {
      const raw = sessionStorage.getItem(TAP_KEY);
      if (raw) taps = JSON.parse(raw);
    } catch {}

    // Drop taps outside the 3-second window.
    taps = taps.filter((t) => now - t < TAP_WINDOW_MS);
    taps.push(now);

    if (taps.length >= TAP_THRESHOLD) {
      // ── 5 taps: trigger the admin shortcut ──
      try { sessionStorage.removeItem(TAP_KEY); } catch {}

      // Pulse feedback so the user knows the shortcut fired.
      if (elRef.current) {
        elRef.current.style.transform = "scale(1.15)";
        setTimeout(() => {
          if (elRef.current) elRef.current.style.transform = "scale(1)";
        }, 400);
      }

      // Check if this device is trusted (valid admin session OR trusted-
      // device cookie). If trusted, go straight to /admin with no prompt.
      // If not, go to /admin-login (the PIN-gated enrollment page). This is
      // the ONLY visible way to reach admin from the storefront.
      toast.loading("Checking admin access…", { duration: 1500, id: "admin-tap" });
      isDeviceTrusted().then((trusted) => {
        if (trusted) {
          toast.success("Opening admin dashboard…", { duration: 1400, id: "admin-tap" });
          // Use window.location for a full page navigation so the admin
          // layout's server-side requireRole() runs fresh every time. This
          // avoids stale content when navigating from the storefront.
          window.location.href = "/admin";
        } else {
          toast.info("Admin verification required", { duration: 2000, id: "admin-tap" });
          window.location.href = "/admin-login";
        }
      });
      return;
    }

    // ── Fewer than 5 taps: persist count and schedule homepage nav ──
    try {
      sessionStorage.setItem(TAP_KEY, JSON.stringify(taps));
    } catch {}

    navTimeoutId = setTimeout(() => {
      navTimeoutId = null;
      // If we somehow haven't reached 5 by now, go home.
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
  }, [enableTapShortcut, router]);

  return (
    <div
      ref={elRef}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      aria-label="Angels Beauty home"
      onKeyDown={(e) => { if (e.key === "Enter") handleClick(); }}
      className={cn("flex items-center gap-2.5 select-none cursor-pointer", className)}
      style={{
        transition: "transform 0.4s ease",
        // Prevent mobile double-tap-to-zoom so rapid taps register cleanly.
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
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
