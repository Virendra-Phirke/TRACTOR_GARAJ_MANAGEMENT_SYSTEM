"use server";

import { db } from "@/db";
import {
  invoices,
  invoiceLabors,
  invoiceParts,
  spareParts,
  stockHistory,
  customers,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type LaborItem = {
  description: string;
  hours: number;
  rate: number;
};

export type PartItem = {
  sparePartId?: number | null;
  partName: string;
  quantity: number;
  unitPrice: number;
};

export type EditInvoiceData = {
  customerId: number;
  vehicleId?: number | null;
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

export async function updateInvoice(invoiceId: number, data: EditInvoiceData) {
  try {
    // Validate inputs
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

    // Calculate new totals
    const laborTotal = data.laborItems.reduce((sum, item) => sum + item.hours * item.rate, 0);
    const partsTotal = data.partItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const subtotal = laborTotal + partsTotal;
    const taxAmount = subtotal * (data.taxRate / 100);

    let discountAmount = 0;
    if (data.discountType === "percent") {
      discountAmount = subtotal * (data.discountValue / 100);
    } else {
      discountAmount = data.discountValue;
    }
    const grandTotal = subtotal + taxAmount - discountAmount;

    await db.transaction(async (tx) => {
      // 1. Fetch current invoice details (to revert customer stats)
      const [oldInvoice] = await tx.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      if (!oldInvoice) throw new Error("Invoice not found");

      // 2. Fetch old invoice parts (to revert stock)
      const oldParts = await tx.select().from(invoiceParts).where(eq(invoiceParts.invoiceId, invoiceId));
      
      // Revert Stock
      for (const oldPart of oldParts) {
        if (oldPart.sparePartId) {
          const [partInfo] = await tx.select({ stock: spareParts.stock }).from(spareParts).where(eq(spareParts.id, oldPart.sparePartId)).limit(1);
          if (partInfo) {
            const prevStock = partInfo.stock || 0;
            const restoredStock = prevStock + oldPart.quantity;
            await tx.update(spareParts).set({ stock: restoredStock, updatedAt: new Date() }).where(eq(spareParts.id, oldPart.sparePartId));
            await tx.insert(stockHistory).values({
              sparePartId: oldPart.sparePartId,
              type: "adjustment",
              quantity: oldPart.quantity,
              previousStock: prevStock,
              newStock: restoredStock,
              reference: `Revert Invoice #${oldInvoice.invoiceNumber}`,
            });
          }
        }
      }

      // Revert Customer Stats (we subtract the old grand total and any old outstanding balance)
      const oldOutstanding = oldInvoice.paymentStatus !== "paid" ? (oldInvoice.grandTotal || 0) - (oldInvoice.amountPaid || 0) : 0;
      await tx.update(customers).set({
        totalSpent: sql`${customers.totalSpent} - ${oldInvoice.grandTotal || 0}`,
        outstandingBalance: sql`${customers.outstandingBalance} - ${oldOutstanding}`,
      }).where(eq(customers.id, oldInvoice.customerId));

      // 3. Delete old items
      await tx.delete(invoiceLabors).where(eq(invoiceLabors.invoiceId, invoiceId));
      await tx.delete(invoiceParts).where(eq(invoiceParts.invoiceId, invoiceId));

      // Calculate actual payment status based on amountPaid and new grandTotal
      let newPaymentStatus = data.paymentStatus;
      if (data.amountPaid >= grandTotal) {
        newPaymentStatus = "paid";
      } else if (data.amountPaid > 0) {
        newPaymentStatus = "partially paid";
      } else {
        newPaymentStatus = "unpaid";
      }

      // 4. Update Invoice
      await tx.update(invoices).set({
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
        paymentStatus: newPaymentStatus,
        paymentMethod: data.paymentMethod,
        notes: data.notes || "",
        updatedAt: new Date()
      }).where(eq(invoices.id, invoiceId));

      // 5. Insert new labor items
      if (data.laborItems.length > 0) {
        await tx.insert(invoiceLabors).values(
          data.laborItems.map((item) => ({
            invoiceId,
            description: item.description,
            hours: item.hours,
            rate: item.rate,
            total: item.hours * item.rate,
          }))
        );
      }

      // 6. Insert new parts and DEDUCT STOCK
      if (data.partItems.length > 0) {
        await tx.insert(invoiceParts).values(
          data.partItems.map((item) => ({
            invoiceId,
            sparePartId: item.sparePartId || null,
            partName: item.partName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          }))
        );

        for (const item of data.partItems) {
          if (item.sparePartId) {
            const [partInfo] = await tx.select({ stock: spareParts.stock }).from(spareParts).where(eq(spareParts.id, item.sparePartId)).limit(1);
            if (partInfo) {
              const prevStock = partInfo.stock || 0;
              const newStock = Math.max(0, prevStock - item.quantity);
              await tx.update(spareParts).set({ stock: newStock, updatedAt: new Date() }).where(eq(spareParts.id, item.sparePartId));
              await tx.insert(stockHistory).values({
                sparePartId: item.sparePartId,
                type: "sale",
                quantity: -item.quantity,
                previousStock: prevStock,
                newStock,
                reference: `Edit Invoice #${oldInvoice.invoiceNumber}`,
              });
            }
          }
        }
      }

      // 7. Apply new customer stats (make sure we apply to the NEW customerId if changed)
      const newOutstanding = newPaymentStatus !== "paid" ? grandTotal - data.amountPaid : 0;
      await tx.update(customers).set({
        totalSpent: sql`${customers.totalSpent} + ${grandTotal}`,
        outstandingBalance: sql`${customers.outstandingBalance} + ${newOutstanding}`,
        updatedAt: new Date()
      }).where(eq(customers.id, data.customerId));

    });

    revalidatePath("/invoices");
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/customers");
    revalidatePath("/reports");
    revalidatePath(`/invoices/${invoiceId}`);
  } catch (error) {
    console.error("updateInvoice ERROR:", error);
    throw error;
  }
}
