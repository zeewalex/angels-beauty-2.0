"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SupportPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) { toast.error("Please fill in all fields."); return; }
    setLoading(true);
    const res = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) { toast.success("Your support request has been submitted."); setSent(true); setForm({ name: "", email: "", subject: "", message: "" }); }
    else toast.error("Submission failed. Please try again.");
  }

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Support" }]} />
        <h1 className="mt-4 font-serif text-3xl font-bold text-forest sm:text-4xl">Customer Support</h1>
        <p className="mt-2 text-sm text-muted-foreground">Need help? Send us a message and we&apos;ll get back to you.</p>
        {sent ? (
          <div className="mt-6 rounded-xl border border-forest/20 bg-forest/5 p-6 text-center">
            <p className="font-sans text-base font-semibold text-forest">Request submitted!</p>
            <p className="mt-1 text-sm text-muted-foreground">We&apos;ve received your support request and will respond to your email shortly.</p>
            <button onClick={() => setSent(false)} className="mt-3 text-sm font-medium text-forest hover:text-forest-light">Send another message</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-border bg-white p-6">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1" /></div>
            <div><Label>Message</Label><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1 min-h-[120px] w-full rounded-lg border border-border px-3 py-2 text-sm" /></div>
            <Button type="submit" disabled={loading} className="gap-2 bg-forest hover:bg-forest-light">{loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Submit</Button>
          </form>
        )}
      </div>
    </StorefrontShell>
  );
}
