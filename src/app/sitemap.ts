import type { MetadataRoute } from "next";
import { catalogProducts, catalogCategories } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL || "https://angelsbeauties.shop";
  const now = new Date();

  const staticPages = [
    { url: "", priority: 1.0, changeFrequency: "daily" as const },
    { url: "/shop", priority: 0.9, changeFrequency: "daily" as const },
    { url: "/about-us", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
    { url: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/faqs", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/shipping-policy", priority: 0.5, changeFrequency: "monthly" as const },
    { url: "/returns-exchanges", priority: 0.5, changeFrequency: "monthly" as const },
    { url: "/track-order", priority: 0.5, changeFrequency: "monthly" as const },
    { url: "/support", priority: 0.5, changeFrequency: "monthly" as const },
  ];

  const categoryPages = catalogCategories.map((c) => ({
    url: `/category/${c.slug}`,
    priority: 0.8,
    changeFrequency: "weekly" as const,
  }));

  const productPages = catalogProducts.map((p) => ({
    url: `/product/${p.slug}`,
    priority: 0.8,
    changeFrequency: "weekly" as const,
  }));

  return [...staticPages, ...categoryPages, ...productPages].map((p) => ({
    url: `${baseUrl}${p.url}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
