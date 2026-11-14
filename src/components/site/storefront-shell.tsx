import { AnnouncementBar } from "@/components/site/announcement-bar";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

/**
 * Shared storefront chrome for the new Phase 1 Task 2 pages (Shop, Category,
 * Product). Reuses the APPROVED homepage header/footer exactly — no visual
 * redesign. The homepage itself continues to compose these same components
 * directly, unchanged.
 */
export function StorefrontShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
