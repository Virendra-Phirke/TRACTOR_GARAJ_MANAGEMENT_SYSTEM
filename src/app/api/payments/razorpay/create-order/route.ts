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
import { createRazorpayOrder } from "@/lib/payments/razorpay";

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
    const order = await createRazorpayOrder({
      amountPaise,
      localPaymentId: localPayment.id,
      invoiceNumber: invoice.invoiceNumber,
    });

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
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
