import { notFound } from "next/navigation";
import Link from "next/link";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { db } from "@/lib/db";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug } });
  if (!post) return { title: "Article — Angels Beauty" };
  return {
    title: `${post.title} — Angels Beauty`,
    description: post.seoDescription || post.excerpt || "",
    openGraph: { title: post.title, description: post.seoDescription || post.excerpt || "", images: post.ogImage ? [{ url: post.ogImage }] : undefined },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt?.toISOString(),
    image: post.featuredImage,
    author: { "@type": "Organization", name: "Angels Beauty" },
  };

  return (
    <StorefrontShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]} />
        {post.featuredImage && (
          <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-blush-tile">
            <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover" />
          </div>
        )}
        <p className="mt-6 text-[11px] font-medium uppercase tracking-wide text-blush-dark">{post.category}</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-forest sm:text-4xl">{post.title}</h1>
        {post.publishedAt && <p className="mt-2 text-sm text-muted-foreground">{new Date(post.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>}
        <div className="prose prose-sm mt-6 max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: post.body }} />
        <div className="mt-8 border-t border-border pt-6">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-light">
            <ArrowRight size={14} className="rotate-180" /> Back to blog
          </Link>
        </div>
      </article>
    </StorefrontShell>
  );
}
