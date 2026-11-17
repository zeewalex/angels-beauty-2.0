"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function NewProductForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", categoryId: categories[0]?.id ?? "", price: "0", stock: "0" });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.categoryId) { toast.error("Name and category are required."); return; }
    setLoading(true);
    const res = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      name: form.name, description: form.description, categoryId: form.categoryId,
      priceCents: Math.round(parseFloat(form.price) * 100), stock: parseInt(form.stock || "0"),
    }) });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) { toast.success("Product created."); router.push(`/admin/products/${data.id}`); router.refresh(); }
    else toast.error(data?.error?.message || "Create failed.");
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border border-border bg-white p-6">
      <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
      <div><Label>Description</Label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 min-h-[80px] w-full rounded-lg border border-border px-3 py-2 text-sm" /></div>
      <div><Label>Category</Label>
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1" /></div>
        <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1" /></div>
      </div>
      <Button type="submit" disabled={loading} className="gap-2 bg-forest hover:bg-forest-light">
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Create Product
      </Button>
    </form>
  );
}
