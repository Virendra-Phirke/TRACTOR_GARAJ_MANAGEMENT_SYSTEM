"use server";

import { db } from "@/db";
import { customers, vehicles, invoices } from "@/db/schema";
import { eq, ilike, or, desc, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
  const result = await db
    .insert(customers)
    .values({
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      address: data.address || "",
    })
    .returning();
    
  const customer = result[0];

  if (data.vehicleBrand || data.vehicleModel || (data.vehicleReg && data.vehicleReg.trim())) {
    const regNum = (data.vehicleReg && data.vehicleReg.trim()) || `N/A-${Date.now()}`;
    await db.insert(vehicles).values({
      customerId: customer.id,
      registrationNumber: regNum,
      brand: data.vehicleBrand || "",
      model: data.vehicleModel || "",
    });
  }

  revalidatePath("/customers");
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
  const result = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return result[0];
}

export async function deleteCustomer(id: number) {
  // Check if customer has invoices — prevent deletion to avoid orphaned data
  const [invoiceCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoices)
    .where(eq(invoices.customerId, id));

  if (Number(invoiceCount.count) > 0) {
    throw new Error(
      `Cannot delete this customer because they have ${invoiceCount.count} invoice(s). ` +
      `Delete the invoices first, or mark the customer as inactive.`
    );
  }

  await db.delete(customers).where(eq(customers.id, id));
  revalidatePath("/customers");
}

export async function getCustomerCount() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers);
  return Number(result[0].count);
}

export async function bulkDeleteCustomers(ids: number[]) {
  if (!ids || ids.length === 0) return;
  await db.delete(customers).where(inArray(customers.id, ids));
  revalidatePath("/customers");
}
