import { Lock } from "lucide-react";

/**
 * Payment methods display — shows recognized payment method badges.
 *
 * Shows Clover-supported payment methods (Visa, Mastercard, Amex, Discover).
 * If Clover is NOT configured (no CLOVER_ACCESS_TOKEN in env), the section
 * renders in "preview" mode with a note that payments are not yet active.
 *
 * Includes a "Secure Payments" security message with a lock icon.
 *
 * Used in the footer and near the checkout payment section.
 */

const PAYMENT_METHODS = [
  { name: "Visa", svg: "visa" },
  { name: "Mastercard", svg: "mc" },
  { name: "American Express", svg: "amex" },
  { name: "Discover", svg: "discover" },
];

function PaymentBadge({ name, svg }: { name: string; svg: string }) {
  return (
    <div
      className="flex h-7 w-12 items-center justify-center rounded border border-border bg-white px-1"
      title={name}
      aria-label={name}
    >
      <PaymentLogo type={svg} />
    </div>
  );
}

function PaymentLogo({ type }: { type: string }) {
  // Simple text-based logos — recognizable without external assets.
  // These are the payment methods supported by Clover's card processing.
  switch (type) {
    case "visa":
      return <span className="text-[10px] font-bold italic tracking-tight text-[#1A1F71]">VISA</span>;
    case "mc":
      return (
        <span className="flex items-center -space-x-1">
          <span className="h-3 w-3 rounded-full bg-[#EB001B] opacity-90" />
          <span className="h-3 w-3 rounded-full bg-[#F79E1B] opacity-90" />
        </span>
      );
    case "amex":
      return <span className="text-[8px] font-bold tracking-tight text-[#006FCF]">AMEX</span>;
    case "discover":
      return <span className="text-[8px] font-bold tracking-tight text-[#FF6000]">DISC</span>;
    default:
      return null;
  }
}

export function PaymentMethods({ variant = "footer" }: { variant?: "footer" | "checkout" }) {
  const cloverConfigured = !!process.env.CLOVER_ACCESS_TOKEN;

  if (variant === "checkout") {
    return (
      <div className="rounded-xl border border-border bg-white p-4">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-forest" />
          <span className="text-sm font-semibold text-forest">Secure Checkout</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {PAYMENT_METHODS.map((m) => (
            <PaymentBadge key={m.name} {...m} />
          ))}
        </div>
        {!cloverConfigured && (
          <p className="mt-3 text-xs text-muted-foreground">
            Payment processing is not yet active. Checkout is in preview mode.
          </p>
        )}
      </div>
    );
  }

  // Footer variant
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <Lock size={14} className="text-cream/60" />
        <span className="text-xs font-medium text-cream/80">Secure Payments</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {PAYMENT_METHODS.map((m) => (
          <PaymentBadge key={m.name} {...m} />
        ))}
      </div>
      {!cloverConfigured && (
        <p className="mt-2 text-[10px] text-cream/40">
          Payment methods pending activation
        </p>
      )}
    </div>
  );
}
