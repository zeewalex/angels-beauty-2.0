import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://angelsbeauties.shop";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cart", "/checkout", "/account", "/admin", "/api", "/track-order"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
