"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * DEV-ONLY control to simulate the payment-provider result so the pending-order
 * lifecycle can be demonstrated. In production, payment status is set only by a
 * verified Clover webhook — this control is not rendered in production builds.
 */
export function OrderPaymentActions({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"success" | "failure" | null>(null);

  async function simulate(outcome: "success" | "failure") {
    setBusy(outcome);
    const res = await fetch(`/api/checkout/${orderNumber}/simulate-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    setBusy(null);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success(outcome === "success" ? "Payment successful — order confirmed." : "Payment failed — reservation released.");
      router.refresh();
    } else {
      toast.error(data?.error?.message || "Simulation failed.");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-dashed border-forest/30 bg-cream/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-forest/70">
        Dev only — simulate payment provider
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        No live Clover is connected. Use these to test the pending-order lifecycle.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => simulate("success")} disabled={busy !== null} className="gap-2 bg-forest hover:bg-forest-light">
          {busy === "success" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          Simulate Successful Payment
        </Button>
        <Button onClick={() => simulate("failure")} disabled={busy !== null} variant="outline" className="gap-2 border-red-300 text-red-600 hover:bg-red-50">
          {busy === "failure" ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
          Simulate Failed Payment
        </Button>
      </div>
    </div>
  );
}
