import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function AdminSupportPage() {
  await requireRole("ADMIN");
  const tickets = await db.supportTicket.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div>
      <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Support Tickets</h1>
      <p className="mt-1 text-sm text-muted-foreground">{tickets.length} tickets.</p>
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Subject</th><th className="hidden px-4 py-3 sm:table-cell">From</th><th className="px-4 py-3">Status</th><th className="hidden px-4 py-3 sm:table-cell">Date</th></tr></thead>
          <tbody className="divide-y divide-border">
            {tickets.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No support tickets yet.</td></tr>}
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-cream/40">
                <td className="px-4 py-3"><p className="font-medium text-forest">{t.subject}</p><p className="text-xs text-muted-foreground line-clamp-1">{t.message}</p></td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{t.email}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${t.status === "OPEN" ? "bg-amber-100 text-amber-700" : t.status === "RESOLVED" ? "bg-forest/10 text-forest" : "bg-gray-100 text-gray-600"}`}>{t.status}</span></td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{new Date(t.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
