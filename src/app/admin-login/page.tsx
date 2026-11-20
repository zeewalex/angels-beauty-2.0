"use client";

import { useState } from "react";
import { Mail, Lock, ShieldCheck, KeyRound, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

/**
 * /admin-login — one-time trusted-device enrollment page.
 *
 * This page is NOT linked from the storefront. It is reached only via the
 * five-tap logo shortcut when the device is not yet trusted (or the trust
 * has expired). It verifies:
 *   1. Admin email + password (credentials)
 *   2. Admin PIN (out-of-band secret)
 *
 * On success, a long-lived trusted-device cookie is set, and subsequent
 * five-tap shortcuts go straight to /admin with no prompt.
 *
 * If the visitor is already trusted (has the cookie), they are redirected
 * to /admin by the middleware — they never see this page.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", pin: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not verify. Please check your details.");
        setLoading(false);
        return;
      }
      // Trusted cookie is now set — go straight to admin.
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-forest" />
        <h1 className="font-serif text-2xl font-bold text-forest">Admin Access</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Verify once to trust this device. After this, five taps on the logo open
        the dashboard directly.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Admin email</Label>
          <div className="relative mt-1">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="pl-9"
              placeholder="admin@example.com"
              autoComplete="email"
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="pl-9"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="pin">Security PIN</Label>
          <div className="relative mt-1">
            <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value })}
              className="pl-9"
              placeholder="••••"
              autoComplete="off"
              required
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            The PIN was shared with you separately from your password.
          </p>
        </div>

        <Button type="submit" disabled={loading} className="w-full gap-2 bg-forest hover:bg-forest-light">
          {loading ? "Verifying…" : <>Trust this device <ArrowRight size={15} /></>}
        </Button>
      </form>

      <div className="mt-5 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
        <p>
          After verification, this device is trusted for 90 days. You can clear
          trusted devices from the admin dashboard under <strong>Settings</strong>.
        </p>
      </div>
    </AuthShell>
  );
}
