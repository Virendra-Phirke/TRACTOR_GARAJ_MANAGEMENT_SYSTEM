"use server";

import { db } from "@/db";
import { customers, vehicles, invoices } from "@/db/schema";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import { deleteInvoice } from "@/lib/actions/invoices";
import { safeRevalidate } from "@/lib/safe-revalidate";

export async function getCustomers(search?: string) {
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    return db
      .select()
      .from(customers)
      .where(or(ilike(customers.name, term), ilike(customers.phone, term)))
      .orderBy(desc(customers.updatedAt))
      .limit(50);
  }
  return db.select().from(customers).orderBy(desc(customers.updatedAt)).limit(50);
}

export async function getCustomerById(id: number) {
  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  vehicleReg?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
}) {
  const cleanPhone = data.phone.trim();
  const cleanName = data.name.trim();

  const [existing] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.phone, cleanPhone))
    .limit(1);

  if (existing) {
    throw new Error(`Customer with phone number "${cleanPhone}" already exists.`);
  }

  const result = await db
    .insert(customers)
    .values({
      name: cleanName,
      phone: cleanPhone,
      email: data.email?.trim() || "",
      address: data.address?.trim() || "",
    })
    .returning();
    
  const customer = result[0];

  const regNum = data.vehicleReg?.trim().toUpperCase();
  if (data.vehicleBrand || data.vehicleModel || regNum) {
    const finalReg = regNum || `N/A-${Date.now()}`;
    const [existingVehicle] = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(eq(vehicles.registrationNumber, finalReg))
      .limit(1);

    if (existingVehicle) {
      await db
        .update(vehicles)
        .set({
          customerId: customer.id,
          brand: data.vehicleBrand?.trim() || "",
          model: data.vehicleModel?.trim() || "",
          updatedAt: new Date(),
        })
        .where(eq(vehicles.id, existingVehicle.id));
    } else {
      await db.insert(vehicles).values({
        customerId: customer.id,
        registrationNumber: finalReg,
        brand: data.vehicleBrand?.trim() || "",
        model: data.vehicleModel?.trim() || "",
      });
    }
  }

  safeRevalidate("/", "layout");
  safeRevalidate("/customers");
  safeRevalidate("/vehicles");
  return customer;
}

export async function updateCustomer(
  id: number,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  }
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.phone !== undefined) {
    const cleanPhone = data.phone.trim();
    const [existing] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.phone, cleanPhone))
      .limit(1);

    if (existing && existing.id !== id) {
      throw new Error(`Customer with phone number "${cleanPhone}" already exists.`);
    }
    updateData.phone = cleanPhone;
  }
  if (data.email !== undefined) updateData.email = data.email.trim();
  if (data.address !== undefined) updateData.address = data.address.trim();

  const result = await db
    .update(customers)
    .set(updateData)
    .where(eq(customers.id, id))
    .returning();

  safeRevalidate("/", "layout");
  safeRevalidate("/customers");
  safeRevalidate(`/customers/${id}`);
  return result[0];
}

export async function deleteCustomer(id: number) {
  // 1. Fetch customer's invoices and delete each one cleanly (restores inventory stock, cancels payment links, cleans up payments ledger)
  const customerInvoices = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.customerId, id));

  for (const inv of customerInvoices) {
    await deleteInvoice(inv.id);
  }

  // 2. Delete customer's vehicles
  await db.delete(vehicles).where(eq(vehicles.customerId, id));

  // 3. Delete customer record
  await db.delete(customers).where(eq(customers.id, id));

  safeRevalidate("/", "layout");
  safeRevalidate("/customers");
  safeRevalidate("/invoices");
  safeRevalidate("/vehicles");
  safeRevalidate("/inventory");
}

export async function getCustomerCount() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers);
  return Number(result[0].count);
}

export async function bulkDeleteCustomers(ids: number[]) {
  if (!ids || ids.length === 0) return;
  for (const id of ids) {
    await deleteCustomer(id);
  }
}
