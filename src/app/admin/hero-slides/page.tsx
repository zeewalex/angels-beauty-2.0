import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { HeroSlidesManager } from "@/components/site/hero-slides-manager";

export default async function AdminHeroSlidesPage() {
  await requireRole("ADMIN");
  const slides = await db.heroSlide.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Hero Slides</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage homepage carousel slides (images + videos).</p>
      <div className="mt-5">
        <HeroSlidesManager initialSlides={slides.map((s) => ({ id: s.id, sortOrder: s.sortOrder, mediaType: s.mediaType, desktopMedia: s.desktopMedia, mobileMedia: s.mobileMedia, posterImage: s.posterImage, headline: s.headline, subtitle: s.subtitle, ctaText: s.ctaText, ctaUrl: s.ctaUrl, isActive: s.isActive, startsAt: s.startsAt?.toISOString() ?? null, endsAt: s.endsAt?.toISOString() ?? null }))} />
      </div>
    </div>
  );
}
