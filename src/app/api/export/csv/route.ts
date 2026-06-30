import { db } from "@/db";
import { invoices, customers } from "@/db/schema";
import { sql, desc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { format } from "date-fns";
import { verifyApiRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // ─── Auth check ────────────────────────────────────────────────────
  const isAuthed = await verifyApiRequest(request);
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Weekly Revenue
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyData = await db
      .select({
        date: sql<string>`DATE(${invoices.createdAt})`,
        revenue: sql<number>`COALESCE(SUM(${invoices.grandTotal}), 0)`,
        bills: sql<number>`count(*)`,
      })
      .from(invoices)
      .where(gte(invoices.createdAt, sevenDaysAgo))
      .groupBy(sql`DATE(${invoices.createdAt})`)
      .orderBy(desc(sql`DATE(${invoices.createdAt})`));

    // 2. Top Customers
    const topCustomers = await db
      .select({
        name: customers.name,
        phone: customers.phone,
        totalSpent: customers.totalSpent,
        visits: customers.visitCount,
      })
      .from(customers)
      .orderBy(desc(customers.totalSpent))
      .limit(10);

    // Build CSV Content
    let csv = "--- GBMS REVENUE REPORT ---\n\n";
    
    csv += "LAST 7 DAYS REVENUE\n";
    csv += "Date,Bills Count,Revenue (INR)\n";
    for (const row of weeklyData) {
      csv += `${format(new Date(row.date), "dd MMM yyyy")},${row.bills},${row.revenue}\n`;
    }

    csv += "\n\n";
    csv += "TOP 10 CUSTOMERS\n";
    csv += "Name,Phone,Total Spent (INR),Visits\n";
    for (const cust of topCustomers) {
      // Escape commas in names
      const safeName = cust.name.includes(",") ? `"${cust.name}"` : cust.name;
      csv += `${safeName},${cust.phone},${cust.totalSpent},${cust.visits}\n`;
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="gbms_report_${format(new Date(), "yyyyMMdd")}.csv"`,
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Failed to generate CSV", { status: 500 });
  }
}
