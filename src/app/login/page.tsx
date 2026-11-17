"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/schemas";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/account";
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
    const res = await signIn("credentials", { ...parsed.data, redirect: false });
    setLoading(false);
    if (res?.error) {
      setServerError("Incorrect email or password.");
      return;
    }
    // Merge any guest cart into the now-authenticated user's cart.
    await fetch("/api/cart/merge", { method: "POST" }).catch(() => {});
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthShell>
      <h1 className="font-serif text-2xl font-bold text-forest">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to your Angels Beauty account.</p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="pl-9" placeholder="you@example.com" aria-invalid={!!errors.email} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="pl-9" placeholder="••••••••" aria-invalid={!!errors.password} />
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        {serverError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>}

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
