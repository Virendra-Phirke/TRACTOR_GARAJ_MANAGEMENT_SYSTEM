import { NextRequest, NextResponse } from "next/server";
import { generateInvoicePdf, InvoicePdfData } from "@/lib/pdf/invoice-pdf";
import { format } from "date-fns";
import { getGarageSettings, getUpiSettings } from "@/lib/actions/settings";
import { generateUpiQrDataUrl } from "@/lib/qr/upi-qr";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const theme = searchParams.get("theme") || "default";
    const formatStr = searchParams.get("format") || "standard";
    const [garage, upi] = await Promise.all([getGarageSettings(), getUpiSettings()]);

    // Generate a real QR code for the preview
    let qrDataUrl: string | undefined;
    if (upi.isEnabled && upi.vpa) {
      qrDataUrl = await generateUpiQrDataUrl({
        vpa: upi.vpa,
        payeeName: upi.payeeName,
        amount: 3803,
        transactionNote: "INV-PREVIEW-01",
      });
    }

    // Use actual garage data in the preview so it looks realistic
    const dummyData: InvoicePdfData = {
      garageName: garage.name || "My Tractor Garage",
      ownerName: upi.payeeName || "Owner",
      garageAddress: garage.address || "123 Tractor Road, Pune 412108",
      garagePhone: garage.phone || "+91 9373099032",
      garageEmail: garage.email || "contact@garage.com",
      gstNumber: garage.gstNumber || "22AAAAA0000A1Z5",
      garageTagline: garage.tagline || "Trusted Tractor Service Center",
      invoiceNumber: "INV-PREVIEW-01",
      invoiceDate: format(new Date(), "dd MMM yyyy, hh:mm a"),
      paymentDate: format(new Date(), "dd MMM yyyy, hh:mm a"),
      customerName: "Rajesh Kumar Patil",
      customerPhone: "+91 98765 43210",
      customerAddress: "456 Harvest Lane, Near Bus Stand, Akola",
      vehicleReg: "MH-12-AB-1234",
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
      cashAmount: 2000,
      upiAmount: 1803,
      paymentMethod: "split",
      upiQrDataUrl: qrDataUrl,
      upiVpa: upi.vpa || undefined,
      theme: theme,
      format: formatStr,
      customLayoutConfig: (garage as any).customLayoutConfig || undefined,
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
