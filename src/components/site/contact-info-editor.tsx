"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ContactInfoEditor() {
  const router = useRouter();
  const [form, setForm] = useState({ contact_email: "", contact_phone: "", contact_address: "", business_hours: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/contact-info").then((r) => r.json()).then((data) => {
      if (data.settings) setForm({ contact_email: data.settings.contact_email || "", contact_phone: data.settings.contact_phone || "", contact_address: data.settings.contact_address || "", business_hours: data.settings.business_hours || "" });
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/contact-info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast.success("Contact information saved."); router.refresh(); }
    else toast.error("Save failed.");
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-lg space-y-4 rounded-xl border border-border bg-white p-5">
      <p className="text-sm text-muted-foreground">These details appear on the Contact page. Leave blank to hide a field.</p>
      <div><Label>Contact Email</Label><Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="mt-1" placeholder="support@angelsbeauties.shop" /></div>
      <div><Label>Contact Phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="mt-1" placeholder="+1 234 567 8900" /></div>
      <div><Label>Business Address</Label><Input value={form.contact_address} onChange={(e) => setForm({ ...form, contact_address: e.target.value })} className="mt-1" placeholder="123 Beauty Lane, City, State" /></div>
      <div><Label>Business Hours</Label><Input value={form.business_hours} onChange={(e) => setForm({ ...form, business_hours: e.target.value })} className="mt-1" placeholder="Mon-Fri 9am-5pm" /></div>
      <Button onClick={save} disabled={saving} className="gap-2 bg-forest hover:bg-forest-light">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Contact Info</Button>
    </div>
  );
}
