"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function PromotionForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", code: "", type: "PERCENTAGE", value: "10", startsAt: "", endsAt: "", isActive: false });
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      name: form.name, code: form.code || undefined, type: form.type, value: parseInt(form.value),
      startsAt: form.startsAt || undefined, endsAt: form.endsAt || undefined, isActive: form.isActive,
    }) });
    setLoading(false);
    if (res.ok) { toast.success("Promotion created."); router.refresh(); }
    else toast.error("Create failed.");
  }
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
      <div><Label>Code (optional)</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="mt-1" /></div>
      <div><Label>Type</Label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed Amount</option><option value="FREE_SHIPPING">Free Shipping</option></select></div>
      <div><Label>Value (% or cents)</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="mt-1" /></div>
      <div><Label>Starts (optional)</Label><Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="mt-1" /></div>
      <div><Label>Ends (optional)</Label><Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="mt-1" /></div>
      <label className="flex items-center gap-2 text-sm text-forest"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-forest" /> Activate (records your authorization)</label>
      <Button type="submit" disabled={loading || !form.name} className="gap-2 bg-forest hover:bg-forest-light"><Plus size={15} /> Create</Button>
    </form>
  );
}
