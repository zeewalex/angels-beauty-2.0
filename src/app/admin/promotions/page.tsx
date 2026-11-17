import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { PromotionForm } from "@/components/site/promotion-form";

export default async function AdminPromotionsPage() {
  await requireRole("ADMIN");
  const promotions = await db.promotion.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { redemptions: { select: { id: true } } } });
  return (
    <div>
      <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Promotions</h1>
      <p className="mt-1 text-sm text-muted-foreground">Authorized + schedulable. No promotion displays on the storefront unless active, authorized, and in-date.</p>
      <div className="mt-5 rounded-xl border border-border bg-white p-5">
        <h2 className="font-sans text-base font-bold text-forest">New Promotion</h2>
        <div className="mt-3"><PromotionForm /></div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Window</th></tr></thead>
          <tbody className="divide-y divide-border">
            {promotions.map((p) => (
              <tr key={p.id} className="hover:bg-cream/40">
                <td className="px-4 py-3 font-medium text-forest">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.code ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.type.replace("_", " ")}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.type === "PERCENTAGE" ? `${p.value}%` : p.type === "FIXED_AMOUNT" ? `$${(p.value / 100).toFixed(2)}` : "—"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.isActive ? "bg-forest/10 text-forest" : "bg-gray-100 text-gray-600"}`}>{p.isActive ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.startsAt ? new Date(p.startsAt).toLocaleDateString() : "—"} → {p.endsAt ? new Date(p.endsAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
