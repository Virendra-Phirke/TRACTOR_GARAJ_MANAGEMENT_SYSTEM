/**
 * POST /api/webhooks/razorpay
 *
 * Razorpay webhook receiver with:
 * - Raw body HMAC-SHA256 signature verification (before JSON.parse)
 * - Event idempotency via paymentWebhookEvents.eventId
 * - Payment state reconciliation for key events
 * - Amount + currency validation
 * - Duplicate webhook protection
 *
 * Returns 2xx for all valid (including duplicate) webhooks.
 * Returns 4xx only for invalid signatures.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, paymentWebhookEvents, invoices } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { reconcileInvoiceStatus, reconcileCustomerBalance } from "@/lib/payments/payment-calculations";
import { revalidatePath } from "next/cache";

// Supported events we process
const SUPPORTED_EVENTS = new Set([
  "payment.authorized",
  "payment.captured",
  "payment.failed",
  "order.paid",
]);

export async function POST(request: NextRequest) {
  // ─── 1. Read RAW body BEFORE any parsing ─────────────────────────────
  //        Razorpay signs the exact raw bytes. Never sign the parsed body.
  const rawBody = await request.text();

  // ─── 2. Read + verify HMAC-SHA256 signature ──────────────────────────
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    // Reject invalid signatures immediately
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  // ─── 3. Parse event ONLY after signature validation ───────────────────
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ─── 4. Read event ID (idempotency key) ──────────────────────────────
  const eventId =
    (event["id"] as string) ??
    (event["entity"] as string) ??
    null;

  if (!eventId) {
    // Cannot guarantee idempotency without an event ID — return 2xx anyway
    return NextResponse.json({ received: true });
  }

  const eventType = (event["event"] as string) ?? "unknown";

  // ─── 5. Idempotency check ─────────────────────────────────────────────
  const [existingEvent] = await db
    .select({ id: paymentWebhookEvents.id, processed: paymentWebhookEvents.processed })
    .from(paymentWebhookEvents)
    .where(eq(paymentWebhookEvents.eventId, eventId))
    .limit(1);

  if (existingEvent?.processed) {
    // Already processed — return 2xx without reprocessing
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ─── 6. Store the webhook event (audit trail) ─────────────────────────
  let webhookRowId: number;
  if (existingEvent) {
    // Event stored but not yet processed (e.g. previous run crashed)
    webhookRowId = existingEvent.id;
  } else {
    const [inserted] = await db
      .insert(paymentWebhookEvents)
      .values({
        eventId,
        eventType,
        payload: event as Record<string, unknown>,
        processed: false,
      })
      .returning();
    webhookRowId = inserted.id;
  }

  // ─── 7. Process the event ─────────────────────────────────────────────
  try {
    if (SUPPORTED_EVENTS.has(eventType)) {
      await processPaymentEvent(eventType, event);
    }
    // Unsupported events are stored but not processed — return 2xx

    // ─── 8. Mark as processed ───────────────────────────────────────────
    await db
      .update(paymentWebhookEvents)
      .set({ processed: true, processedAt: new Date() })
      .where(eq(paymentWebhookEvents.id, webhookRowId));

    revalidatePath("/", "layout");
  } catch (err) {
    // Log but return 2xx so Razorpay doesn't retry indefinitely
    // The event is stored for manual review/replay
    console.error("[webhook] Processing error:", err);
  }

  return NextResponse.json({ received: true });
}

// ─── Event processors ────────────────────────────────────────────────────

async function processPaymentEvent(
  eventType: string,
  event: Record<string, unknown>
): Promise<void> {
  const payload = event["payload"] as Record<string, unknown> | undefined;
  const paymentEntity =
    (payload?.["payment"] as Record<string, unknown> | undefined)?.["entity"] as
      | Record<string, unknown>
      | undefined;
  const orderEntity =
    (payload?.["order"] as Record<string, unknown> | undefined)?.["entity"] as
      | Record<string, unknown>
      | undefined;

  if (eventType === "order.paid") {
    // order.paid is an order-level event — find by order ID
    const razorpayOrderId =
      (orderEntity?.["id"] as string) ??
      (paymentEntity?.["order_id"] as string);
    if (!razorpayOrderId) return;
    await handleOrderPaid(razorpayOrderId, paymentEntity);
    return;
  }

  if (!paymentEntity) return;

  const razorpayPaymentId = paymentEntity["id"] as string;
  const razorpayOrderId = paymentEntity["order_id"] as string;

  if (!razorpayPaymentId || !razorpayOrderId) return;

  switch (eventType) {
    case "payment.captured":
      await handlePaymentCaptured(razorpayOrderId, razorpayPaymentId, paymentEntity);
      break;
    case "payment.authorized":
      // authorized = money reserved, not yet captured
      // For UPI, captured follows quickly; we update to a transitional state
      await handlePaymentAuthorized(razorpayOrderId, razorpayPaymentId, paymentEntity);
      break;
    case "payment.failed":
      await handlePaymentFailed(razorpayOrderId, razorpayPaymentId, paymentEntity);
      break;
  }
}

async function handlePaymentCaptured(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  paymentEntity: Record<string, unknown>
): Promise<void> {
  // Find the local pending payment by order ID
  const [localPayment] = await db
    .select()
    .from(payments)
    .where(eq(payments.razorpayOrderId, razorpayOrderId))
    .limit(1);

  if (!localPayment) return; // Unknown order — skip

  // Guard: already succeeded (e.g., checkout verify ran first)
  if (localPayment.status === "success") return;

  // Guard: razorpayPaymentId already attached to another record
  const [existingPayment] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.razorpayPaymentId, razorpayPaymentId))
    .limit(1);

  if (existingPayment && existingPayment.id !== localPayment.id) return;

  // Amount + currency validation
  const gatewayAmountPaise = Number(paymentEntity["amount"] ?? 0);
  const currency = paymentEntity["currency"] as string;

  if (currency !== "INR") {
    await db
      .update(payments)
      .set({
        status: "failed",
        failureReason: `Invalid currency: ${currency}`,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, localPayment.id));
    return;
  }

  if (gatewayAmountPaise !== localPayment.amount) {
    // Amount mismatch — flag, do not credit
    await db
      .update(payments)
      .set({
        status: "failed",
        razorpayPaymentId,
        failureReason: `Amount mismatch: expected ${localPayment.amount} paise, got ${gatewayAmountPaise} paise`,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, localPayment.id));
    return;
  }

  // All checks passed — mark SUCCESS
  await db
    .update(payments)
    .set({
      status: "success",
      razorpayPaymentId,
      gatewayMethod: String(paymentEntity["method"] ?? "other"),
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, localPayment.id));

  await reconcileAfterPayment(localPayment.invoiceId);
}

async function handleOrderPaid(
  razorpayOrderId: string,
  paymentEntity: Record<string, unknown> | undefined
): Promise<void> {
  // order.paid is a secondary signal — use payment.captured as primary
  // Only update if still pending
  const [localPayment] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.razorpayOrderId, razorpayOrderId),
        eq(payments.status, "pending")
      )
    )
    .limit(1);

  if (!localPayment) return;

  if (paymentEntity) {
    const razorpayPaymentId = paymentEntity["id"] as string;
    if (razorpayPaymentId) {
      await handlePaymentCaptured(razorpayOrderId, razorpayPaymentId, paymentEntity);
    }
  }
}

async function handlePaymentAuthorized(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  _paymentEntity: Record<string, unknown>
): Promise<void> {
  // Authorized = money reserved. For auto-capture, captured event follows.
  // Update razorpayPaymentId so we can track the payment, but keep pending.
  const [localPayment] = await db
    .select({ id: payments.id, status: payments.status })
    .from(payments)
    .where(eq(payments.razorpayOrderId, razorpayOrderId))
    .limit(1);

  if (!localPayment || localPayment.status !== "pending") return;

  await db
    .update(payments)
    .set({
      razorpayPaymentId,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, localPayment.id));
}

async function handlePaymentFailed(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  paymentEntity: Record<string, unknown>
): Promise<void> {
  const [localPayment] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.razorpayOrderId, razorpayOrderId),
        eq(payments.status, "pending")
      )
    )
    .limit(1);

  if (!localPayment) return;

  // Never downgrade a SUCCESS to FAILED (out-of-order protection)
  if (localPayment.status === "success") return;

  const errorDesc =
    (paymentEntity["error_description"] as string) ??
    (paymentEntity["error_code"] as string) ??
    "Payment failed";

  await db
    .update(payments)
    .set({
      status: "failed",
      razorpayPaymentId,
      failureReason: errorDesc,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, localPayment.id));
}

// ─── Shared post-success reconciliation ────────────────────────────────

async function reconcileAfterPayment(invoiceId: number): Promise<void> {
  await reconcileInvoiceStatus(invoiceId);

  const [inv] = await db
    .select({ customerId: invoices.customerId })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (inv) {
    await reconcileCustomerBalance(inv.customerId);
  }
}
