"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/schemas";

/** Map NextAuth error codes + our custom middleware errors to friendly text. */
function describeError(code: string | null): { title: string; detail?: string } | null {
  if (!code) return null;
  switch (code) {
    case "admin_required":
      return {
        title: "Admin account required",
        detail: "The page you tried to open is restricted to store administrators. Sign in with an admin account below.",
      };
    case "CredentialsSignin":
      return { title: "Incorrect email or password" };
    case "Configuration":
      return { title: "Sign-in is temporarily unavailable", detail: "Server configuration error. Please try again later." };
    case "Verification":
      return { title: "This sign-in link is invalid or expired" };
    case "OAuthAccountNotLinked":
      return { title: "This email is already used by another sign-in method" };
    case "SessionRequired":
      return { title: "Please sign in to continue" };
    default:
      return { title: "Could not sign in", detail: "Please check your details and try again." };
  }
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/account";
  const errorCode = params.get("error");
  const isAdminRoute = callbackUrl.startsWith("/admin");

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<{ title: string; detail?: string } | null>(
    describeError(errorCode)
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const f: Record<string, string> = {};
      for (const i of parsed.error.issues) f[i.path.join(".")] = i.message;
      setErrors(f);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await signIn("credentials", { ...parsed.data, redirect: false });
      setLoading(false);
      // res.error can be unreliable when the page URL carries an ?error= param
      // (NextAuth leaks it into the result even on success). Trust res.ok instead.
      if (!res?.ok) {
        setServerError({ title: "Incorrect email or password." });
        return;
      }
      // Verify the session was actually established before navigating.
      const session = await fetch("/api/auth/session").then((r) => r.json()).catch(() => null);
      if (!session?.user) {
        setServerError({ title: "Sign-in failed", detail: "Session could not be established. Please try again." });
        return;
      }
      // If heading to /admin, confirm the role is sufficient up-front so we
      // can show a clear message instead of a silent middleware redirect.
      if (isAdminRoute && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
        setServerError({
          title: "Admin account required",
          detail: "Your account does not have admin access. Sign in with an admin account.",
        });
        return;
      }
      // Merge any guest cart into the now-authenticated user's cart.
      await fetch("/api/cart/merge", { method: "POST" }).catch(() => {});
      // router.push with a clean path strips any stale ?error= query from the URL.
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setLoading(false);
      setServerError({ title: "Something went wrong. Please try again." });
    }
  }

  return (
    <AuthShell>
      <h1 className="font-serif text-2xl font-bold text-forest">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to your Angels Beauty account.</p>

      {isAdminRoute && (
        <div className="mt-4 flex gap-3 rounded-lg border border-forest/20 bg-forest/5 px-3 py-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-forest" />
          <div className="text-xs text-foreground/80">
            <p className="font-semibold text-forest">You are signing in to the Admin dashboard.</p>
            <p className="mt-0.5">An admin account is required.</p>
          </div>
        </div>
      )}

      {serverError && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          <p className="font-semibold">{serverError.title}</p>
          {serverError.detail && <p className="mt-0.5 text-red-600">{serverError.detail}</p>}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="pl-9" placeholder="you@example.com" autoComplete="email" aria-invalid={!!errors.email} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="pl-9" placeholder="••••••••" autoComplete="current-password" aria-invalid={!!errors.password} />
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between text-xs">
          <Link href="/register" className="font-medium text-forest hover:text-forest-light">Create an account</Link>
          <Link href="/forgot-password" className="font-medium text-forest hover:text-forest-light">Forgot password?</Link>
        </div>

        <Button type="submit" disabled={loading} className="w-full gap-2 bg-forest hover:bg-forest-light">
          {loading ? "Signing in…" : <>Sign In <ArrowRight size={15} /></>}
        </Button>
      </form>


    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell><p className="text-sm text-muted-foreground">Loading…</p></AuthShell>}>
      <LoginForm />
    </Suspense>
  );
}
