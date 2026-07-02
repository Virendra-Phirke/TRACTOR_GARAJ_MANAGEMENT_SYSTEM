"use server";

import { db } from "@/db";
import { invoices, customers, vehicles, expenses } from "@/db/schema";
import { desc } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";

export async function getAnalyticsData() {
  noStore();
  const [allInvoices, allCustomers, allVehicles, allExpenses] = await Promise.all([
    db.select().from(invoices).orderBy(desc(invoices.createdAt)),
    db.select().from(customers),
    db.select().from(vehicles),
    db.select().from(expenses),
  ]);

  return {
    invoices: allInvoices,
    customers: allCustomers,
    vehicles: allVehicles,
    expenses: allExpenses,
  };
}

