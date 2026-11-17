import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function AdminCustomersPage() {
  await requireRole("ADMIN");
  // Privacy: show only name, email, order count, created date. NO passwords,
  // addresses, or other PII in this list view.
  const customers = await db.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, status: true, _count: { select: { orders: true } } },
  });

  return (
    <div>
      <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Customers</h1>
      <p className="mt-1 text-sm text-muted-foreground">{customers.length} customers · summary view only (no addresses or credentials exposed).</p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Orders</th><th className="hidden px-4 py-3 sm:table-cell">Status</th><th className="hidden px-4 py-3 sm:table-cell">Joined</th></tr></thead>
          <tbody className="divide-y divide-border">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-cream/40">
                <td className="px-4 py-3 font-medium text-forest">{c.firstName} {c.lastName}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{c._count.orders}</td>
                <td className="hidden px-4 py-3 sm:table-cell"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c.status === "ACTIVE" ? "bg-forest/10 text-forest" : "bg-amber-100 text-amber-700"}`}>{c.status}</span></td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
