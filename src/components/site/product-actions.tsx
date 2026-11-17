"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, RotateCcw } from "lucide-react";

export function ProductActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const archived = status === "ARCHIVED";
  async function act() {
    const res = await fetch(`/api/admin/products/${id}?action=${archived ? "restore" : "archive"}`, { method: "POST" });
    if (res.ok) { toast.success(archived ? "Product restored." : "Product archived."); router.refresh(); }
    else toast.error("Action failed.");
  }
  return (
    <button onClick={act}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${archived ? "border border-forest/30 text-forest hover:bg-forest/5" : "border border-amber-300 text-amber-700 hover:bg-amber-50"}`}>
      {archived ? <><RotateCcw size={12} /> Restore</> : <><Archive size={12} /> Archive</>}
    </button>
  );
}
