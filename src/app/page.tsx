import { AnnouncementBar } from "@/components/site/announcement-bar";
import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
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
