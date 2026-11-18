import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { db } from "@/lib/db";
import { FAQAccordion } from "@/components/site/faq-accordion";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs — Angels Beauty",
  description: "Frequently asked questions about Angels Beauty products, shipping, and returns.",
};

export default async function FAQsPage() {
  const faqs = await db.fAQ.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { question: "asc" }] });
  const categories = [...new Set(faqs.map((f) => f.category))];

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQs" }]} />
        <h1 className="mt-4 font-serif text-3xl font-bold text-forest sm:text-4xl">Frequently Asked Questions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Find answers to common questions about our products and policies.</p>
        {faqs.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">FAQ content will be added soon. Please contact us if you have questions.</p>
        ) : (
          <div className="mt-8 space-y-8">
            {categories.map((cat) => (
              <div key={cat}>
                <h2 className="font-sans text-lg font-bold text-forest">{cat}</h2>
                <FAQAccordion faqs={faqs.filter((f) => f.category === cat)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
