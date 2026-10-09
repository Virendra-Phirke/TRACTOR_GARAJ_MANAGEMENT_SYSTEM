"use server";

import { db } from "@/db";
import { payments, invoices, customers, vehicles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { fetchRazorpayPaymentLink } from "@/lib/payments/razorpay";
import {
  reconcileInvoiceStatus,
  reconcileCustomerBalance,
} from "@/lib/payments/payment-calculations";

export interface PaymentHistoryItem {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  customerId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  vehicleReg: string | null;
  vehicleModel: string | null;
  amount: number; // in paise
  amountInr: number; // in INR
  paymentMethod: string;
  status: string;
  gatewayMethod: string | null;
  source: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpayPaymentLinkId: string | null;
  paymentLinkUrl: string | null;
  paidAt: string | null;
  failureReason: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PaymentHistorySummary {
  totalCollectedInr: number;
  totalOnlineInr: number;
  totalCashInr: number;
  pendingCount: number;
  pendingAmountInr: number;
  totalTransactions: number;
  successCount: number;
}

export interface PaymentHistoryResponse {
  payments: PaymentHistoryItem[];
  summary: PaymentHistorySummary;
}

/**
 * Fetch all payments across all invoices for the admin payment ledger,
 * joined with invoice, customer, and vehicle details.
 */
export async function getPaymentHistory(): Promise<PaymentHistoryResponse> {
  const rows = await db
    .select({
      id: payments.id,
      invoiceId: payments.invoiceId,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      vehicleReg: vehicles.registrationNumber,
      vehicleModel: vehicles.model,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      status: payments.status,
      gatewayMethod: payments.gatewayMethod,
      source: payments.source,
      razorpayOrderId: payments.razorpayOrderId,
      razorpayPaymentId: payments.razorpayPaymentId,
      razorpayPaymentLinkId: payments.razorpayPaymentLinkId,
      paymentLinkUrl: payments.paymentLinkUrl,
      paidAt: payments.paidAt,
      failureReason: payments.failureReason,
      notes: payments.notes,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(vehicles, eq(invoices.vehicleId, vehicles.id))
    .orderBy(desc(payments.createdAt));

  let totalCollectedPaise = 0;
  let totalOnlinePaise = 0;
  let totalCashPaise = 0;
  let pendingCount = 0;
  let pendingAmountPaise = 0;
  let successCount = 0;

  const mapped: PaymentHistoryItem[] = rows.map((r) => {
    const amountInr = (r.amount || 0) / 100;
    if (r.status === "success") {
      totalCollectedPaise += r.amount || 0;
      successCount++;
      if (r.paymentMethod === "online") {
        totalOnlinePaise += r.amount || 0;
      } else {
        totalCashPaise += r.amount || 0;
      }
    } else if (r.status === "pending") {
      pendingCount++;
      pendingAmountPaise += r.amount || 0;
    }

    return {
      id: r.id,
      invoiceId: r.invoiceId,
      invoiceNumber: r.invoiceNumber || `INV-${r.invoiceId}`,
      customerId: r.customerId,
      customerName: r.customerName || "Walk-in Customer",
      customerPhone: r.customerPhone || "—",
      vehicleReg: r.vehicleReg || null,
      vehicleModel: r.vehicleModel || null,
      amount: r.amount,
      amountInr,
      paymentMethod: r.paymentMethod,
      status: r.status,
      gatewayMethod: r.gatewayMethod,
      source: r.source,
      razorpayOrderId: r.razorpayOrderId,
      razorpayPaymentId: r.razorpayPaymentId,
      razorpayPaymentLinkId: r.razorpayPaymentLinkId,
      paymentLinkUrl: r.paymentLinkUrl,
      paidAt: r.paidAt ? r.paidAt.toISOString() : null,
      failureReason: r.failureReason,
      notes: r.notes,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    };
  });

  return {
    payments: mapped,
    summary: {
      totalCollectedInr: totalCollectedPaise / 100,
      totalOnlineInr: totalOnlinePaise / 100,
      totalCashInr: totalCashPaise / 100,
      pendingCount,
      pendingAmountInr: pendingAmountPaise / 100,
      totalTransactions: mapped.length,
      successCount,
    },
  };
}

/**
 * Reconcile / sync an active payment link directly with Razorpay.
 */
export async function syncPaymentLinkStatus(paymentId: number) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!payment) {
    throw new Error("Payment record not found");
  }

  if (!payment.razorpayPaymentLinkId) {
    throw new Error("This payment does not have an associated Razorpay Payment Link");
  }

  const plink = (await fetchRazorpayPaymentLink(
    payment.razorpayPaymentLinkId
  )) as unknown as {
    status?: string;
    payments?: Array<{ payment_id?: string; method?: string }>;
  };

  if (plink.status === "paid" && payment.status !== "success") {
    const paymentsList = plink.payments || [];
    const latestPayment = paymentsList[0] || {};
    const rzpPayId = latestPayment.payment_id || null;
    const method = latestPayment.method || "upi";

    await db
      .update(payments)
      .set({
        status: "success",
        razorpayPaymentId: rzpPayId,
        gatewayMethod: method,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    await reconcileInvoiceStatus(payment.invoiceId);

    const [inv] = await db
      .select({ customerId: invoices.customerId })
      .from(invoices)
      .where(eq(invoices.id, payment.invoiceId))
      .limit(1);

    if (inv?.customerId) {
      await reconcileCustomerBalance(inv.customerId);
    }

    revalidatePath("/payments");
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${payment.invoiceId}`);
    revalidatePath("/");

    return {
      updated: true,
      status: "paid",
      message: "Payment link confirmed paid! Ledger & invoice updated.",
    };
  } else if (plink.status === "cancelled" || plink.status === "expired") {
    await db
      .update(payments)
      .set({
        status: "failed",
        failureReason: `Payment link ${plink.status}`,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    revalidatePath("/payments");
    revalidatePath("/invoices");
    return {
      updated: true,
      status: plink.status,
      message: `Payment link is ${plink.status}.`,
    };
  }

  return {
    updated: false,
    status: plink.status || "pending",
    message: `Payment link status is ${plink.status || "pending"}.`,
  };
}
