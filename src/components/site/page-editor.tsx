"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function PageEditor({ slug, initialTitle, initialBody }: { slug: string; initialTitle: string; initialBody?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/pages/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, published: true }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Page saved — changes are live."); router.refresh(); }
    else toast.error("Save failed.");
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="rounded-xl border border-border bg-white p-5">
        <div><Label>Page Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" /></div>
        <div className="mt-4">
          <Label>Page Content (HTML)</Label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 min-h-[400px] w-full rounded-lg border border-border px-3 py-2 text-sm font-mono" />
        </div>
        <div className="mt-4">
          <Button onClick={save} disabled={saving} className="gap-2 bg-forest hover:bg-forest-light">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save & Publish
          </Button>
          <span className="ml-3 text-xs text-muted-foreground">Changes appear immediately on the public page.</span>
        </div>
      </div>
    </div>
  );
}
