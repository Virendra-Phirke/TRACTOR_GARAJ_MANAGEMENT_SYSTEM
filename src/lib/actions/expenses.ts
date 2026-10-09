"use server";

import { db } from "@/db";
import { expenses } from "@/db/schema";
import { desc, sql, and, gte, lte, eq } from "drizzle-orm";
import { safeRevalidate } from "@/lib/safe-revalidate";

export async function getExpenses() {
  return db.select().from(expenses).orderBy(desc(expenses.date)).limit(100);
}

export async function createExpense(data: {
  category: string;
  description?: string;
  amount: number;
  date?: Date;
  paymentMethod?: string;
}) {
  const result = await db
    .insert(expenses)
    .values({
      category: data.category.trim(),
      description: data.description?.trim() || "",
      amount: data.amount,
      date: data.date || new Date(),
      paymentMethod: data.paymentMethod || "cash",
    })
    .returning();
  safeRevalidate("/", "layout");
  safeRevalidate("/expenses");
  return result[0];
}

export async function updateExpense(
  id: number,
  data: {
    category?: string;
    description?: string;
    amount?: number;
    date?: Date;
    paymentMethod?: string;
  }
) {
  const updateData: Record<string, unknown> = {};
  if (data.category !== undefined) updateData.category = data.category.trim();
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.date !== undefined) updateData.date = data.date;
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;

  const result = await db
    .update(expenses)
    .set(updateData)
    .where(eq(expenses.id, id))
    .returning();

  safeRevalidate("/", "layout");
  safeRevalidate("/expenses");
  return result[0];
}

export async function deleteExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.id, id));
  safeRevalidate("/", "layout");
  safeRevalidate("/expenses");
}

export async function getExpenseStats(from: Date, to: Date) {
  const result = await db
    .select({
      totalExpenses: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(and(gte(expenses.date, from), lte(expenses.date, to)));
  return Number(result[0].totalExpenses);
}

