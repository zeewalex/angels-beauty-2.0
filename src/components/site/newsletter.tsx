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
            <h2 className="mt-3 font-serif text-2xl font-bold text-forest sm:text-3xl lg:text-4xl">
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

          {/* decorative phone-ish visual */}
          <div className="relative hidden flex-col items-center justify-center gap-4 p-8 lg:flex">
            <p className="font-script text-2xl text-forest">
              Beauty Tips, Delivered to You
            </p>
            <div className="flex h-60 w-48 flex-col items-center justify-center rounded-[2rem] border-4 border-white bg-forest/90 shadow-xl">
              <span className="font-script text-4xl text-blush">A</span>
              <p className="mt-1 font-serif text-base font-bold text-white">
                Angels Beauty
              </p>
              <p className="mt-1 px-6 text-center text-[11px] text-cream/70">
                Skincare rituals, offers &amp; more — right in your inbox.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
