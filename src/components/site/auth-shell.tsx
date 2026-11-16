import Link from "next/link";
import { Logo } from "@/components/site/logo";

/** Minimal centered shell for auth pages (no header/footer). */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-10">
      <Link href="/" className="mb-8" aria-label="Angels Beauty home">
        <Logo />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}
