/**
 * payment-calculations.ts
 *
 * Server-authoritative payment computation.
 * All paise/INR amounts flow through here. The frontend is never authoritative.
 */

import { db } from "@/db";
import { payments, invoices, customers } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

// ─── Types ─────────────────────────────────────────────────────────────

export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface PaymentSummary {
  /** Total paid in paise */
  paidAmountPaise: number;
  /** Total paid in INR (paise / 100) */
  paidAmountInr: number;
  /** Invoice grand total in INR (as stored in DB — real) */
  grandTotal: number;
  /** Amount due in INR */
  dueAmountInr: number;
  /** Derived payment status */
  paymentStatus: PaymentStatus;
}

// ─── Core Calculation ───────────────────────────────────────────────────

/**
 * Calculate the current paid amount (sum of all successful payments)
 * and derive the invoice payment status from the payment ledger.
 *
 * @param invoiceId
 * @returns PaymentSummary — always server-computed, never from invoice columns
 */
export async function calculateInvoicePaymentSummary(
  invoiceId: number
): Promise<PaymentSummary> {
  const [invoice] = await db
    .select({ grandTotal: invoices.grandTotal })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  const grandTotal = invoice.grandTotal ?? 0;

  const [result] = await db
    .select({
      paidAmountPaise: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.invoiceId, invoiceId),
        eq(payments.status, "success")
      )
    );

  const paidAmountPaise = Number(result?.paidAmountPaise ?? 0);
  const paidAmountInr = paidAmountPaise / 100;
  const grandTotalPaise = Math.round(grandTotal * 100);
  const dueAmountInr = Math.max(0, grandTotal - paidAmountInr);

  let paymentStatus: PaymentStatus;
  if (paidAmountPaise === 0) {
    paymentStatus = "unpaid";
  } else if (paidAmountPaise >= grandTotalPaise) {
    paymentStatus = "paid";
  } else {
    paymentStatus = "partial";
  }

  return {
    paidAmountPaise,
    paidAmountInr,
    grandTotal,
    dueAmountInr,
    paymentStatus,
  };
}

/**
 * Recalculate and persist the invoice payment status and amountPaid
 * from the payment ledger.  Call this after any payment state change.
 */
export async function reconcileInvoiceStatus(invoiceId: number): Promise<PaymentSummary> {
  const summary = await calculateInvoicePaymentSummary(invoiceId);

  await db
    .update(invoices)
    .set({
      amountPaid: summary.paidAmountInr,
      paymentStatus: summary.paymentStatus,
      paymentDoneAt:
        summary.paymentStatus === "paid" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));

  return summary;
}

/**
 * Reconcile a customer's outstanding balance based on all their
 * unpaid/partial invoices.  This is the authoritative function —
 * never increment/decrement directly in ad-hoc queries.
 *
 * Must be called after the payment record has been committed
 * to avoid race conditions.
 */
export async function reconcileCustomerBalance(customerId: number): Promise<void> {
  // Sum of (grandTotal - amountPaid) for all non-paid invoices
  const [result] = await db
    .select({
      outstandingBalance: sql<number>`COALESCE(
        SUM(
          CASE
            WHEN ${invoices.paymentStatus} != 'paid'
            THEN GREATEST(0, ${invoices.grandTotal} - ${invoices.amountPaid})
            ELSE 0
          END
        ), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.customerId, customerId));

  const outstanding = Number(result?.outstandingBalance ?? 0);

  await db
    .update(customers)
    .set({
      outstandingBalance: outstanding,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));
}

/**
 * Convert INR (rupees, possibly decimal) to integer paise.
 * All gateway amounts MUST be stored as paise.
 */
export function inrToPaise(amountInr: number): number {
  if (!isFinite(amountInr) || amountInr < 0) {
    throw new Error(`Invalid INR amount: ${amountInr}`);
  }
  return Math.round(amountInr * 100);
}

/**
 * Convert paise to INR (for display/storage in legacy invoice columns).
 */
export function paiseToInr(paise: number): number {
  return paise / 100;
}
