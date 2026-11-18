import Link from "next/link";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { db } from "@/lib/db";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Angels Beauty",
  description: "Beauty tips, skincare guides, and product insights from Angels Beauty.",
};

export default async function BlogPage() {
  const posts = await db.blogPost.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    select: { id: true, slug: true, title: true, excerpt: true, featuredImage: true, category: true, publishedAt: true },
  });

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
        <h1 className="mt-4 font-serif text-3xl font-bold text-forest sm:text-4xl">Angels Beauty Blog</h1>
        <p className="mt-2 text-sm text-muted-foreground">Skincare tips, beauty guides, and product insights.</p>
        {posts.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border bg-white/50 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-forest">No articles published yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Blog content will appear here once articles are published.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group overflow-hidden rounded-xl border border-border bg-white transition-all hover:-translate-y-1 hover:shadow-lg">
                {p.featuredImage && <div className="aspect-video overflow-hidden bg-blush-tile"><img src={p.featuredImage} alt={p.title} className="h-full w-full object-cover" /></div>}
                <div className="p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-blush-dark">{p.category}</p>
                  <h2 className="mt-1 font-serif text-base font-bold text-forest group-hover:text-forest-light">{p.title}</h2>
                  {p.excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.excerpt}</p>}
                  <p className="mt-2 text-[11px] text-muted-foreground">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ""}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
