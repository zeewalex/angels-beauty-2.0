/**
 * EasyPost shipping integration (TEST MODE only).
 *
 * CREDENTIALS (env vars):
 *  EASYPOST_API_KEY  — test API key (starts with ez_)
 *
 * If absent (dev without test key), falls back to flat-rate shipping ($5.99,
 * free over $50) so checkout works end-to-end.
 */

const HAS_EASYPOST = !!process.env.EASYPOST_API_KEY;
const FLAT_RATE_CENTS = 599;
const FREE_SHIPPING_THRESHOLD_CENTS = 5000;

export type ShippingRate = {
  id: string;
  carrier: string;
  service: string;
  rateCents: number;
  estDeliveryDays: number;
};

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

/**
 * Validate a shipping address via EasyPost.
 * Returns { valid, error? }.
 */
export async function validateAddress(addr: ShippingAddress): Promise<{ valid: boolean; error?: string }> {
  if (!HAS_EASYPOST) return { valid: true }; // dev: accept all
  try {
    const res = await fetch("https://api.easypost.com/v2/addresses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${Buffer.from(process.env.EASYPOST_API_KEY!).toString("base64")}` },
      body: JSON.stringify({ address: { street1: addr.line1, street2: addr.line2, city: addr.city, state: addr.state, zip: addr.postalCode, country: addr.country } }),
    });
    if (res.ok) return { valid: true };
    const data = await res.json();
    return { valid: false, error: data.error?.message || "Address verification failed" };
  } catch {
    return { valid: false, error: "Address verification request error" };
  }
}

/**
 * Retrieve shipping rates for a cart + destination.
 * Falls back to flat-rate in dev.
 */
export async function getShippingRates(params: {
  subtotalCents: number;
  weightOz: number;
  toAddress: ShippingAddress;
}): Promise<ShippingRate[]> {
  if (!HAS_EASYPOST) {
    const free = params.subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
    return [{
      id: "flat-rate",
      carrier: "Angels Beauty",
      service: "Standard Shipping",
      rateCents: free ? 0 : FLAT_RATE_CENTS,
      estDeliveryDays: 4,
    }];
  }
  try {
    // In production: create a Shipment via EasyPost API with the from/to addresses
    // + parcel (weight) and return the rates array.
    // Simplified here — the full EasyPost Shipment creation would go here.
    return [{
      id: "easypost-rate-1",
      carrier: "USPS",
      service: "Priority",
      rateCents: 799,
      estDeliveryDays: 3,
    }];
  } catch {
    return [{
      id: "fallback-flat-rate",
      carrier: "Angels Beauty",
      service: "Standard Shipping",
      rateCents: FLAT_RATE_CENTS,
      estDeliveryDays: 4,
    }];
  }
}

/**
 * Create a test shipment (tracking only — no real label purchase).
 * Returns a tracker ID for the shipment.
 */
export async function createTestShipment(params: {
  toAddress: ShippingAddress;
  orderId: string;
}): Promise<{ trackerId: string | null }> {
  if (!HAS_EASYPOST) {
    return { trackerId: `test_tracker_${params.orderId.slice(-8)}` };
  }
  // Production: create a Shipment + buy a label (TEST mode) via EasyPost API.
  // For now, return a test tracker.
  return { trackerId: `test_tracker_${params.orderId.slice(-8)}` };
}
