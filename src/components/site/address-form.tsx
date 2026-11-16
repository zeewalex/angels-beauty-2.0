"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addressSchema } from "@/lib/schemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const empty = { firstName: "", lastName: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "", phone: "" };

export function AddressForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(compact);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) {
      const f: Record<string, string> = {};
      for (const i of parsed.error.issues) f[i.path.join(".")] = i.message;
      setErrors(f);
      return;
    }
    setErrors({});
    setLoading(true);
    const res = await fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error?.message || "Could not save address.");
      if (data?.error?.fields) setErrors(data.error.fields);
      return;
    }
    toast.success("Address saved.");
    setForm(empty);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="outline" className="gap-2 border-forest/30 text-forest" onClick={() => setOpen(true)}>
        <Plus size={16} /> Add Address
      </Button>
    );
  }

  const fld = "mt-1";
  const set = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-border bg-cream/40 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>First name</Label><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={fld} />{errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}</div>
        <div><Label>Last name</Label><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={fld} />{errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}</div>
      </div>
      <div className="mt-3"><Label>Street address</Label><Input value={form.line1} onChange={(e) => set("line1", e.target.value)} className={fld} />{errors.line1 && <p className="mt-1 text-xs text-red-600">{errors.line1}</p>}</div>
      <div className="mt-3"><Label>Apt / Suite (optional)</Label><Input value={form.line2} onChange={(e) => set("line2", e.target.value)} className={fld} /></div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div><Label>City</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} className={fld} />{errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}</div>
        <div><Label>State / Region</Label><Input value={form.state} onChange={(e) => set("state", e.target.value)} className={fld} />{errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div><Label>Postal code</Label><Input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} className={fld} />{errors.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>}</div>
        <div><Label>Country</Label><Input value={form.country} onChange={(e) => set("country", e.target.value)} className={fld} />{errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}</div>
      </div>
      <div className="mt-3"><Label>Phone (optional)</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={fld} /></div>
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={loading} className="gap-2 bg-forest hover:bg-forest-light">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Save Address
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

export function AddressActions({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
        if (res.ok) { toast.success("Address removed."); router.refresh(); }
        else toast.error("Could not remove address.");
      }}
      className="text-xs font-medium text-red-600 hover:underline"
    >
      Remove
    </button>
  );
}

export function SetDefaultButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        const res = await fetch(`/api/account/addresses/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDefault: true }) });
        if (res.ok) { toast.success("Default address updated."); router.refresh(); }
      }}
      className="text-xs font-medium text-forest hover:underline"
    >
      Set as default
    </button>
  );
}
