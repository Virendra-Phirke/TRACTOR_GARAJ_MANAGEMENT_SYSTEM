"use server";

import { db } from "@/db";
import { spareParts, categories, stockHistory } from "@/db/schema";
import { eq, desc, ilike, or, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Categories ──────────────────────────────────────────────────────
export async function getCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export async function createCategory(name: string, description?: string) {
  const result = await db
    .insert(categories)
    .values({ name, description: description || "" })
    .returning();
  revalidatePath("/", "layout");
  return result[0];
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

  revalidatePath("/", "layout");
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
  const result = await db
    .update(spareParts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(spareParts.id, id))
    .returning();
  revalidatePath("/", "layout");
  return result[0];
}

export async function deleteSparePart(id: number) {
  await db.delete(spareParts).where(eq(spareParts.id, id));
  revalidatePath("/", "layout");
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
