import { ContentPage } from "@/components/site/content-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy — Angels Beauty",
  description: "Angels Beauty shipping-policy page.",
  robots: { index: true, follow: true },
};

export default function Page() {
  return <ContentPage slug="shipping-policy" title="Shipping Policy" />;
}
