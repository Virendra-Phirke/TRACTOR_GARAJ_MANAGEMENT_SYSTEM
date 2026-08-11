"use server";

import { db } from "@/db";
import { expenses } from "@/db/schema";
import { desc, sql, and, gte, lte } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
      category: data.category,
      description: data.description || "",
      amount: data.amount,
      date: data.date || new Date(),
      paymentMethod: data.paymentMethod || "cash",
    })
    .returning();
  revalidatePath("/", "layout");
  return result[0];
}

export async function deleteExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/", "layout");
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
