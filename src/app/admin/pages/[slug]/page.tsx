import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { PageEditor } from "@/components/site/page-editor";

export default async function AdminPageEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireRole("ADMIN");
  const { slug } = await params;
  const page = await db.page.findUnique({ where: { slug } });
  if (!page) notFound();
  return (
    <div>
      <a href="/admin/pages" className="text-xs font-medium text-muted-foreground hover:text-forest">← Pages</a>
      <h1 className="mt-1 font-sans text-2xl font-bold text-forest">Edit: {page.title}</h1>
      <div className="mt-5"><PageEditor slug={slug} initialTitle={page.title} initialBody={page.body} /></div>
    </div>
  );
}
