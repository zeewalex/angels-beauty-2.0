"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { SectionLabel } from "./ui-bits";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    // Demo: simulate a subscribe request. No backend yet.
    setTimeout(() => {
      setLoading(false);
      setEmail("");
      toast.success("You're on the list!", {
        description: "Watch your inbox for exclusive Angels Beauty offers.",
        icon: <Check size={16} className="text-forest" />,
      });
    }, 700);
  };

  return (
    <section className="bg-cream py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative grid items-center overflow-hidden rounded-2xl bg-gradient-to-br from-blush-light to-blush lg:grid-cols-[1.3fr_1fr]">
          {/* decorative blob */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/30 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative p-7 sm:p-10 lg:p-14">
            <SectionLabel tone="green">Join Our Beauty Community</SectionLabel>
            <h2 className="mt-3 font-sans text-2xl font-bold text-forest sm:text-3xl lg:text-4xl">
              Get Exclusive Offers &amp; Beauty Tips
            </h2>
            <p className="mt-3 max-w-md text-sm text-forest/70">
              Be the first to know about new arrivals, special discounts and
              expert skincare advice — delivered with love.
            </p>
            <form
              onSubmit={subscribe}
              className="mt-6 flex max-w-md flex-col gap-2.5 sm:flex-row"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address..."
                className="h-12 flex-1 rounded-full border border-white bg-white px-5 text-sm text-forest placeholder:text-muted-foreground focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-forest px-6 text-sm font-semibold text-white transition-colors hover:bg-forest-light disabled:opacity-60"
              >
                {loading ? "Subscribing..." : "Subscribe"}
                {!loading && <ArrowRight size={15} />}
              </button>
            </form>
            <p className="mt-3 text-[11px] text-forest/50">
              By subscribing you agree to our Privacy Policy. Unsubscribe anytime.
            </p>
          </div>

          {/* decorative phone mockup with brand screen + flowers */}
          <div className="relative hidden items-center justify-center p-8 lg:flex">
            {/* script accent above the phone */}
            <p className="absolute -top-2 right-6 rotate-3 font-script text-2xl text-forest">
              Beauty Tips Delivered to You
            </p>
            {/* flower decorations */}
            <span className="absolute -left-2 top-10 text-3xl" aria-hidden="true">🌸</span>
            <span className="absolute -right-1 bottom-12 text-2xl" aria-hidden="true">🌷</span>
            {/* phone */}
            <div className="relative flex h-72 w-44 flex-col items-center justify-center rounded-[2.2rem] border-[6px] border-forest bg-forest shadow-2xl">
              {/* notch */}
              <span className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-cream/30" />
              {/* screen */}
              <div className="mt-3 flex h-full w-full flex-col items-center justify-center rounded-[1.6rem] bg-gradient-to-b from-blush-light/40 to-forest px-4">
                <span className="font-script text-3xl text-blush">Angels</span>
                <p className="font-serif text-sm font-bold text-white">Beauty</p>
                <span className="mt-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-cream">
                  Skincare App
                </span>
                <div className="mt-3 grid w-full grid-cols-2 gap-1.5">
                  <span className="h-8 rounded-lg bg-white/15" />
                  <span className="h-8 rounded-lg bg-white/15" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
