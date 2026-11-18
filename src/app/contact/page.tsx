"use client";

import { useState } from "react";
import { Send, Loader2, Mail, MapPin, Clock } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) { toast.error("Please fill in all fields."); return; }
    setLoading(true);
    const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) { toast.success("Message sent!"); setSent(true); setForm({ name: "", email: "", subject: "", message: "" }); }
    else toast.error("Failed to send. Please try again.");
  }

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
        <h1 className="mt-4 font-serif text-3xl font-bold text-forest sm:text-4xl">Contact Us</h1>
        <p className="mt-2 text-sm text-muted-foreground">We&apos;d love to hear from you. Send us a message below.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* Contact info */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-white p-5">
              <Mail size={18} className="text-forest-light" />
              <p className="mt-2 text-sm font-semibold text-forest">Email</p>
              <p className="text-sm text-muted-foreground">Verified contact email will appear here once configured by the store owner.</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-5">
              <Clock size={18} className="text-forest-light" />
              <p className="mt-2 text-sm font-semibold text-forest">Business Hours</p>
              <p className="text-sm text-muted-foreground">Business hours will be displayed here once verified and configured.</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-5">
              <MapPin size={18} className="text-forest-light" />
              <p className="mt-2 text-sm font-semibold text-forest">Address</p>
              <p className="text-sm text-muted-foreground">Verified business address will appear here once configured.</p>
            </div>
          </div>

          {/* Contact form */}
          <div className="rounded-xl border border-border bg-white p-6">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="font-sans text-base font-semibold text-forest">Message sent!</p>
                <p className="mt-1 text-sm text-muted-foreground">Thank you for reaching out. We&apos;ll respond to your email soon.</p>
                <button onClick={() => setSent(false)} className="mt-3 text-sm font-medium text-forest hover:text-forest-light">Send another</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
                </div>
                <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1" /></div>
                <div><Label>Message</Label><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1 min-h-[120px] w-full rounded-lg border border-border px-3 py-2 text-sm" /></div>
                <Button type="submit" disabled={loading} className="gap-2 bg-forest hover:bg-forest-light">{loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send Message</Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
