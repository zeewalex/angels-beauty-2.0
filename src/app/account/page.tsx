import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { AccountNav } from "@/components/site/account-nav";
import { SignOutButton } from "@/components/site/sign-out-button";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";

export default async function AccountPage() {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, email: true, emailVerifiedAt: true, createdAt: true, orders: { select: { id: true } } },
  });

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My Account" }]} />
        <div className="mt-4 grid gap-6 lg:grid-cols-[220px_1fr]">
          <AccountNav />
          <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl font-bold text-forest">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <SignOutButton />
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Member since</dt>
                <dd className="mt-1 text-sm font-semibold text-forest">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" }) : "—"}
                </dd>
              </div>
              <div className="rounded-xl border border-border p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email verified</dt>
                <dd className="mt-1 text-sm font-semibold text-forest">{user?.emailVerifiedAt ? "Yes" : "Pending"}</dd>
              </div>
              <div className="rounded-xl border border-border p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Orders placed</dt>
                <dd className="mt-1 text-sm font-semibold text-forest">{user?.orders.length ?? 0}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
