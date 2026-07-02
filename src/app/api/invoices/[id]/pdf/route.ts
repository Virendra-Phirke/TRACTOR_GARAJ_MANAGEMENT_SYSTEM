import { NextResponse } from "next/server";
import { getInvoiceById } from "@/lib/actions/invoices";
import { getGarageSettings, getUpiSettings } from "@/lib/actions/settings";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { generateUpiQrDataUrl } from "@/lib/qr/upi-qr";
import { formatInTimeZone } from "date-fns-tz";
import { verifyApiRequest } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ─── Auth check ────────────────────────────────────────────────────
  const isAuthed = await verifyApiRequest(request);
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: rawId } = await params;

    // ─── Input validation ──────────────────────────────────────────
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid invoice ID" },
        { status: 400 }
      );
    }

    const [invoice, garage, upi] = await Promise.all([
      getInvoiceById(id),
      getGarageSettings(),
      getUpiSettings(),
    ]);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    let qrDataUrl: string | undefined;
    if (upi.isEnabled && upi.vpa && invoice.grandTotal) {
      qrDataUrl = await generateUpiQrDataUrl({
        vpa: upi.vpa,
        payeeName: upi.payeeName,
        amount: invoice.grandTotal,
        transactionNote: invoice.invoiceNumber,
      });
    }

    const pdfBytes = await generateInvoicePdf({
      garageName: garage.name,
      ownerName: upi.payeeName || "",
      garageAddress: garage.address || "",
      garagePhone: garage.phone || "",
      garageEmail: garage.email || "",
      gstNumber: garage.gstNumber || "",
      garageTagline: garage.tagline || "",
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: formatInTimeZone(new Date(invoice.createdAt), 'Asia/Kolkata', "dd MMM yyyy, hh:mm a"),
      paymentDate: invoice.paymentDoneAt ? formatInTimeZone(new Date(invoice.paymentDoneAt), 'Asia/Kolkata', "dd MMM yyyy, hh:mm a") : undefined,
      customerName: invoice.customerName || "—",
      customerPhone: invoice.customerPhone || "—",
      customerAddress: invoice.customerAddress || "",
      vehicleReg: invoice.vehicleReg || "—",
      vehicleBrand: invoice.vehicleBrand || "",
      vehicleModel: invoice.vehicleModel || "",
      laborItems: invoice.laborItems.map((i) => ({
        description: i.description,
        hours: i.hours || 1,
        rate: i.rate,
        total: i.total,
      })),
      partItems: invoice.partItems.map((i) => ({
        partName: i.partName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
      })),
      laborTotal: invoice.laborTotal || 0,
      partsTotal: invoice.partsTotal || 0,
      subtotal: invoice.subtotal || 0,
      taxRate: invoice.taxRate || 0,
      taxAmount: invoice.taxAmount || 0,
      discountAmount: invoice.discountAmount || 0,
      grandTotal: invoice.grandTotal || 0,
      amountPaid: invoice.amountPaid || 0,
      cashAmount: invoice.cashAmount || 0,
      upiAmount: invoice.upiAmount || 0,
      paymentMethod: invoice.paymentMethod || undefined,
      paymentStatus: invoice.paymentStatus,
      upiQrDataUrl: qrDataUrl,
      upiVpa: upi.vpa || undefined,
      theme: garage.invoiceTheme || "default",
      format: garage.invoiceFormat || "standard",
      customLayoutConfig: (garage as any).customLayoutConfig || undefined,
    });

    return new NextResponse(pdfBytes as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
