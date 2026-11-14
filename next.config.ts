import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Hide the Next.js dev-mode indicator overlay in development.
  // It never appears in production builds regardless.
  devIndicators: false,
  // Merged-category redirect: face-masks-scrubs merged into masks-scrubs.
  // Source slugs preserved in catalog.ts (sourceCategorySlug + categoryAliases).
  async redirects() {
    return [
      {
        source: "/category/face-masks-scrubs",
        destination: "/category/masks-scrubs",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
