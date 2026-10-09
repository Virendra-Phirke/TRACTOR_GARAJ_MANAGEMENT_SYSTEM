/**
 * POST /api/payments/razorpay/create-order
 *
 * Creates a Razorpay order server-side and inserts a local PENDING payment.
 * Returns only safe checkout data (public key + order ID).
 * Never trusts client-provided amount as final financial value.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyApiRequest } from "@/lib/auth";
import {
  createOrderSchema,
  validatePaymentAmount,
  validateInvoiceExists,
} from "@/lib/payments/payment-validation";
import {
  createRazorpayOrder,
  extractRazorpayErrorMessage,
} from "@/lib/payments/razorpay";

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

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { invoiceId, amount: amountInr } = parsed.data;

  try {
    // ─── 3. Confirm invoice exists ──────────────────────────────────
    const invoice = await validateInvoiceExists(invoiceId);
    if (invoice.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "This invoice is already paid in full. No payment required." },
        { status: 400 }
      );
    }

    // ─── 4. Validate amount against current due ─────────────────────
    //        Server re-validates — never trust client amount as final.
    const { amountPaise } = await validatePaymentAmount(invoiceId, amountInr);

    // ─── 5. Insert a local PENDING online payment (no Razorpay ID yet)
    const [localPayment] = await db
      .insert(payments)
      .values({
        invoiceId,
        amount: amountPaise,
        paymentMethod: "online",
        status: "pending",
        source: "razorpay_checkout",
      })
      .returning();

    // ─── 6. Create Razorpay order server-side ───────────────────────
    let order;
    try {
      order = await createRazorpayOrder({
        amountPaise,
        localPaymentId: localPayment.id,
        invoiceNumber: invoice.invoiceNumber,
      });
    } catch (orderErr) {
      const errorDesc = extractRazorpayErrorMessage(orderErr);
      const isLimit = /amount exceeds maximum|exceeds/i.test(errorDesc);
      await db
        .update(payments)
        .set({
          status: "failed",
          failureReason: isLimit
            ? `Amount exceeds Razorpay transaction limit: ${errorDesc}`
            : `Order creation failed: ${errorDesc}`,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, localPayment.id));

      return NextResponse.json(
        {
          error: isLimit
            ? `Invoice amount exceeds online payment gateway limit. Please collect payment via Bank Transfer or Direct UPI.`
            : `Failed to initiate online payment: ${errorDesc}`,
          isAmountExceeded: isLimit,
          details: errorDesc,
        },
        { status: 400 }
      );
    }

    // ─── 7. Store Razorpay order ID against the local payment ────────
    await db
      .update(payments)
      .set({
        razorpayOrderId: order.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, localPayment.id));

    // ─── 8. Return ONLY safe checkout data ──────────────────────────
    //        NEVER send RAZORPAY_KEY_SECRET or RAZORPAY_WEBHOOK_SECRET
    return NextResponse.json({
      localPaymentId: localPayment.id,
      razorpayOrderId: order.id,
      amountPaise,
      currency: order.currency,
      publicKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    const message = extractRazorpayErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
