import { NextRequest, NextResponse } from "next/server";
import { generateInvoicePdf, InvoicePdfData } from "@/lib/pdf/invoice-pdf";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const theme = searchParams.get("theme") || "default";
    const formatStr = searchParams.get("format") || "standard";

    // Create some dummy data for the preview
    const dummyData: InvoicePdfData = {
      garageName: "My Tractor Garage",
      ownerName: "John Doe",
      garageAddress: "123 Tractor Road, Farmville, TX 75001",
      garagePhone: "+1 (555) 123-4567",
      garageEmail: "contact@mytractorgarage.com",
      gstNumber: "22AAAAA0000A1Z5",
      garageTagline: "Trusted Tractor Service Center",
      invoiceNumber: "INV-PREVIEW-01",
      invoiceDate: format(new Date(), "dd MMM yyyy"),
      paymentDate: format(new Date(), "dd MMM yyyy"),
      customerName: "Jane Smith",
      customerPhone: "+1 (555) 987-6543",
      customerAddress: "456 Harvest Lane, Cropville, TX 75002",
      vehicleReg: "TX-77-FARM",
      vehicleBrand: "Mahindra",
      vehicleModel: "575 DI",
      laborItems: [
        { description: "General Servicing", hours: 2, rate: 500, total: 1000 },
        { description: "Engine Tuning", hours: 1, rate: 800, total: 800 },
      ],
      partItems: [
        { partName: "Engine Oil (5L)", quantity: 1, unitPrice: 1200, total: 1200 },
        { partName: "Oil Filter", quantity: 1, unitPrice: 350, total: 350 },
      ],
      laborTotal: 1800,
      partsTotal: 1550,
      subtotal: 3350,
      taxRate: 18,
      taxAmount: 603,
      discountAmount: 150,
      grandTotal: 3803,
      amountPaid: 3803,
      paymentStatus: "paid",
      cashAmount: 3803,
      theme: theme,
      format: formatStr,
    };

    const pdfBytes = await generateInvoicePdf(dummyData);

    return new NextResponse(pdfBytes as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="preview-${theme}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating preview PDF:", error);
    return NextResponse.json({ error: "Failed to generate preview PDF" }, { status: 500 });
  }
}
