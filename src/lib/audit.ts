import { db } from "@/lib/db";
import type { AppSession } from "@/lib/auth";

/** Record an administrative action in the audit log. */
export async function logAudit(
  session: AppSession,
  action: string,
  entityType: string,
  entityId: string | null,
  summary?: string,
  metadata?: Record<string, unknown>,
) {
  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: session.user.role as any,
      action,
      entityType,
      entityId,
      summary,
      metadata: metadata ?? undefined,
    },
  });
}
