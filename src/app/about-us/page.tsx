import { ContentPage } from "@/components/site/content-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Angels Beauty",
  description: "Angels Beauty about-us page.",
  robots: { index: true, follow: true },
};

export default function Page() {
  return <ContentPage slug="about-us" title="About Us" />;
}
