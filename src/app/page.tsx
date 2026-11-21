import { AnnouncementBar } from "@/components/site/announcement-bar";
import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
import { HeroSlider } from "@/components/site/hero-slider";
import { TrustRow } from "@/components/site/trust-row";
import { ShopByCategory } from "@/components/site/shop-by-category";
import { BestSellers, TrendingNow } from "@/components/site/product-rows";
import { OurStoryBanner } from "@/components/site/our-story-banner";
import { SaleBanner } from "@/components/site/sale-banner";
import { WhyChooseAngels } from "@/components/site/why-choose";
import { Testimonials } from "@/components/site/testimonials";
import { Newsletter } from "@/components/site/newsletter";
import { InstagramStrip } from "@/components/site/instagram-strip";
import { SiteFooter } from "@/components/site/site-footer";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Angels Beauty — Natural Beauty, Real You | Premium Skincare & Cosmetics",
  description: "Shop premium skincare, makeup, and beauty essentials at Angels Beauty. Natural ingredients, authentic products, fast shipping, and easy returns.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Angels Beauty — Natural Beauty, Real You",
    description: "Premium skincare, makeup and beauty essentials for your natural glow.",
    siteName: "Angels Beauty",
    type: "website",
  },
};

export default async function Home() {
  // Load active hero slides (scheduled + active). Falls back to static hero
  // if none OR if the database is unavailable (e.g. Vercel Preview without DB).
  const now = new Date();
  let heroSlides: Awaited<ReturnType<typeof db.heroSlide.findMany>> = [];
  try {
    heroSlides = await db.heroSlide.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    // DB unavailable — fall back to static hero component.
    heroSlides = [];
  }

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Angels Beauty",
    url: process.env.NEXTAUTH_URL || "https://angelsbeauties.shop",
    logo: "/images/angels-beauty-logo.png",
    description: "Premium skincare, makeup, and beauty essentials.",
  };
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Angels Beauty",
    url: process.env.NEXTAUTH_URL || "https://angelsbeauties.shop",
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1">
        {heroSlides.length > 0 ? (
          <section className="bg-cream pt-4 sm:pt-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <HeroSlider slides={heroSlides.map((s) => ({ id: s.id, mediaType: s.mediaType, desktopMedia: s.desktopMedia, mobileMedia: s.mobileMedia, posterImage: s.posterImage, headline: s.headline, subtitle: s.subtitle, ctaText: s.ctaText, ctaUrl: s.ctaUrl }))} />
            </div>
          </section>
        ) : (
          <Hero />
        )}
        <TrustRow />
        <ShopByCategory />
        <BestSellers />
        <OurStoryBanner />
        <SaleBanner />
        <TrendingNow />
        <WhyChooseAngels />
        <Testimonials />
        <Newsletter />
        <InstagramStrip />
      </main>
      <SiteFooter />
    </div>
  );
}
