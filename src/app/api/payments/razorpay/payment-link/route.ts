/**
 * /api/payments/razorpay/payment-link
 *
 * Handles creation, retrieval, and cancellation of Razorpay Payment Links (rzp.io).
 * These links can be shared directly via WhatsApp, SMS, or displayed to customers.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, customers } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { verifyApiRequest } from "@/lib/auth";
import { validateInvoiceExists } from "@/lib/payments/payment-validation";
import {
  calculateInvoicePaymentSummary,
  inrToPaise,
} from "@/lib/payments/payment-calculations";
import {
  createRazorpayPaymentLink,
  cancelRazorpayPaymentLink,
} from "@/lib/payments/razorpay";

export async function POST(request: NextRequest) {
  // ─── 1. Authenticate ────────────────────────────────────────────────
  const authenticated = await verifyApiRequest(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ─── 2. Parse payload ───────────────────────────────────────────────
  let body: { invoiceId?: number };
  try {
    body = (await request.json()) as { invoiceId?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const invoiceId = Number(body?.invoiceId);
  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    return NextResponse.json({ error: "Valid invoiceId is required" }, { status: 400 });
  }

  try {
    // ─── 3. Validate invoice & customer ───────────────────────────────
    const invoice = await validateInvoiceExists(invoiceId);

    const [customer] = await db
      .select({
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
      })
      .from(customers)
      .where(eq(customers.id, invoice.customerId))
      .limit(1);

    // ─── 4. Re-calculate current due balance ──────────────────────────
    const summary = await calculateInvoicePaymentSummary(invoiceId);
    if (summary.dueAmountInr <= 0) {
      return NextResponse.json(
        { error: "This invoice is already fully paid." },
        { status: 400 }
      );
    }

    const duePaise = inrToPaise(summary.dueAmountInr);

    // ─── 5. Check for existing active pending link ────────────────────
    const [existingPending] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.invoiceId, invoiceId),
          eq(payments.paymentMethod, "online"),
          eq(payments.status, "pending"),
          eq(payments.source, "razorpay_payment_link")
        )
      )
      .orderBy(desc(payments.createdAt))
      .limit(1);

    if (existingPending && existingPending.paymentLinkUrl) {
      // If amount still matches the remaining due, reuse it
      if (existingPending.amount === duePaise) {
        return NextResponse.json({
          success: true,
          shortUrl: existingPending.paymentLinkUrl,
          paymentLinkId: existingPending.razorpayPaymentLinkId,
          amountInr: summary.dueAmountInr,
          isExisting: true,
        });
      }

      // If the due amount has changed, cancel the outdated link
      if (existingPending.razorpayPaymentLinkId) {
        try {
          await cancelRazorpayPaymentLink(existingPending.razorpayPaymentLinkId);
        } catch (e) {
          console.warn("[payment-link] Could not cancel outdated link:", e);
        }
      }
      await db
        .update(payments)
        .set({
          status: "failed",
          failureReason: "Superseded by updated payment link",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, existingPending.id));
    }

    // ─── 6. Insert new local pending payment ──────────────────────────
    const [localPayment] = await db
      .insert(payments)
      .values({
        invoiceId,
        amount: duePaise,
        paymentMethod: "online",
        status: "pending",
        source: "razorpay_payment_link",
      })
      .returning();

    // ─── 7. Create Razorpay Payment Link ──────────────────────────────
    const link = await createRazorpayPaymentLink({
      amountPaise: duePaise,
      localPaymentId: localPayment.id,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      customerName: customer?.name ?? undefined,
      customerPhone: customer?.phone ?? undefined,
      customerEmail: customer?.email ?? undefined,
      description: `Payment for Invoice #${invoice.invoiceNumber}`,
    });

    // ─── 8. Update local record with gateway IDs ──────────────────────
    await db
      .update(payments)
      .set({
        razorpayPaymentLinkId: link.id,
        razorpayOrderId: link.order_id ?? null,
        paymentLinkUrl: link.short_url,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, localPayment.id));

    return NextResponse.json({
      success: true,
      shortUrl: link.short_url,
      paymentLinkId: link.id,
      amountInr: summary.dueAmountInr,
      isExisting: false,
    });
  } catch (err) {
    console.error("[payment-link] Create error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create payment link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authenticated = await verifyApiRequest(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { paymentLinkId?: string; invoiceId?: number };
  try {
    body = (await request.json()) as { paymentLinkId?: string; invoiceId?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    let paymentRecord;
    if (body.paymentLinkId) {
      [paymentRecord] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.razorpayPaymentLinkId, body.paymentLinkId),
            eq(payments.status, "pending")
          )
        )
        .limit(1);
    } else if (body.invoiceId) {
      [paymentRecord] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.invoiceId, body.invoiceId),
            eq(payments.source, "razorpay_payment_link"),
            eq(payments.status, "pending")
          )
        )
        .orderBy(desc(payments.createdAt))
        .limit(1);
    }

    if (!paymentRecord || !paymentRecord.razorpayPaymentLinkId) {
      return NextResponse.json(
        { error: "No active payment link found to cancel" },
        { status: 404 }
      );
    }

    // Cancel in Razorpay
    await cancelRazorpayPaymentLink(paymentRecord.razorpayPaymentLinkId);

    // Update local record
    await db
      .update(payments)
      .set({
        status: "failed",
        failureReason: "Cancelled by staff",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentRecord.id));

    return NextResponse.json({ success: true, message: "Payment link cancelled" });
  } catch (err) {
    console.error("[payment-link] Cancel error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to cancel payment link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
