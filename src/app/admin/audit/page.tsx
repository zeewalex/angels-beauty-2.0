import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function AdminAuditPage() {
  await requireRole("ADMIN");
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, actorId: true, actorRole: true, action: true, entityType: true, entityId: true, summary: true, createdAt: true } });
  return (
    <div>
      <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Audit Log</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every administrative change is recorded here.</p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th><th className="hidden px-4 py-3 sm:table-cell">Summary</th><th className="px-4 py-3">Role</th></tr></thead>
          <tbody className="divide-y divide-border">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-cream/40">
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 font-medium text-forest">{l.action}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.entityType}{l.entityId ? ` · ${l.entityId.slice(0, 8)}…` : ""}</td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{l.summary ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.actorRole}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No audit entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
