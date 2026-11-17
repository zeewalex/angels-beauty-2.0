"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/lib/schemas";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setError(null); setLoading(true);
    await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setLoading(false); setSent(true);
  }

  return (
    <AuthShell>
      {sent ? (
        <div className="text-center">
          <CheckCircle2 size={36} className="mx-auto text-forest-light" />
          <h1 className="mt-3 font-serif text-2xl font-bold text-forest">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">If an account exists for {email}, a reset link has been sent. (Dev mode: the link is logged to the server console.)</p>
          <Link href="/login" className="mt-4 inline-flex text-sm font-medium text-forest hover:text-forest-light">Back to sign in</Link>
        </div>
      ) : (
        <>
          <h1 className="font-serif text-2xl font-bold text-forest">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="you@example.com" />
              </div>
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
            <Button type="submit" disabled={loading} className="w-full gap-2 bg-forest hover:bg-forest-light">
              {loading ? "Sending…" : <>Send Reset Link <ArrowRight size={15} /></>}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/login" className="font-medium text-forest hover:text-forest-light">Back to sign in</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
