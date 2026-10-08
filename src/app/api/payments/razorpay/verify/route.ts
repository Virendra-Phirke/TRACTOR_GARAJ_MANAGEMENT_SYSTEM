/**
 * POST /api/payments/razorpay/verify
 *
 * Verifies a Razorpay checkout callback.
 *
 * Checks:
 * 1. Local payment exists and is pending.
 * 2. Order ID matches stored value.
 * 3. HMAC-SHA256 signature is valid.
 * 4. Amount and currency match.
 * 5. Updates only the matching payment record.
 *
 * Webhook reconciliation handles async final state.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyApiRequest } from "@/lib/auth";
import { verifyPaymentSchema } from "@/lib/payments/payment-validation";
import { verifyCheckoutSignature, fetchRazorpayPayment } from "@/lib/payments/razorpay";
import { reconcileInvoiceStatus, reconcileCustomerBalance } from "@/lib/payments/payment-calculations";
import { revalidatePath } from "next/cache";
import { invoices } from "@/db/schema";

export async function POST(request: NextRequest) {
  // ─── 1. Authenticate ────────────────────────────────────────────────
  const authenticated = await verifyApiRequest(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ─── 2. Parse + validate input ──────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const {
    localPaymentId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = parsed.data;

  try {
    // ─── 3. Find local pending payment ──────────────────────────────
    const [localPayment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.id, localPaymentId),
          eq(payments.status, "pending"),
          eq(payments.paymentMethod, "online")
        )
      )
      .limit(1);

    if (!localPayment) {
      return NextResponse.json(
        { error: "Payment not found or already processed." },
        { status: 404 }
      );
    }

    // ─── 4. Confirm order ID matches stored value ────────────────────
    if (localPayment.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json(
        { error: "Order ID mismatch." },
        { status: 400 }
      );
    }

    // ─── 5. Verify HMAC-SHA256 checkout signature ────────────────────
    const signatureValid = verifyCheckoutSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!signatureValid) {
      return NextResponse.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    // ─── 6. Fetch payment from Razorpay to validate amount/currency ──
    const gatewayPayment = await fetchRazorpayPayment(razorpayPaymentId);

    // Amount validation — stored paise must match gateway paise
    const gatewayAmountPaise = Number(gatewayPayment.amount);
    if (gatewayAmountPaise !== localPayment.amount) {
      // Amount mismatch — flag for investigation, do not credit
      await db
        .update(payments)
        .set({
          status: "failed",
          razorpayPaymentId,
          razorpaySignature,
          failureReason: `Amount mismatch: expected ${localPayment.amount} paise, got ${gatewayAmountPaise} paise`,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, localPaymentId));

      return NextResponse.json(
        { error: "Payment amount mismatch. Transaction flagged for investigation." },
        { status: 400 }
      );
    }

    // Currency validation
    if (gatewayPayment.currency !== "INR") {
      return NextResponse.json(
        { error: "Invalid currency. Only INR is accepted." },
        { status: 400 }
      );
    }

    // ─── 7. Check razorpayPaymentId is not already used ─────────────
    const [duplicate] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.razorpayPaymentId, razorpayPaymentId))
      .limit(1);

    if (duplicate) {
      return NextResponse.json(
        { error: "Payment already processed." },
        { status: 409 }
      );
    }

    // ─── 8. Mark payment as success ─────────────────────────────────
    await db
      .update(payments)
      .set({
        status: "success",
        razorpayPaymentId,
        razorpaySignature,
        gatewayMethod: String(gatewayPayment.method ?? "other"),
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, localPaymentId));

    // ─── 9. Get invoice's customer for balance reconciliation ─────────
    const [inv] = await db
      .select({ customerId: invoices.customerId })
      .from(invoices)
      .where(eq(invoices.id, localPayment.invoiceId))
      .limit(1);

    // ─── 10. Reconcile invoice + customer ────────────────────────────
    const summary = await reconcileInvoiceStatus(localPayment.invoiceId);
    if (inv) await reconcileCustomerBalance(inv.customerId);

    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      invoice: {
        paymentStatus: summary.paymentStatus,
        paidAmountInr: summary.paidAmountInr,
        dueAmountInr: summary.dueAmountInr,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
