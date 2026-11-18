import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { db } from "@/lib/db";

/** Renders an editable content page (from the Page model) with SEO + branding. */
export async function ContentPage({ slug, title, fallbackBody }: { slug: string; title: string; fallbackBody?: string }) {
  const page = await db.page.findUnique({ where: { slug } });
  const pageTitle = page?.title ?? title;
  const body = page?.body ?? fallbackBody ?? "Content for this page will be added soon. Please check back shortly.";

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: pageTitle }]} />
        <h1 className="mt-4 font-serif text-3xl font-bold text-forest sm:text-4xl">{pageTitle}</h1>
        <div className="prose prose-sm mt-6 max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: body }} />
        <div className="mt-8 border-t border-border pt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-light">
            <ChevronRight size={14} className="rotate-180" /> Back to home
          </Link>
        </div>
      </div>
    </StorefrontShell>
  );
}
