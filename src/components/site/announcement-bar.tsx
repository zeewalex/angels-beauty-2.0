"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, Sparkles, RefreshCcw, Tag } from "lucide-react";

/**
 * Animated announcement bar — rotates through messages with a smooth fade.
 *
 * Features:
 *   - One message at a time, centered, readable on desktop + mobile.
 *   - Smooth fade transition (opacity + slight translateY).
 *   - Auto-rotates every 3.5 seconds.
 *   - Respects `prefers-reduced-motion` (shows first message, no rotation).
 *   - Uses the existing website colour palette (forest-dark, cream, blush).
 *   - Messages are editable via /admin/announcements (stored in StoreSetting).
 *
 * Falls back to default messages if the API is unavailable or before
 * hydration (no flash of empty content).
 */

const DEFAULT_MESSAGES = [
  { icon: "truck", text: "Free Shipping on Orders Over $50" },
  { icon: "sparkles", text: "New Season Collection Now Live" },
  { icon: "refresh", text: "Easy Returns & Exchanges" },
];

const ICON_MAP: Record<string, typeof Truck> = {
  truck: Truck,
  sparkles: Sparkles,
  refresh: RefreshCcw,
  tag: Tag,
};

const ROTATION_MS = 3500;

export function AnnouncementBar() {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [current, setCurrent] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Fetch announcement messages from the API (editable via admin dashboard).
  useEffect(() => {
    fetch("/api/announcements", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {
        // Fall back to defaults — the bar still shows.
      });
  }, []);

  // Check reduced-motion preference.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Rotate messages.
  const advance = useCallback(() => {
    setCurrent((c) => (c + 1) % messages.length);
  }, [messages.length]);

  useEffect(() => {
    if (reducedMotion || messages.length <= 1) return;
    const interval = setInterval(advance, ROTATION_MS);
    return () => clearInterval(interval);
  }, [reducedMotion, messages.length, advance]);

  const CurrentIcon = ICON_MAP[messages[current]?.icon] || Tag;
  const text = messages[current]?.text || DEFAULT_MESSAGES[0].text;

  return (
    <div
      className="bg-forest-dark text-cream overflow-hidden"
      role="region"
      aria-label="Announcements"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2">
        <div
          key={current}
          className="flex items-center gap-2 text-center transition-all duration-700 ease-in-out"
          style={{
            animation: reducedMotion
              ? "none"
              : "announcement-fade 0.7s ease-in-out",
          }}
        >
          <CurrentIcon size={14} className="shrink-0 text-blush" />
          <span className="text-[11px] font-medium tracking-wide sm:text-[12px]">
            {text}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes announcement-fade {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
