"use server";

import { db } from "@/db";
import { spareParts, categories, stockHistory, invoiceParts } from "@/db/schema";
import { eq, desc, ilike, or, lte, sql } from "drizzle-orm";
import { safeRevalidate } from "@/lib/safe-revalidate";

// ─── Categories ──────────────────────────────────────────────────────
export async function getCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export async function createCategory(name: string, description?: string) {
  const result = await db
    .insert(categories)
    .values({ name: name.trim(), description: description?.trim() || "" })
    .returning();
  safeRevalidate("/", "layout");
  safeRevalidate("/inventory");
  return result[0];
}

export async function updateCategory(id: number, name: string, description?: string) {
  const result = await db
    .update(categories)
    .set({ name: name.trim(), description: description?.trim() || "" })
    .where(eq(categories.id, id))
    .returning();
  safeRevalidate("/", "layout");
  safeRevalidate("/inventory");
  return result[0];
}

export async function deleteCategory(id: number) {
  await db
    .update(spareParts)
    .set({ categoryId: null, updatedAt: new Date() })
    .where(eq(spareParts.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
  safeRevalidate("/", "layout");
  safeRevalidate("/inventory");
}

// ─── Spare Parts ─────────────────────────────────────────────────────
export async function getSpareParts(search?: string) {
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    return db
      .select({
        id: spareParts.id,
        name: spareParts.name,
        categoryId: spareParts.categoryId,
        partNumber: spareParts.partNumber,
        unit: spareParts.unit,
        description: spareParts.description,
        stock: spareParts.stock,
        minStockAlert: spareParts.minStockAlert,
        purchasePrice: spareParts.purchasePrice,
        sellingPrice: spareParts.sellingPrice,
        isActive: spareParts.isActive,
        createdAt: spareParts.createdAt,
        updatedAt: spareParts.updatedAt,
        categoryName: categories.name,
      })
      .from(spareParts)
      .leftJoin(categories, eq(spareParts.categoryId, categories.id))
      .where(
        or(
          ilike(spareParts.name, term),
          ilike(spareParts.partNumber, term),
          ilike(categories.name, term)
        )
      )
      .orderBy(desc(spareParts.updatedAt))
      .limit(100);
  }
  return db
    .select({
      id: spareParts.id,
      name: spareParts.name,
      categoryId: spareParts.categoryId,
      partNumber: spareParts.partNumber,
      unit: spareParts.unit,
      description: spareParts.description,
      stock: spareParts.stock,
      minStockAlert: spareParts.minStockAlert,
      purchasePrice: spareParts.purchasePrice,
      sellingPrice: spareParts.sellingPrice,
      isActive: spareParts.isActive,
      createdAt: spareParts.createdAt,
      updatedAt: spareParts.updatedAt,
      categoryName: categories.name,
    })
    .from(spareParts)
    .leftJoin(categories, eq(spareParts.categoryId, categories.id))
    .orderBy(desc(spareParts.updatedAt))
    .limit(100);
}

export async function getSparePartById(id: number) {
  const result = await db
    .select()
    .from(spareParts)
    .where(eq(spareParts.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createSparePart(data: {
  name: string;
  categoryId?: number;
  partNumber?: string;
  unit?: string;
  description?: string;
  stock?: number;
  minStockAlert?: number;
  purchasePrice?: number;
  sellingPrice?: number;
}) {
  const result = await db
    .insert(spareParts)
    .values({
      name: data.name,
      categoryId: data.categoryId || null,
      partNumber: data.partNumber || "",
      unit: data.unit || "piece",
      description: data.description || "",
      stock: data.stock || 0,
      minStockAlert: data.minStockAlert || 0,
      purchasePrice: data.purchasePrice || 0,
      sellingPrice: data.sellingPrice || 0,
    })
    .returning();

  safeRevalidate("/", "layout");
  safeRevalidate("/inventory");
  return result[0];
}

export async function updateSparePart(
  id: number,
  data: {
    name?: string;
    categoryId?: number | null;
    partNumber?: string;
    unit?: string;
    description?: string;
    stock?: number;
    minStockAlert?: number;
    purchasePrice?: number;
    sellingPrice?: number;
    isActive?: boolean;
  }
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.partNumber !== undefined) updateData.partNumber = data.partNumber.trim();
  if (data.unit !== undefined) updateData.unit = data.unit.trim();
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.minStockAlert !== undefined) updateData.minStockAlert = data.minStockAlert;
  if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice;
  if (data.sellingPrice !== undefined) updateData.sellingPrice = data.sellingPrice;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const result = await db
    .update(spareParts)
    .set(updateData)
    .where(eq(spareParts.id, id))
    .returning();
  safeRevalidate("/", "layout");
  safeRevalidate("/inventory");
  return result[0];
}

export async function deleteSparePart(id: number) {
  // 1. Unlink any invoice line items referencing this spare part so invoice records remain intact without FK violation
  await db
    .update(invoiceParts)
    .set({ sparePartId: null })
    .where(eq(invoiceParts.sparePartId, id));

  // 2. Delete stock history associated with this spare part
  await db.delete(stockHistory).where(eq(stockHistory.sparePartId, id));

  // 3. Delete the spare part
  await db.delete(spareParts).where(eq(spareParts.id, id));

  safeRevalidate("/", "layout");
  safeRevalidate("/inventory");
}

export async function getLowStockParts() {
  return db
    .select({
      id: spareParts.id,
      name: spareParts.name,
      stock: spareParts.stock,
      minStock: spareParts.minStockAlert,
      unit: spareParts.unit,
    })
    .from(spareParts)
    .leftJoin(categories, eq(spareParts.categoryId, categories.id))
    .where(
      or(
        lte(spareParts.stock, spareParts.minStockAlert),
        lte(spareParts.stock, 0)
      )
    )
    .orderBy(spareParts.stock);
}

export async function getInventoryCount() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(spareParts);
  return Number(result[0].count);
}
