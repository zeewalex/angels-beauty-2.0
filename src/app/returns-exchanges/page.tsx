import { ContentPage } from "@/components/site/content-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns Exchanges — Angels Beauty",
  description: "Angels Beauty returns-exchanges page.",
  robots: { index: true, follow: true },
};

export default function Page() {
  return <ContentPage slug="returns-exchanges" title="Returns Exchanges" />;
}
