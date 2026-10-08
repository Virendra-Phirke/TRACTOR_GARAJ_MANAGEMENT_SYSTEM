/**
 * payment-validation.ts
 *
 * Input validation helpers for payment endpoints.
 * All rules are enforced server-side.  Never trust client amounts.
 */

import { z } from "zod";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateInvoicePaymentSummary, inrToPaise } from "./payment-calculations";

// ─── Zod schemas ────────────────────────────────────────────────────────

export const cashPaymentSchema = z.object({
  invoiceId: z.number().int().positive(),
  /** Amount in INR (rupees) — will be converted to paise server-side */
  amount: z.number().positive("Amount must be positive"),
  notes: z.string().max(500).optional(),
});

export const createOrderSchema = z.object({
  invoiceId: z.number().int().positive(),
  /** Amount in INR (rupees) — will be validated against current due */
  amount: z.number().positive("Amount must be positive"),
});

export const verifyPaymentSchema = z.object({
  localPaymentId: z.number().int().positive(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

// ─── Business rule validators ───────────────────────────────────────────

/**
 * Validate that a payment amount does not exceed the current due.
 * Also validates the amount is positive and the invoice exists.
 *
 * @throws Error with a user-safe message if invalid.
 */
export async function validatePaymentAmount(
  invoiceId: number,
  amountInr: number
): Promise<{ dueAmountInr: number; amountPaise: number }> {
  if (!isFinite(amountInr) || amountInr <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const summary = await calculateInvoicePaymentSummary(invoiceId);

  if (summary.dueAmountInr <= 0) {
    throw new Error("This invoice is already fully paid.");
  }

  // Allow a 1-paise tolerance for floating-point rounding
  const dueAmountPaise = inrToPaise(summary.dueAmountInr);
  const requestedPaise = inrToPaise(amountInr);

  if (requestedPaise > dueAmountPaise + 1) {
    throw new Error(
      `Payment amount ₹${amountInr.toFixed(2)} exceeds the current balance due of ₹${summary.dueAmountInr.toFixed(2)}.`
    );
  }

  // Clamp to exact due to avoid floating-point overpay
  const finalPaise = Math.min(requestedPaise, dueAmountPaise);

  return {
    dueAmountInr: summary.dueAmountInr,
    amountPaise: finalPaise,
  };
}

/**
 * Validate that an invoice exists and belongs to the system.
 *
 * @returns The invoice record
 * @throws if not found
 */
export async function validateInvoiceExists(invoiceId: number) {
  const [invoice] = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      grandTotal: invoices.grandTotal,
    })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found.`);
  }

  return invoice;
}
