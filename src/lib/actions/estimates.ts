"use server";

import { db } from "@/db";
import {
  estimates,
  estimateLabors,
  estimateParts,
  customers,
  vehicles,
  spareParts,
} from "@/db/schema";
import { eq, desc, sql, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Estimate Number Generation ───────────────────────────────────────
async function generateEstimateNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  
  return `EST${year}${month}${date}${hours}${minutes}${seconds}`;
}

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

export type CreateEstimateData = {
  customerId: number;
  vehicleId?: number;
  laborItems: LaborItem[];
  partItems: PartItem[];
  taxRate: number;
  discountType: "fixed" | "percent";
  discountValue: number;
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

// ─── Create Estimate ────────────────────────────────────────────────
export async function createEstimate(data: CreateEstimateData) {
  if (!data.customerId || data.customerId <= 0) {
    throw new Error("Validation error: customerId is required.");
  }
  validatePositive(data.taxRate, "taxRate");
  validatePositive(data.discountValue, "discountValue");

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

  const estimateNumber = await generateEstimateNumber();

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

  const estimate = await (async () => {
    const tx = db;
    const [est] = await tx
      .insert(estimates)
      .values({
        estimateNumber,
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
        status: "pending",
        notes: data.notes || "",
      })
      .returning();

    if (data.laborItems.length > 0) {
      await tx.insert(estimateLabors).values(
        data.laborItems.map((item) => ({
          estimateId: est.id,
          description: item.description,
          hours: item.hours,
          rate: item.rate,
          total: item.hours * item.rate,
        }))
      );
    }

    if (data.partItems.length > 0) {
      await tx.insert(estimateParts).values(
        data.partItems.map((item) => ({
          estimateId: est.id,
          sparePartId: item.sparePartId || null,
          partName: item.partName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        }))
      );
    }

    return est;
  })();

  revalidatePath("/estimates");
  return estimate.id;
}

export async function getEstimates() {
  const result = await db
    .select({
      id: estimates.id,
      estimateNumber: estimates.estimateNumber,
      grandTotal: estimates.grandTotal,
      status: estimates.status,
      createdAt: estimates.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      vehicleReg: vehicles.registrationNumber,
    })
    .from(estimates)
    .innerJoin(customers, eq(estimates.customerId, customers.id))
    .leftJoin(vehicles, eq(estimates.vehicleId, vehicles.id))
    .orderBy(desc(estimates.createdAt));

  return result;
}

export async function getEstimateById(id: number) {
  const [estimate] = await db
    .select({
      id: estimates.id,
      estimateNumber: estimates.estimateNumber,
      customerId: estimates.customerId,
      vehicleId: estimates.vehicleId,
      laborTotal: estimates.laborTotal,
      partsTotal: estimates.partsTotal,
      subtotal: estimates.subtotal,
      taxRate: estimates.taxRate,
      taxAmount: estimates.taxAmount,
      discountType: estimates.discountType,
      discountValue: estimates.discountValue,
      discountAmount: estimates.discountAmount,
      grandTotal: estimates.grandTotal,
      status: estimates.status,
      notes: estimates.notes,
      createdAt: estimates.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerAddress: customers.address,
      vehicleReg: vehicles.registrationNumber,
      vehicleBrand: vehicles.brand,
      vehicleModel: vehicles.model,
    })
    .from(estimates)
    .innerJoin(customers, eq(estimates.customerId, customers.id))
    .leftJoin(vehicles, eq(estimates.vehicleId, vehicles.id))
    .where(eq(estimates.id, id))
    .limit(1);

  if (!estimate) return null;

  const labors = await db
    .select()
    .from(estimateLabors)
    .where(eq(estimateLabors.estimateId, id))
    .orderBy(asc(estimateLabors.id));

  const parts = await db
    .select()
    .from(estimateParts)
    .where(eq(estimateParts.estimateId, id))
    .orderBy(asc(estimateParts.id));

  return {
    ...estimate,
    laborItems: labors,
    partItems: parts,
  };
}

export async function deleteEstimate(id: number) {
  await db.delete(estimates).where(eq(estimates.id, id));
  revalidatePath("/estimates");
}

export async function updateEstimateStatus(id: number, status: string) {
  await db
    .update(estimates)
    .set({ status })
    .where(eq(estimates.id, id));
  revalidatePath("/estimates");
  revalidatePath(`/estimates/${id}`);
}

export async function convertToInvoice(estimateId: number) {
  const estimateData = await getEstimateById(estimateId);
  if (!estimateData) throw new Error("Estimate not found");
  if (estimateData.status === "invoiced") throw new Error("Already invoiced");

  const { createInvoice } = await import("@/lib/actions/invoices");

  const invoiceId = await createInvoice({
    customerId: estimateData.customerId,
    vehicleId: estimateData.vehicleId || undefined,
    laborItems: estimateData.laborItems.map((l) => ({
      description: l.description,
      hours: l.hours || 0,
      rate: l.rate,
    })),
    partItems: estimateData.partItems.map((p) => ({
      sparePartId: p.sparePartId || undefined,
      partName: p.partName,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
    })),
    taxRate: estimateData.taxRate || 0,
    discountType: (estimateData.discountType as "fixed" | "percent") || "fixed",
    discountValue: estimateData.discountValue || 0,
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    amountPaid: 0,
    notes: `Converted from Estimate ${estimateData.estimateNumber}. ${estimateData.notes || ""}`,
  });

  await updateEstimateStatus(estimateId, "invoiced");
  return invoiceId;
}

