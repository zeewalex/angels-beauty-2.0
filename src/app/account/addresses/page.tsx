import { MapPin } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { AccountNav } from "@/components/site/account-nav";
import { AddressForm, AddressActions, SetDefaultButton } from "@/components/site/address-form";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";

export default async function AddressesPage() {
  const session = await requireSession();
  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My Account", href: "/account" }, { label: "Addresses" }]} />
        <div className="mt-4 grid gap-6 lg:grid-cols-[220px_1fr]">
          <AccountNav />
          <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h1 className="font-serif text-2xl font-bold text-forest">Saved Addresses</h1>

            {addresses.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
                <MapPin size={30} className="text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-forest">No saved addresses</p>
                <p className="mt-1 text-sm text-muted-foreground">Add an address for faster checkout.</p>
              </div>
            ) : (
              <ul className="mt-6 space-y-3">
                {addresses.map((a) => (
                  <li key={a.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-forest">{a.firstName} {a.lastName}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                        <p className="text-sm text-muted-foreground">{a.city}, {a.state} {a.postalCode}</p>
                        <p className="text-sm text-muted-foreground">{a.country}{a.phone ? ` · ${a.phone}` : ""}</p>
                      </div>
                      {a.isDefault && <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-[11px] font-semibold text-forest">Default</span>}
                    </div>
                    <div className="mt-3 flex gap-3">
                      {!a.isDefault && <SetDefaultButton id={a.id} />}
                      <AddressActions id={a.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <AddressForm />
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
