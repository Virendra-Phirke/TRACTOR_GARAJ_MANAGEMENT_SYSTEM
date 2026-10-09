/**
 * GET /api/invoices/[id]/payments
 *
 * Returns all payment records for an invoice.
 * Used by the UI payment history panel.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyApiRequest } from "@/lib/auth";
import { calculateInvoicePaymentSummary } from "@/lib/payments/payment-calculations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyApiRequest(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoiceId = parseInt(id, 10);
  if (isNaN(invoiceId)) {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
  }

  try {
    const [paymentRows, summary] = await Promise.all([
      db
        .select({
          id: payments.id,
          amount: payments.amount,
          paymentMethod: payments.paymentMethod,
          status: payments.status,
          gatewayMethod: payments.gatewayMethod,
          razorpayOrderId: payments.razorpayOrderId,
          razorpayPaymentId: payments.razorpayPaymentId,
          razorpayPaymentLinkId: payments.razorpayPaymentLinkId,
          paymentLinkUrl: payments.paymentLinkUrl,
          paidAt: payments.paidAt,
          failureReason: payments.failureReason,
          notes: payments.notes,
          source: payments.source,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .where(eq(payments.invoiceId, invoiceId))
        .orderBy(desc(payments.createdAt)),
      calculateInvoicePaymentSummary(invoiceId),
    ]);

    return NextResponse.json({
      payments: paymentRows.map((p) => ({
        ...p,
        amountInr: p.amount / 100,
      })),
      summary: {
        paidAmountInr: summary.paidAmountInr,
        dueAmountInr: summary.dueAmountInr,
        grandTotal: summary.grandTotal,
        paymentStatus: summary.paymentStatus,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
