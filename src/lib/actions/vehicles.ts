"use server";

import { db } from "@/db";
import { vehicles, customers } from "@/db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
      registrationNumber: data.registrationNumber.toUpperCase(),
      brand: data.brand,
      model: data.model || "",
      year: data.year,
      engineNumber: data.engineNumber || "",
      chassisNumber: data.chassisNumber || "",
      notes: data.notes || "",
    })
    .returning();
  revalidatePath("/vehicles");
  revalidatePath(`/customers/${data.customerId}`);
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
    const updateData = { ...data, updatedAt: new Date() };
    if (updateData.registrationNumber) {
      updateData.registrationNumber = updateData.registrationNumber.toUpperCase();
    }
    const result = await db
      .update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, id))
      .returning();
    revalidatePath("/vehicles");
    return result[0];
  } catch (error) {
    console.error("updateVehicle ERROR:", error);
    throw error;
  }
}

export async function deleteVehicle(id: number) {
  await db.delete(vehicles).where(eq(vehicles.id, id));
  revalidatePath("/vehicles");
}
