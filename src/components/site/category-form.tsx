"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function CategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    const res = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setLoading(false);
    if (res.ok) { toast.success("Category added."); setName(""); router.refresh(); }
    else toast.error("Add failed.");
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="flex-1" />
      <Button type="submit" disabled={loading || !name} className="gap-2 bg-forest hover:bg-forest-light">
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add
      </Button>
    </form>
  );
}
