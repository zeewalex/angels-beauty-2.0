import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { FAQManager } from "@/components/site/faq-manager";

export default async function AdminFAQsPage() {
  await requireRole("ADMIN");
  const faqs = await db.fAQ.findMany({ orderBy: [{ sortOrder: "asc" }, { question: "asc" }] });
  return (
    <div>
      <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">FAQs</h1>
      <p className="mt-1 text-sm text-muted-foreground">{faqs.length} questions.</p>
      <div className="mt-5"><FAQManager initialFaqs={faqs.map((f) => ({ id: f.id, category: f.category, question: f.question, answer: f.answer, sortOrder: f.sortOrder, isActive: f.isActive }))} /></div>
    </div>
  );
}
