import { Logo } from "@/components/site/logo";

/**
 * Minimal centered shell for auth pages (no header/footer).
 *
 * The Logo is rendered directly (NOT wrapped in a <Link>) so that the
 * five-tap admin shortcut works on auth pages too. A normal single click
 * on the logo still navigates to the homepage.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-10">
      <div className="mb-8">
        <Logo enableTapShortcut />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}
