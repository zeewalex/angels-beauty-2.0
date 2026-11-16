"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function FulfillmentEditor({ orderId, current }: { orderId: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [loading, setLoading] = useState(false);
  async function save() {
    setLoading(true);
    const res = await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fulfillmentStatus: status }) });
    setLoading(false);
    if (res.ok) { toast.success("Fulfillment updated."); router.refresh(); }
    else toast.error("Update failed.");
  }
  return (
    <div className="flex items-center gap-2">
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border border-border bg-white px-3 text-sm">
        <option value="UNFULFILLED">Unfulfilled</option>
        <option value="PARTIAL">Partial</option>
        <option value="FULFILLED">Fulfilled</option>
      </select>
      <Button onClick={save} disabled={loading || status === current} className="gap-2 bg-forest hover:bg-forest-light">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
      </Button>
      <p className="text-xs text-muted-foreground">Payment status is read-only (changed only by a verified payment result).</p>
    </div>
  );
}
