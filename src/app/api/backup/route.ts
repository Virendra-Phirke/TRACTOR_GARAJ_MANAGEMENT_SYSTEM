import { db } from "@/db";
import { 
  customers, vehicles, invoices, invoiceParts, invoiceLabors, 
  spareParts, categories, stockHistory, expenses, backups 
} from "@/db/schema";
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
    // 1. Fetch all data in parallel
    const [
      allCustomers,
      allVehicles,
      allInvoices,
      allInvoiceParts,
      allInvoiceLabors,
      allSpareParts,
      allCategories,
      allStockHistory,
      allExpenses
    ] = await Promise.all([
      db.select().from(customers),
      db.select().from(vehicles),
      db.select().from(invoices),
      db.select().from(invoiceParts),
      db.select().from(invoiceLabors),
      db.select().from(spareParts),
      db.select().from(categories),
      db.select().from(stockHistory),
      db.select().from(expenses)
    ]);

    // 2. Compile into a single JSON object
    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        customers: allCustomers,
        vehicles: allVehicles,
        invoices: allInvoices,
        invoiceParts: allInvoiceParts,
        invoiceLabors: allInvoiceLabors,
        spareParts: allSpareParts,
        categories: allCategories,
        stockHistory: allStockHistory,
        expenses: allExpenses
      }
    };

    const fileName = `gbms_full_backup_${format(new Date(), "yyyyMMdd_HHmmss")}.json`;

    // 3. Record this backup in the database so the reminder banner clears
    await db.insert(backups).values({
      fileName,
    });

    // 4. Return the JSON file for download
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error(error);
    return new NextResponse("Failed to generate backup", { status: 500 });
  }
}
