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
};

export default nextConfig;
