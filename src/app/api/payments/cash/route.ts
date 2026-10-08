/**
 * POST /api/payments/cash
 *
 * Record a cash payment against an invoice.
 * Authenticates the garage user, validates amount against current due,
 * inserts a success payment record, and reconciles invoice + customer.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { verifyApiRequest } from "@/lib/auth";
import { cashPaymentSchema, validatePaymentAmount, validateInvoiceExists } from "@/lib/payments/payment-validation";
import { reconcileInvoiceStatus, reconcileCustomerBalance } from "@/lib/payments/payment-calculations";
import { revalidatePath } from "next/cache";

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

  const parsed = cashPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { invoiceId, amount: amountInr, notes } = parsed.data;

  try {
    // ─── 3. Confirm invoice exists ──────────────────────────────────
    const invoice = await validateInvoiceExists(invoiceId);

    // ─── 4. Validate amount against current due ─────────────────────
    const { amountPaise } = await validatePaymentAmount(invoiceId, amountInr);

    // ─── 5. Insert successful CASH payment ──────────────────────────
    const [payment] = await db
      .insert(payments)
      .values({
        invoiceId,
        amount: amountPaise,
        paymentMethod: "cash",
        status: "success",
        paidAt: new Date(),
        source: "cash_manual",
        notes: notes ?? null,
      })
      .returning();

    // ─── 6. Reconcile invoice status ────────────────────────────────
    const summary = await reconcileInvoiceStatus(invoiceId);

    // ─── 7. Reconcile customer outstanding balance ───────────────────
    await reconcileCustomerBalance(invoice.customerId);

    // ─── 8. Revalidate UI ───────────────────────────────────────────
    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amountPaise: payment.amount,
        amountInr: payment.amount / 100,
        status: payment.status,
        paidAt: payment.paidAt,
      },
      invoice: {
        paymentStatus: summary.paymentStatus,
        paidAmountInr: summary.paidAmountInr,
        dueAmountInr: summary.dueAmountInr,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
