import type { Metadata } from "next";
import { Playfair_Display, Poppins, Dancing_Script } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dancing = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Angels Beauty — Natural Beauty, Real You",
  description:
    "Angels Beauty — premium skincare, makeup, hair care, fragrance and body care made for your natural glow. Shop authentic beauty essentials with fast shipping and easy returns.",
  keywords: [
    "Angels Beauty",
    "skincare",
    "makeup",
    "beauty products",
    "natural beauty",
    "cosmetics",
    "serum",
    "moisturizer",
  ],
  authors: [{ name: "Angels Beauty" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Angels Beauty — Natural Beauty, Real You",
    description:
      "Premium skincare, makeup and beauty essentials made for your natural glow.",
    siteName: "Angels Beauty",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${poppins.variable} ${dancing.variable} font-sans antialiased bg-cream text-forest`}
      >
        <Providers>{children}</Providers>
        <Toaster
          position="top-center"
          richColors
          theme="light"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#1b4332",
              border: "1px solid #ece5da",
            },
          }}
        />
      </body>
    </html>
  );
}
