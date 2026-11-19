"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type FAQ = { id: string; category: string; question: string; answer: string; sortOrder: number; isActive: boolean };

export function FAQManager({ initialFaqs }: { initialFaqs: FAQ[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ category: "General", question: "", answer: "", isActive: true });

  async function save() {
    if (!form.question || !form.answer) { toast.error("Question and answer are required."); return; }
    setBusy(true);
    const res = await fetch("/api/admin/faqs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, sortOrder: initialFaqs.length }) });
    setBusy(false);
    if (res.ok) { toast.success("FAQ added."); setForm({ category: "General", question: "", answer: "", isActive: true }); setShowForm(false); router.refresh(); }
    else toast.error("Add failed.");
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("FAQ deleted."); router.refresh(); }
    else toast.error("Delete failed.");
  }

  async function toggle(id: string, current: boolean) {
    await fetch(`/api/admin/faqs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !current }) });
    router.refresh();
  }

  return (
    <div>
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="gap-2 bg-forest hover:bg-forest-light"><Plus size={15} /> Add FAQ</Button>
      ) : (
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="space-y-3">
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1" /></div>
            <div><Label>Question</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="mt-1" /></div>
            <div><Label>Answer (HTML allowed)</Label><textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="mt-1 min-h-[80px] w-full rounded-lg border border-border px-3 py-2 text-sm" /></div>
            <label className="flex items-center gap-2 text-sm text-forest"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-forest" /> Active</label>
            <div className="flex gap-2">
              <Button onClick={save} disabled={busy} className="gap-2 bg-forest hover:bg-forest-light">{busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-5 space-y-2">
        {initialFaqs.map((f) => (
          <div key={f.id} className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-blush-dark">{f.category}</p>
              <p className="mt-0.5 text-sm font-medium text-forest">{f.question}</p>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: f.answer }} />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => toggle(f.id, f.isActive)} className="rounded p-1.5 text-forest hover:bg-forest/5">{f.isActive ? <Eye size={14} /> : <EyeOff size={14} />}</button>
              <button onClick={() => remove(f.id)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
