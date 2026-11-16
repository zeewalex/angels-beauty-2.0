import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { AdminNav } from "@/components/site/admin-nav";
import { requireRole } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("ADMIN"); // independent server-side auth check
  const name = session?.user.name || "Admin";

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-forest px-4 text-cream">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo variant="light" />
          <span className="ml-2 hidden rounded-full bg-blush px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-forest sm:inline">Admin</span>
        </Link>
        <Link href="/" className="text-xs font-medium text-cream/80 hover:text-white">View store →</Link>
      </header>
      <div className="flex flex-1 flex-col sm:flex-row">
        <AdminNav adminName={name} />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
