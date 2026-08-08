"use server";

import { db } from "@/db";
import {
  invoices,
  invoiceLabors,
  invoiceParts,
  spareParts,
  stockHistory,
  customers,
  vehicles,
  expenses,
} from "@/db/schema";
import { eq, desc, asc, sql, and, gte, lte, inArray, isNull } from "drizzle-orm";
import { getISTDayBounds } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// ─── Invoice Number Generation ───────────────────────────────────────
async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  
  // Format: YYYYMMDDHHmmss (guarantees chronologically sortable and highly unique)
  return `${year}${month}${date}${hours}${minutes}${seconds}`;
}

// ─── Types ───────────────────────────────────────────────────────────
export type LaborItem = {
  description: string;
  hours: number;
  rate: number;
};

export type PartItem = {
  sparePartId?: number;
  partName: string;
  quantity: number;
  unitPrice: number;
};

export type CreateInvoiceData = {
  customerId: number;
  vehicleId?: number;
  laborItems: LaborItem[];
  partItems: PartItem[];
  taxRate: number;
  discountType: "fixed" | "percent";
  discountValue: number;
  paymentMethod: string;
  paymentStatus: string;
  amountPaid: number;
  notes?: string;
};

// ─── Input Validation Helpers ────────────────────────────────────────
function validatePositive(value: number, fieldName: string): void {
  if (typeof value !== "number" || isNaN(value) || value < 0) {
    throw new Error(`Validation error: ${fieldName} must be a non-negative number.`);
  }
}

function validateRequired(value: string | undefined | null, fieldName: string): void {
  if (!value || !value.trim()) {
    throw new Error(`Validation error: ${fieldName} is required.`);
  }
}

// ─── Create Invoice (ATOMIC TRANSACTION) ─────────────────────────────
export async function createInvoice(data: CreateInvoiceData) {
  // ─── Validate inputs ────────────────────────────────────────────
  if (!data.customerId || data.customerId <= 0) {
    throw new Error("Validation error: customerId is required.");
  }
  validatePositive(data.taxRate, "taxRate");
  validatePositive(data.discountValue, "discountValue");
  validatePositive(data.amountPaid, "amountPaid");

  for (const item of data.laborItems) {
    validateRequired(item.description, "labor description");
    validatePositive(item.hours, "labor hours");
    validatePositive(item.rate, "labor rate");
  }
  for (const item of data.partItems) {
    validateRequired(item.partName, "part name");
    validatePositive(item.quantity, "part quantity");
    validatePositive(item.unitPrice, "part unit price");
    if (item.quantity <= 0) {
      throw new Error("Validation error: part quantity must be greater than 0.");
    }
  }

  const invoiceNumber = await generateInvoiceNumber();

  // Calculate totals
  const laborTotal = data.laborItems.reduce(
    (sum, item) => sum + item.hours * item.rate,
    0
  );
  const partsTotal = data.partItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const subtotal = laborTotal + partsTotal;
  const taxAmount = subtotal * (data.taxRate / 100);

  let discountAmount = 0;
  if (data.discountType === "percent") {
    discountAmount = subtotal * (data.discountValue / 100);
  } else {
    discountAmount = data.discountValue;
  }

  const grandTotal = subtotal + taxAmount - discountAmount;

  // ─── ATOMIC TRANSACTION ─────────────────────────────────────────
  const invoice = await (async () => {
    const tx = db;
    // 1. Create invoice
    const [inv] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        customerId: data.customerId,
        vehicleId: data.vehicleId || null,
        laborTotal,
        partsTotal,
        subtotal,
        taxRate: data.taxRate,
        taxAmount,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount,
        grandTotal,
        amountPaid: data.amountPaid,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        notes: data.notes || "",
      })
      .returning();

    // 2. Insert labor items
    if (data.laborItems.length > 0) {
      await tx.insert(invoiceLabors).values(
        data.laborItems.map((item) => ({
          invoiceId: inv.id,
          description: item.description,
          hours: item.hours,
          rate: item.rate,
          total: item.hours * item.rate,
        }))
      );
    }

    // 3. Insert parts and DEDUCT STOCK
    if (data.partItems.length > 0) {
      await tx.insert(invoiceParts).values(
        data.partItems.map((item) => ({
          invoiceId: inv.id,
          sparePartId: item.sparePartId || null,
          partName: item.partName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        }))
      );

      // Deduct stock for parts that come from inventory
      for (const item of data.partItems) {
        if (item.sparePartId) {
          // Get current stock
          const [part] = await tx
            .select({ stock: spareParts.stock })
            .from(spareParts)
            .where(eq(spareParts.id, item.sparePartId))
            .limit(1);

          if (part) {
            const previousStock = part.stock || 0;
            const newStock = Math.max(0, previousStock - item.quantity);

            // Update stock
            await tx
              .update(spareParts)
              .set({
                stock: newStock,
                updatedAt: new Date(),
              })
              .where(eq(spareParts.id, item.sparePartId));

            // Record in stock history
            await tx.insert(stockHistory).values({
              sparePartId: item.sparePartId,
              type: "sale",
              quantity: -item.quantity,
              previousStock,
              newStock,
              reference: `Invoice #${invoiceNumber}`,
            });
          }
        }
      }
    }

    // 4. Update customer stats
    await tx
      .update(customers)
      .set({
        totalSpent: sql`${customers.totalSpent} + ${grandTotal}`,
        visitCount: sql`${customers.visitCount} + 1`,
        outstandingBalance:
          data.paymentStatus !== "paid"
            ? sql`${customers.outstandingBalance} + ${grandTotal - data.amountPaid}`
            : customers.outstandingBalance,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, data.customerId));

    return inv;
  })();

  revalidatePath("/invoices");
  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/customers");
  revalidatePath("/reports");
  return invoice;
}

// ─── Get Invoices ────────────────────────────────────────────────────
export async function getInvoices(filters?: {
  status?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  sortDir?: "asc" | "desc";
}) {
  let query = db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      vehicleId: invoices.vehicleId,
      grandTotal: invoices.grandTotal,
      paymentStatus: invoices.paymentStatus,
      paymentMethod: invoices.paymentMethod,
      createdAt: invoices.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      vehicleReg: vehicles.registrationNumber,
      vehicleBrand: vehicles.brand,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(vehicles, eq(invoices.vehicleId, vehicles.id));

  if (filters?.from && filters?.to) {
    const { start } = getISTDayBounds(filters.from);
    const { end } = getISTDayBounds(filters.to);
    query = query.where(
      and(
        gte(invoices.createdAt, start),
        lte(invoices.createdAt, end)
      )
    ) as any;
  }

  if (filters?.sortDir === "asc") {
    query = query.orderBy(asc(invoices.createdAt)) as any;
  } else {
    query = query.orderBy(desc(invoices.createdAt)) as any;
  }

  query = query.limit(filters?.limit || 100) as any;

  return query;
}

// ─── Get Invoice Detail ──────────────────────────────────────────────
export async function getInvoiceById(id: number) {
  const [invoice] = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      vehicleId: invoices.vehicleId,
      laborTotal: invoices.laborTotal,
      partsTotal: invoices.partsTotal,
      subtotal: invoices.subtotal,
      taxRate: invoices.taxRate,
      taxAmount: invoices.taxAmount,
      discountType: invoices.discountType,
      discountValue: invoices.discountValue,
      discountAmount: invoices.discountAmount,
      grandTotal: invoices.grandTotal,
      amountPaid: invoices.amountPaid,
      cashAmount: invoices.cashAmount,
      upiAmount: invoices.upiAmount,
      paymentStatus: invoices.paymentStatus,
      paymentMethod: invoices.paymentMethod,
      notes: invoices.notes,
      createdAt: invoices.createdAt,
      paymentDoneAt: invoices.paymentDoneAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerAddress: customers.address,
      vehicleReg: vehicles.registrationNumber,
      vehicleBrand: vehicles.brand,
      vehicleModel: vehicles.model,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(vehicles, eq(invoices.vehicleId, vehicles.id))
    .where(eq(invoices.id, id))
    .limit(1);

  if (!invoice) return null;

  const [laborItems, partItems] = await Promise.all([
    db
      .select()
      .from(invoiceLabors)
      .where(eq(invoiceLabors.invoiceId, id)),
    db
      .select()
      .from(invoiceParts)
      .where(eq(invoiceParts.invoiceId, id)),
  ]);

  return { ...invoice, laborItems, partItems };
}

// ─── Get Recent Invoices With Parts (For Partner Payout) ─────────────
export async function getRecentInvoicesWithParts() {
  // Only fetch invoices that have NOT been partner-paid yet
  const recentInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      customerName: customers.name,
      createdAt: invoices.createdAt,
      partnerPaidAt: invoices.partnerPaidAt,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(isNull(invoices.partnerPaidAt))
    .orderBy(desc(invoices.createdAt));

  const invoiceIds = recentInvoices.map((inv) => inv.id);
  if (invoiceIds.length === 0) return [];

  // Fetch all parts for these invoices
  const parts = await db
    .select()
    .from(invoiceParts)
    .where(inArray(invoiceParts.invoiceId, invoiceIds));

  // Group parts by invoice ID
  const invoicesWithParts = recentInvoices.map((inv) => {
    const invParts = parts.filter((p) => p.invoiceId === inv.id);
    return {
      ...inv,
      parts: invParts,
    };
  }).filter(inv => inv.parts.length > 0); // Only return invoices that actually have parts

  return invoicesWithParts;
}

// ─── Mark Invoices as Partner Paid ───────────────────────────────────
export async function markInvoicesAsPartnerPaid(invoiceIds: number[]) {
  if (!invoiceIds || invoiceIds.length === 0) return;
  await db
    .update(invoices)
    .set({ partnerPaidAt: new Date(), updatedAt: new Date() })
    .where(inArray(invoices.id, invoiceIds));
  revalidatePath("/expenses");
  revalidatePath("/invoices");
}

// ─── Record Partner Payout (atomic: create expense + mark invoices) ──
export async function recordPartnerPayout(data: {
  invoiceIds: number[];
  invoiceNumbers: string[];
  amount: number;
  paymentMethod: string;
}) {
  if (!data.invoiceIds || data.invoiceIds.length === 0) {
    throw new Error("No invoices selected");
  }
  if (data.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const invoiceNumbersStr = data.invoiceNumbers.map(n => `#${n}`).join(", ");

  // 1. Create expense record
  await db.insert(expenses).values({
    category: "Partner Payment",
    description: `Partner payout for parts in Invoices: ${invoiceNumbersStr}`,
    amount: data.amount,
    date: new Date(),
    paymentMethod: data.paymentMethod || "cash",
  });

  // 2. Mark invoices as partner-paid
  await db
    .update(invoices)
    .set({ partnerPaidAt: new Date(), updatedAt: new Date() })
    .where(inArray(invoices.id, data.invoiceIds));

  revalidatePath("/expenses");
  revalidatePath("/invoices");
  revalidatePath("/reports");
}

// ─── Update Payment Status (with customer balance adjustment) ────────
export async function updatePaymentStatus(
  id: number,
  status: string,
  amountPaid?: number
) {
  // Get the current invoice to calculate balance adjustment
  const [currentInvoice] = await db
    .select({
      paymentStatus: invoices.paymentStatus,
      grandTotal: invoices.grandTotal,
      amountPaid: invoices.amountPaid,
      customerId: invoices.customerId,
    })
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (!currentInvoice) return;

  const oldAmountPaid = currentInvoice.amountPaid || 0;
  const newAmountPaid = amountPaid ?? oldAmountPaid;
  const total = currentInvoice.grandTotal || 0;

  await (async () => {
    const tx = db;
    // Update the invoice
    await tx
      .update(invoices)
      .set({
        paymentStatus: status,
        amountPaid: newAmountPaid,
        paymentDoneAt: status === "paid" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id));

    // Adjust customer outstanding balance
    // Old outstanding from this invoice: total - oldAmountPaid (if was unpaid/partial)
    // New outstanding from this invoice: total - newAmountPaid (if still unpaid/partial)
    const wasUnpaid = currentInvoice.paymentStatus !== "paid";
    const isNowPaid = status === "paid";

    if (wasUnpaid && isNowPaid) {
      // Fully paying off — remove remaining balance
      const remainingBalance = total - oldAmountPaid;
      await tx
        .update(customers)
        .set({
          outstandingBalance: sql`GREATEST(0, ${customers.outstandingBalance} - ${remainingBalance})`,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, currentInvoice.customerId));
    } else if (wasUnpaid && !isNowPaid && amountPaid !== undefined) {
      // Partial payment update — adjust the difference
      const balanceDiff = newAmountPaid - oldAmountPaid;
      if (balanceDiff > 0) {
        await tx
          .update(customers)
          .set({
            outstandingBalance: sql`GREATEST(0, ${customers.outstandingBalance} - ${balanceDiff})`,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, currentInvoice.customerId));
      }
    }
  })();

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  revalidatePath("/");
  revalidatePath("/customers");
}

// ─── Dashboard Stats (PARALLELIZED) ─────────────────────────────────
export async function getDashboardStats(startDate?: string, endDate?: string) {
  const { start: todayStart, end: todayEnd } = getISTDayBounds();

  // Build the date condition for revenue and graph
  let revenueCondition = undefined;
  let graphCondition;
  let expenseGraphCondition;
  
  if (startDate && endDate) {
    const { start } = getISTDayBounds(startDate);
    const { end } = getISTDayBounds(endDate);
    revenueCondition = and(gte(invoices.createdAt, start), lte(invoices.createdAt, end));
    graphCondition = revenueCondition;
    expenseGraphCondition = and(gte(expenses.date, start), lte(expenses.date, end));
  } else {
    // Default to current month (1st of month to now)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    graphCondition = gte(invoices.createdAt, monthStart);
    expenseGraphCondition = gte(expenses.date, monthStart);
  }

  // ─── Run all queries in PARALLEL ──────────────────────────────
  const [todayRevenue, pendingPayments, totalRevenue, weeklyData, recentInvoices, expensesData] =
    await Promise.all([
      // 1. Today's revenue
      db
        .select({
          total: sql<number>`COALESCE(SUM(${invoices.grandTotal}), 0)`,
          count: sql<number>`count(*)`,
        })
        .from(invoices)
        .where(
          and(gte(invoices.createdAt, todayStart), lte(invoices.createdAt, todayEnd))
        )
        .then((r) => r[0]),

      // 2. Pending payments
      db
        .select({
          total: sql<number>`COALESCE(SUM(${invoices.grandTotal} - ${invoices.amountPaid}), 0)`,
          count: sql<number>`count(*)`,
        })
        .from(invoices)
        .where(eq(invoices.paymentStatus, "unpaid"))
        .then((r) => r[0]),

      // 3. Total revenue (with optional date filter)
      db
        .select({
          total: sql<number>`COALESCE(SUM(${invoices.grandTotal}), 0)`,
        })
        .from(invoices)
        .where(revenueCondition)
        .then((r) => r[0]),

      // 4. Graph data (Revenue)
      db
        .select({
          date: sql<string>`DATE(${invoices.createdAt})`,
          total: sql<number>`COALESCE(SUM(${invoices.grandTotal}), 0)`,
          count: sql<number>`count(*)`,
        })
        .from(invoices)
        .where(graphCondition)
        .groupBy(sql`DATE(${invoices.createdAt})`)
        .orderBy(sql`DATE(${invoices.createdAt})`),

      // 5. Recent invoices
      db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          grandTotal: invoices.grandTotal,
          paymentStatus: invoices.paymentStatus,
          createdAt: invoices.createdAt,
          customerName: customers.name,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .orderBy(desc(invoices.createdAt))
        .limit(5),

      // 6. Expenses for Graph
      db
        .select({
          date: sql<string>`DATE(${expenses.date})`,
          total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        })
        .from(expenses)
        .where(expenseGraphCondition)
        .groupBy(sql`DATE(${expenses.date})`)
        .orderBy(sql`DATE(${expenses.date})`),
    ]);

  const dateMap = new Map<string, { date: string; revenue: number; bills: number; expenses: number }>();
  
  weeklyData.forEach((d) => {
    dateMap.set(d.date, { date: d.date, revenue: Number(d.total), bills: Number(d.count), expenses: 0 });
  });

  expensesData.forEach((d) => {
    if (dateMap.has(d.date)) {
      dateMap.get(d.date)!.expenses = Number(d.total);
    } else {
      dateMap.set(d.date, { date: d.date, revenue: 0, bills: 0, expenses: Number(d.total) });
    }
  });

  const mergedWeeklyData = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    todayRevenue: Number(todayRevenue.total),
    todayBills: Number(todayRevenue.count),
    pendingAmount: Number(pendingPayments.total),
    pendingCount: Number(pendingPayments.count),
    totalRevenue: Number(totalRevenue.total),
    weeklyData: mergedWeeklyData,
    recentInvoices,
  };
}

export async function getInvoicesByCustomer(customerId: number) {
  return db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      grandTotal: invoices.grandTotal,
      paymentStatus: invoices.paymentStatus,
      createdAt: invoices.createdAt,
      vehicleReg: vehicles.registrationNumber,
    })
    .from(invoices)
    .leftJoin(vehicles, eq(invoices.vehicleId, vehicles.id))
    .where(eq(invoices.customerId, customerId))
    .orderBy(desc(invoices.createdAt));
}

export async function updateInvoicePayment(id: number, data: { paymentStatus: string, paymentMethod: string, amountPaid: number, cashAmount: number, upiAmount: number }) {
  // Validate inputs
  validatePositive(data.amountPaid, "amountPaid");
  validatePositive(data.cashAmount, "cashAmount");
  validatePositive(data.upiAmount, "upiAmount");

  // Get current invoice state for balance adjustment
  const [currentInvoice] = await db
    .select({
      paymentStatus: invoices.paymentStatus,
      grandTotal: invoices.grandTotal,
      amountPaid: invoices.amountPaid,
      customerId: invoices.customerId,
    })
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (!currentInvoice) return;

  const total = currentInvoice.grandTotal || 0;
  
  if (data.amountPaid >= total && data.paymentStatus === "partial") {
    data.paymentStatus = "paid";
  }

  const isNowPaid = data.paymentStatus === "paid";
  const wasUnpaid = currentInvoice.paymentStatus !== "paid";
  const oldAmountPaid = currentInvoice.amountPaid || 0;

  await (async () => {
    const tx = db;
    await tx.update(invoices).set({
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod,
      amountPaid: data.amountPaid,
      cashAmount: data.cashAmount,
      upiAmount: data.upiAmount,
      paymentDoneAt: isNowPaid ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(invoices.id, id));

    // Adjust customer outstanding balance
    const balanceDiff = data.amountPaid - oldAmountPaid;
    if (balanceDiff !== 0) {
      await tx
        .update(customers)
        .set({
          outstandingBalance: sql`GREATEST(0, ${customers.outstandingBalance} - ${balanceDiff})`,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, currentInvoice.customerId));
    }
  })();

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  revalidatePath("/customers");
}

export async function deleteInvoice(id: number) {
  const [invoice] = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      grandTotal: invoices.grandTotal,
      amountPaid: invoices.amountPaid,
      paymentStatus: invoices.paymentStatus,
    })
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (!invoice) return;

  const parts = await db
    .select({
      sparePartId: invoiceParts.sparePartId,
      quantity: invoiceParts.quantity,
    })
    .from(invoiceParts)
    .where(eq(invoiceParts.invoiceId, id));

  await (async () => {
    const tx = db;
    
    // Restore stock
    for (const part of parts) {
      if (part.sparePartId) {
        const [spare] = await tx
          .select({ stock: spareParts.stock })
          .from(spareParts)
          .where(eq(spareParts.id, part.sparePartId))
          .limit(1);

        if (spare) {
          const previousStock = spare.stock || 0;
          const newStock = previousStock + part.quantity;

          await tx
            .update(spareParts)
            .set({
              stock: newStock,
              updatedAt: new Date(),
            })
            .where(eq(spareParts.id, part.sparePartId));

          await tx.insert(stockHistory).values({
            sparePartId: part.sparePartId,
            type: "adjustment",
            quantity: part.quantity,
            previousStock,
            newStock,
            reference: `Invoice Deleted: #${invoice.invoiceNumber}`,
          });
        }
      }
    }

    // Adjust customer stats
    const outstandingDiff = invoice.paymentStatus !== "paid" ? (invoice.grandTotal || 0) - (invoice.amountPaid || 0) : 0;
    
    await tx
      .update(customers)
      .set({
        totalSpent: sql`GREATEST(0, ${customers.totalSpent} - ${invoice.grandTotal || 0})`,
        visitCount: sql`GREATEST(0, ${customers.visitCount} - 1)`,
        outstandingBalance: sql`GREATEST(0, ${customers.outstandingBalance} - ${outstandingDiff})`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, invoice.customerId));

    // Delete the invoice (cascade handles invoice_labors and invoice_parts)
    await tx.delete(invoices).where(eq(invoices.id, id));
  })();

  revalidatePath("/invoices");
  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/customers");
  revalidatePath("/reports");
}

export async function bulkDeleteInvoices(ids: number[]) {
  if (!ids || ids.length === 0) return;
  await db.delete(invoices).where(inArray(invoices.id, ids));
  revalidatePath("/invoices");
  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/customers");
  revalidatePath("/reports");
}

// ─── Report Stats (date-filtered, comprehensive) ─────────────────────
export async function getReportStats(startDate?: string, endDate?: string) {
  const { start: todayStart, end: todayEnd } = getISTDayBounds();

  // Default to today if no dates provided
  let rangeStart = todayStart;
  let rangeEnd = todayEnd;
  if (startDate && endDate) {
    const { start } = getISTDayBounds(startDate);
    const { end } = getISTDayBounds(endDate);
    rangeStart = start;
    rangeEnd = end;
  }

  const rangeCondition = and(
    gte(invoices.createdAt, rangeStart),
    lte(invoices.createdAt, rangeEnd)
  );

  const [
    revenueSummary,
    statusCounts,
    paymentMethodSplit,
    laborPartsBreakdown,
    pendingPayments,
    dailyData,
  ] = await Promise.all([
    // 1. Revenue summary for the range
    db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${invoices.grandTotal}), 0)`,
        totalCollected: sql<number>`COALESCE(SUM(${invoices.amountPaid}), 0)`,
        totalCash: sql<number>`COALESCE(SUM(${invoices.cashAmount}), 0)`,
        totalUpi: sql<number>`COALESCE(SUM(${invoices.upiAmount}), 0)`,
        totalDiscount: sql<number>`COALESCE(SUM(${invoices.discountAmount}), 0)`,
        totalTax: sql<number>`COALESCE(SUM(${invoices.taxAmount}), 0)`,
        invoiceCount: sql<number>`count(*)`,
        avgInvoice: sql<number>`COALESCE(AVG(${invoices.grandTotal}), 0)`,
        maxInvoice: sql<number>`COALESCE(MAX(${invoices.grandTotal}), 0)`,
        minInvoice: sql<number>`COALESCE(MIN(${invoices.grandTotal}), 0)`,
      })
      .from(invoices)
      .where(rangeCondition)
      .then((r) => r[0]),

    // 2. Status breakdown (paid/unpaid/partial) in range
    db
      .select({
        status: invoices.paymentStatus,
        count: sql<number>`count(*)`,
        total: sql<number>`COALESCE(SUM(${invoices.grandTotal}), 0)`,
      })
      .from(invoices)
      .where(rangeCondition)
      .groupBy(invoices.paymentStatus),

    // 3. Payment method breakdown in range
    db
      .select({
        method: invoices.paymentMethod,
        count: sql<number>`count(*)`,
        total: sql<number>`COALESCE(SUM(${invoices.grandTotal}), 0)`,
      })
      .from(invoices)
      .where(and(rangeCondition, eq(invoices.paymentStatus, "paid")))
      .groupBy(invoices.paymentMethod),

    // 4. Labor vs Parts breakdown in range
    db
      .select({
        totalLabor: sql<number>`COALESCE(SUM(${invoices.laborTotal}), 0)`,
        totalParts: sql<number>`COALESCE(SUM(${invoices.partsTotal}), 0)`,
      })
      .from(invoices)
      .where(rangeCondition)
      .then((r) => r[0]),

    // 5. Overall pending payments (not date-filtered)
    db
      .select({
        total: sql<number>`COALESCE(SUM(${invoices.grandTotal} - ${invoices.amountPaid}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(invoices)
      .where(
        sql`${invoices.paymentStatus} IN ('unpaid', 'partial')`
      )
      .then((r) => r[0]),

    // 6. Daily breakdown for the range
    db
      .select({
        date: sql<string>`DATE(${invoices.createdAt})`,
        total: sql<number>`COALESCE(SUM(${invoices.grandTotal}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(invoices)
      .where(rangeCondition)
      .groupBy(sql`DATE(${invoices.createdAt})`)
      .orderBy(sql`DATE(${invoices.createdAt})`),
  ]);

  // Transform status counts into a lookup
  const statusMap: Record<string, { count: number; total: number }> = {};
  for (const row of statusCounts) {
    statusMap[row.status] = {
      count: Number(row.count),
      total: Number(row.total),
    };
  }

  // Transform payment method counts
  const methodMap: Record<string, { count: number; total: number }> = {};
  for (const row of paymentMethodSplit) {
    const method = row.method || "other";
    methodMap[method] = {
      count: Number(row.count),
      total: Number(row.total),
    };
  }

  return {
    totalRevenue: Number(revenueSummary.totalRevenue),
    totalCollected: Number(revenueSummary.totalCollected),
    totalCash: Number(revenueSummary.totalCash),
    totalUpi: Number(revenueSummary.totalUpi),
    totalDiscount: Number(revenueSummary.totalDiscount),
    totalTax: Number(revenueSummary.totalTax),
    invoiceCount: Number(revenueSummary.invoiceCount),
    avgInvoice: Number(revenueSummary.avgInvoice),
    maxInvoice: Number(revenueSummary.maxInvoice),
    minInvoice: Number(revenueSummary.minInvoice),
    statusBreakdown: statusMap,
    paymentMethodBreakdown: methodMap,
    laborTotal: Number(laborPartsBreakdown.totalLabor),
    partsTotal: Number(laborPartsBreakdown.totalParts),
    pendingAmount: Number(pendingPayments.total),
    pendingCount: Number(pendingPayments.count),
    dailyData: dailyData.map((d) => ({
      date: d.date,
      revenue: Number(d.total),
      bills: Number(d.count),
    })),
  };
}
