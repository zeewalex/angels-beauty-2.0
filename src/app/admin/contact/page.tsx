import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function AdminContactPage() {
  await requireRole("ADMIN");
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div>
      <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Contact Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">{messages.length} messages.</p>
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Subject</th><th className="hidden px-4 py-3 sm:table-cell">From</th><th className="hidden px-4 py-3 sm:table-cell">Date</th></tr></thead>
          <tbody className="divide-y divide-border">
            {messages.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">No contact messages yet.</td></tr>}
            {messages.map((m) => (
              <tr key={m.id} className="hover:bg-cream/40">
                <td className="px-4 py-3"><p className="font-medium text-forest">{m.subject}</p><p className="text-xs text-muted-foreground line-clamp-1">{m.message}</p></td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{m.name} · {m.email}</td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{new Date(m.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
