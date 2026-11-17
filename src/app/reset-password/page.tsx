"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema } from "@/lib/schemas";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const parsed = resetPasswordSchema.safeParse({ ...form, token });
    if (!parsed.success) {
      const f: Record<string, string> = {};
      for (const i of parsed.error.issues) f[i.path.join(".")] = i.message;
      setErrors(f); return;
    }
    setErrors({}); setLoading(true);
    const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setServerError(data?.error?.message || "Reset failed."); return; }
    router.push("/login?reset=1");
  }

  if (!token) {
    return (
      <AuthShell>
        <h1 className="font-serif text-2xl font-bold text-forest">Invalid link</h1>
        <p className="mt-2 text-sm text-muted-foreground">This reset link is missing a token. Use the forgot-password page to request a new one.</p>
        <Link href="/forgot-password" className="mt-4 inline-flex text-sm font-medium text-forest hover:text-forest-light">Request a reset link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-serif text-2xl font-bold text-forest">Set a new password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="password">New password</Label>
          <div className="relative mt-1">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-9" placeholder="At least 8 characters" aria-invalid={!!errors.password} />
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative mt-1">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="pl-9" aria-invalid={!!errors.confirmPassword} />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
        </div>
        {serverError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>}
        <Button type="submit" disabled={loading} className="w-full gap-2 bg-forest hover:bg-forest-light">
          {loading ? "Saving…" : <>Reset Password <ArrowRight size={15} /></>}
        </Button>
      </form>
    </AuthShell>
  );
}
