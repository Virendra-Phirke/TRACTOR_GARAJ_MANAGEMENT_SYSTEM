"use server";

import { db } from "@/db";
import { vehicles, customers, invoices } from "@/db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";
import { safeRevalidate } from "@/lib/safe-revalidate";

export async function getVehicles(search?: string) {
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    return db
      .select({
        id: vehicles.id,
        customerId: vehicles.customerId,
        registrationNumber: vehicles.registrationNumber,
        brand: vehicles.brand,
        model: vehicles.model,
        year: vehicles.year,
        engineNumber: vehicles.engineNumber,
        chassisNumber: vehicles.chassisNumber,
        notes: vehicles.notes,
        createdAt: vehicles.createdAt,
        updatedAt: vehicles.updatedAt,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(vehicles)
      .leftJoin(customers, eq(vehicles.customerId, customers.id))
      .where(
        or(
          ilike(vehicles.registrationNumber, term),
          ilike(vehicles.brand, term),
          ilike(customers.name, term)
        )
      )
      .orderBy(desc(vehicles.updatedAt))
      .limit(50);
  }
  return db
    .select({
      id: vehicles.id,
      customerId: vehicles.customerId,
      registrationNumber: vehicles.registrationNumber,
      brand: vehicles.brand,
      model: vehicles.model,
      year: vehicles.year,
      engineNumber: vehicles.engineNumber,
      chassisNumber: vehicles.chassisNumber,
      notes: vehicles.notes,
      createdAt: vehicles.createdAt,
      updatedAt: vehicles.updatedAt,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(vehicles)
    .leftJoin(customers, eq(vehicles.customerId, customers.id))
    .orderBy(desc(vehicles.updatedAt))
    .limit(50);
}

export async function getVehiclesByCustomer(customerId: number) {
  return db
    .select()
    .from(vehicles)
    .where(eq(vehicles.customerId, customerId))
    .orderBy(desc(vehicles.updatedAt));
}

export async function getVehicleById(id: number) {
  const result = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createVehicle(data: {
  customerId: number;
  registrationNumber: string;
  brand: string;
  model?: string;
  year?: number;
  engineNumber?: string;
  chassisNumber?: string;
  notes?: string;
}) {
  const result = await db
    .insert(vehicles)
    .values({
      customerId: data.customerId,
      registrationNumber: data.registrationNumber.trim().toUpperCase(),
      brand: data.brand.trim(),
      model: data.model?.trim() || "",
      year: data.year,
      engineNumber: data.engineNumber?.trim() || "",
      chassisNumber: data.chassisNumber?.trim() || "",
      notes: data.notes?.trim() || "",
    })
    .returning();
  safeRevalidate("/", "layout");
  safeRevalidate("/vehicles");
  return result[0];
}

export async function updateVehicle(
  id: number,
  data: {
    registrationNumber?: string;
    brand?: string;
    model?: string;
    year?: number | null;
    engineNumber?: string;
    chassisNumber?: string;
    notes?: string;
  }
) {
  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.registrationNumber !== undefined) {
      updateData.registrationNumber = data.registrationNumber.trim().toUpperCase();
    }
    if (data.brand !== undefined) updateData.brand = data.brand.trim();
    if (data.model !== undefined) updateData.model = data.model.trim();
    if (data.year !== undefined) updateData.year = data.year;
    if (data.engineNumber !== undefined) updateData.engineNumber = data.engineNumber.trim();
    if (data.chassisNumber !== undefined) updateData.chassisNumber = data.chassisNumber.trim();
    if (data.notes !== undefined) updateData.notes = data.notes.trim();

    const result = await db
      .update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, id))
      .returning();
    safeRevalidate("/", "layout");
    safeRevalidate("/vehicles");
    return result[0];
  } catch (error) {
    console.error("updateVehicle ERROR:", error);
    throw error;
  }
}

export async function deleteVehicle(id: number) {
  // 1. Unlink invoices referencing this vehicle to prevent FK constraint violation
  await db
    .update(invoices)
    .set({ vehicleId: null, updatedAt: new Date() })
    .where(eq(invoices.vehicleId, id));

  // 2. Delete the vehicle
  await db.delete(vehicles).where(eq(vehicles.id, id));

  safeRevalidate("/", "layout");
  safeRevalidate("/vehicles");
  safeRevalidate("/invoices");
  safeRevalidate("/customers");
}

