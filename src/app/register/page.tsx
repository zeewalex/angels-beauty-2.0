"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/lib/schemas";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const f: Record<string, string> = {};
      for (const i of parsed.error.issues) f[i.path.join(".")] = i.message;
      setErrors(f);
      return;
    }
    setErrors({});
    setLoading(true);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setServerError(data?.error?.message || "Registration failed.");
      if (data?.error?.fields) setErrors(data.error.fields);
      return;
    }
    const si = await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirect: false });
    setLoading(false);
    if (si?.error) {
      router.push("/login");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <AuthShell>
      <h1 className="font-serif text-2xl font-bold text-forest">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Join Angels Beauty for faster checkout and order history.</p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <div className="relative mt-1">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="pl-9" aria-invalid={!!errors.firstName} />
            </div>
            {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="mt-1" aria-invalid={!!errors.lastName} />
            {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-9" placeholder="you@example.com" aria-invalid={!!errors.email} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-9" placeholder="At least 8 characters" aria-invalid={!!errors.password} />
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        {serverError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>}

        <Button type="submit" disabled={loading} className="w-full gap-2 bg-forest hover:bg-forest-light">
          {loading ? "Creating account…" : <>Create Account <ArrowRight size={15} /></>}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Already have an account? <Link href="/login" className="font-medium text-forest hover:text-forest-light">Sign in</Link>
      </p>
    </AuthShell>
  );
}
