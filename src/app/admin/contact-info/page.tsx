import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ContactInfoEditor } from "@/components/site/contact-info-editor";

export default async function AdminContactInfoPage() {
  await requireRole("ADMIN");
  return (
    <div>
      <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Contact Information</h1>
      <p className="mt-1 text-sm text-muted-foreground">Edit the contact details shown on the public Contact page.</p>
      <div className="mt-5"><ContactInfoEditor /></div>
    </div>
  );
}
