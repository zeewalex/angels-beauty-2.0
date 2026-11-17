import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendShippingNotificationEmail } from "@/lib/email";

/**
 * POST /api/webhooks/easypost — EasyPost tracker webhook.
 *
 * Handles tracker.updated events (tracking status changes).
 * - Idempotent via WebhookEvent.externalId.
 * - Updates the shipment status + sends a shipping notification email.
 *
 * Public endpoint; EasyPost signs webhooks (verification would use EasyPost's
 * HMAC signature header — implemented when the test API key is provided).
 */
export async function POST(req: Request) {
  const body = await req.text();
  const event = JSON.parse(body);

  const externalId = event.id || `easypost-${Date.now()}`;
  const existing = await db.webhookEvent.findUnique({ where: { provider_externalId: { provider: "easypost", externalId } } });
  if (existing?.status === "PROCESSED") return NextResponse.json({ ok: true, alreadyProcessed: true });

  const whEvent = await db.webhookEvent.create({
    data: { provider: "easypost", eventType: event.type || "tracker.updated", externalId, payload: event, status: "PROCESSING" },
  });

  try {
    if (event.type === "tracker.updated" || event.type === "tracker.created") {
      const trackerId = event.result?.id;
      const status = event.result?.status || "unknown";
      const trackingNumber = event.result?.tracking_code;

      if (trackerId) {
        const shipment = await db.shipment.findFirst({ where: { easypostTrackerId: trackerId }, include: { order: true } });
        if (shipment?.order) {
          const statusMap: Record<string, string> = {
            "pre_transit": "LABEL_CREATED", "in_transit": "IN_TRANSIT",
            "out_for_delivery": "OUT_FOR_DELIVERY", "delivered": "DELIVERED",
            "return": "RETURNED", "exception": "EXCEPTION",
          };
          const mappedStatus = statusMap[status] || "IN_TRANSIT";
          await db.shipment.update({ where: { id: shipment.id }, data: { status: mappedStatus as any, trackingNumber, ...(status === "delivered" ? { deliveredAt: new Date() } : {}) } });

          if (mappedStatus === "IN_TRANSIT") {
            await sendShippingNotificationEmail(shipment.order.email, shipment.order.orderNumber, trackingNumber).catch(() => {});
          }
        }
      }
    }

    await db.webhookEvent.update({ where: { id: whEvent.id }, data: { status: "PROCESSED", processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    await db.webhookEvent.update({ where: { id: whEvent.id }, data: { status: "FAILED", error: String(e) } });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
