"use client";

import { Facebook, Instagram, Youtube, ArrowRight, Heart } from "lucide-react";
import { Logo } from "./logo";

// Pinterest isn't in lucide; use a simple inline svg.
function PinterestIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.09 2.46 7.6 5.97 9.13-.08-.78-.16-1.97.03-2.82.18-.78 1.14-4.97 1.14-4.97s-.29-.58-.29-1.44c0-1.35.78-2.36 1.76-2.36.83 0 1.23.62 1.23 1.37 0 .83-.53 2.08-.81 3.24-.23.97.49 1.76 1.45 1.76 1.74 0 3.08-1.84 3.08-4.49 0-2.35-1.69-3.99-4.1-3.99-2.79 0-4.43 2.1-4.43 4.27 0 .85.33 1.76.74 2.25.08.1.09.18.07.28l-.28 1.13c-.04.18-.14.22-.33.13-1.22-.57-1.99-2.36-1.99-3.8 0-3.09 2.25-5.93 6.48-5.93 3.4 0 6.05 2.43 6.05 5.67 0 3.38-2.13 6.1-5.09 6.1-.99 0-1.93-.52-2.25-1.13l-.61 2.33c-.22.85-.81 1.92-1.21 2.57.91.28 1.88.43 2.88.43 5.52 0 10-4.48 10-10S17.52 2 12 2Z" />
    </svg>
  );
}

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/shop" },
  { label: "About Us", href: "/about-us" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];
const careLinks = [
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Returns & Exchanges", href: "/returns-exchanges" },
  { label: "FAQs", href: "/faqs" },
  { label: "Track Order", href: "/track-order" },
  { label: "Support", href: "/support" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-forest text-cream">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* brand */}
          <div>
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
              Natural Beauty. Real You. Skincare, makeup and beauty
              essentials, thoughtfully selected for your daily routine.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[Facebook, Instagram, PinterestIcon, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:border-blush hover:bg-blush hover:text-forest"
                  aria-label="Social link"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* quick links */}
          <div>
            <h3 className="font-serif text-base font-semibold text-white">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-cream/70 transition-colors hover:text-blush"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* customer care */}
          <div>
            <h3 className="font-serif text-base font-semibold text-white">
              Customer Care
            </h3>
            <ul className="mt-4 space-y-2.5">
              {careLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-cream/70 transition-colors hover:text-blush"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* newsletter mini + contact */}
          <div>
            <h3 className="font-serif text-base font-semibold text-white">
              Stay Updated
            </h3>
            <p className="mt-4 text-sm text-cream/70">
              Get the latest updates, beauty tips and special offers.
            </p>
            <form className="mt-4 flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email..."
                aria-label="Email for updates"
                className="h-11 flex-1 rounded-full border border-cream/20 bg-cream/10 px-4 text-sm text-cream placeholder:text-cream/50 focus:border-blush focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush text-forest transition-colors hover:bg-blush-light"
                aria-label="Subscribe"
              >
                <ArrowRight size={16} />
              </button>
            </form>
            <div className="mt-6 rotate-[-3deg]">
              <p className="font-script text-xl text-blush">
                Beauty Changes Lives
                <Heart size={14} className="ml-1 inline fill-blush" />
              </p>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-cream/15 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-cream/60">
            &copy; {new Date().getFullYear()} Angels Beauty. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-cream/60 hover:text-blush">
              Privacy Policy
            </a>
            <span className="text-cream/20">|</span>
            <a href="#" className="text-xs text-cream/60 hover:text-blush">
              Terms &amp; Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
