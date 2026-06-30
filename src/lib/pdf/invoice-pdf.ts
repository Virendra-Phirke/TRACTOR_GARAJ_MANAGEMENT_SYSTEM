import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, setFontAndSize } from "pdf-lib";

export interface InvoicePdfData {
  garageName: string;
  ownerName?: string;
  garageAddress: string;
  garagePhone: string;
  garageEmail: string;
  gstNumber: string;
  garageTagline: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentDate?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  vehicleReg: string;
  vehicleBrand: string;
  vehicleModel: string;
  laborItems: { description: string; hours: number; rate: number; total: number }[];
  partItems: { partName: string; quantity: number; unitPrice: number; total: number }[];
  laborTotal: number;
  partsTotal: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  amountPaid: number;
  paymentStatus: string;
  upiQrDataUrl?: string;
  upiVpa?: string;
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function generateInvoicePdf(
  data: InvoicePdfData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 Size
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;
  
  // Color Palette
  const primaryColor = rgb(0.1, 0.5, 0.3); // Deep Green
  const textColor = rgb(0.2, 0.2, 0.2);
  const mutedColor = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.95, 0.95, 0.95);
  const borderColor = rgb(0.85, 0.85, 0.85);

  // Helper to draw text right-aligned
  const drawRightText = (text: string, xPos: number, yPos: number, size: number, font: PDFFont, color = textColor) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: xPos - textWidth, y: yPos, size, font, color });
  };

  // ─── Header ────────────────────────────────────────────────────────
  page.drawText(data.garageName.toUpperCase(), {
    x: margin,
    y: y - 10,
    size: 22,
    font: fontBold,
    color: primaryColor,
  });
  
  y -= 25;
  if (data.ownerName) {
    page.drawText(`Proprietor: ${data.ownerName}`, { x: margin, y, size: 10, font: fontBold, color: textColor });
    y -= 14;
  }
  if (data.garageTagline) {
    page.drawText(data.garageTagline, { x: margin, y, size: 9, font: fontRegular, color: mutedColor });
    y -= 14;
  }
  if (data.garageAddress) {
    page.drawText(data.garageAddress, { x: margin, y, size: 9, font: fontRegular, color: mutedColor });
    y -= 14;
  }
  const contactParts = [data.garagePhone, data.garageEmail].filter(Boolean);
  if (contactParts.length) {
    page.drawText(contactParts.join(" | "), { x: margin, y, size: 9, font: fontRegular, color: mutedColor });
    y -= 14;
  }
  if (data.gstNumber) {
    page.drawText(`GSTIN: ${data.gstNumber}`, { x: margin, y, size: 9, font: fontBold, color: textColor });
  }

  // Invoice Details (Right Aligned)
  let invY = height - margin - 10;
  drawRightText("TAX INVOICE", width - margin, invY, 20, fontBold, primaryColor);
  invY -= 22;
  drawRightText(`Invoice No: ${data.invoiceNumber}`, width - margin, invY, 10, fontBold, textColor);
  invY -= 14;
  drawRightText(`Created: ${data.invoiceDate}`, width - margin, invY, 10, fontRegular, mutedColor);
  if (data.paymentDate && data.paymentStatus === "paid") {
    invY -= 14;
    drawRightText(`Paid On: ${data.paymentDate}`, width - margin, invY, 10, fontRegular, rgb(0.1, 0.6, 0.3));
  }

  y = Math.min(y - 20, invY - 20);
  
  // Divider
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: primaryColor });
  y -= 20;

  // ─── Customer & Vehicle Info (Two Columns) ─────────────────────────
  page.drawRectangle({
    x: margin,
    y: y - 85,
    width: width - (margin * 2),
    height: 100,
    color: lightGray,
    borderColor: borderColor,
    borderWidth: 1,
  });

  const col1X = margin + 15;
  const col2X = width / 2 + 15;
  let infoY = y - 5;
  
  page.drawText("BILL TO", { x: col1X, y: infoY, size: 9, font: fontBold, color: primaryColor });
  page.drawText("VEHICLE DETAILS", { x: col2X, y: infoY, size: 9, font: fontBold, color: primaryColor });
  infoY -= 18;

  page.drawText(data.customerName, { x: col1X, y: infoY, size: 11, font: fontBold, color: textColor });
  page.drawText(`${data.vehicleBrand} ${data.vehicleModel}`.trim(), { x: col2X, y: infoY, size: 11, font: fontBold, color: textColor });
  infoY -= 16;

  page.drawText(`Phone: ${data.customerPhone}`, { x: col1X, y: infoY, size: 10, font: fontRegular, color: textColor });
  page.drawText(`Reg No: ${data.vehicleReg}`, { x: col2X, y: infoY, size: 10, font: fontRegular, color: textColor });
  infoY -= 16;

  if (data.customerAddress) {
    page.drawText(data.customerAddress.substring(0, 50), { x: col1X, y: infoY, size: 10, font: fontRegular, color: textColor });
  }

  y -= 105; // Move past the info box

  // ─── Helper for Drawing Tables ─────────────────────────────────────
  const drawTable = (title: string, items: any[], type: "labor" | "parts") => {
    if (items.length === 0) return;

    page.drawText(title, { x: margin, y, size: 11, font: fontBold, color: primaryColor });
    y -= 25;

    // Table Header
    page.drawRectangle({ x: margin, y: y - 6, width: width - (margin * 2), height: 22, color: primaryColor });
    
    const cIdx = margin + 10;
    const cDesc = margin + 40;
    const cQty = margin + 300;
    const cRate = margin + 380;
    const cAmt = width - margin - 10;
    
    const thY = y;
    page.drawText("#", { x: cIdx, y: thY, size: 9, font: fontBold, color: rgb(1,1,1) });
    page.drawText(type === "labor" ? "Description" : "Part Name", { x: cDesc, y: thY, size: 9, font: fontBold, color: rgb(1,1,1) });
    
    if (type === "parts") {
      drawRightText("Qty", cQty, thY, 9, fontBold, rgb(1,1,1));
      drawRightText("Rate", cRate, thY, 9, fontBold, rgb(1,1,1));
    }
    
    drawRightText("Total", cAmt, thY, 9, fontBold, rgb(1,1,1));
    
    y -= 20;

    // Rows
    items.forEach((item, index) => {
      // zebra striping
      if (index % 2 === 0) {
        page.drawRectangle({ x: margin, y: y - 6, width: width - (margin * 2), height: 22, color: lightGray });
      }

      page.drawText(`${index + 1}`, { x: cIdx, y, size: 9, font: fontRegular, color: textColor });
      
      const desc = type === "labor" ? item.description : item.partName;
      page.drawText(desc.substring(0, 50), { x: cDesc, y, size: 9, font: fontRegular, color: textColor });
      
      if (type === "parts") {
        drawRightText(`${item.quantity}`, cQty, y, 9, fontRegular, textColor);
        drawRightText(formatCurrency(item.unitPrice), cRate, y, 9, fontRegular, textColor);
      }
      
      drawRightText(formatCurrency(item.total), cAmt, y, 9, fontBold, textColor);

      y -= 20;
    });

    // Bottom border
    page.drawLine({ start: { x: margin, y: y + 10 }, end: { x: width - margin, y: y + 10 }, thickness: 1, color: borderColor });
    y -= 15;
  };

  drawTable("LABOR CHARGES", data.laborItems, "labor");
  drawTable("SPARE PARTS", data.partItems, "parts");

  // ─── Totals Section ────────────────────────────────────────────────
  const totalsBoxWidth = 220;
  const totalsX = width - margin - totalsBoxWidth;
  
  page.drawRectangle({
    x: totalsX,
    y: y - 145,
    width: totalsBoxWidth,
    height: 155,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: borderColor,
    borderWidth: 1,
  });

  const lblX = totalsX + 15;
  const valX = totalsX + totalsBoxWidth - 15;
  let totY = y - 15;

  const drawSummaryRow = (label: string, value: string, bold = false) => {
    const f = bold ? fontBold : fontRegular;
    page.drawText(label, { x: lblX, y: totY, size: 10, font: f, color: textColor });
    drawRightText(value, valX, totY, 10, f, textColor);
    totY -= 18;
  };

  drawSummaryRow("Labor Total:", formatCurrency(data.laborTotal));
  drawSummaryRow("Parts Total:", formatCurrency(data.partsTotal));
  drawSummaryRow("Subtotal:", formatCurrency(data.subtotal));
  if (data.taxRate > 0) {
    drawSummaryRow(`Tax (${data.taxRate}%):`, formatCurrency(data.taxAmount));
  }
  if (data.discountAmount > 0) {
    drawSummaryRow("Discount:", `-${formatCurrency(data.discountAmount)}`);
  }
  
  // Grand Total Line
  page.drawLine({ start: { x: totalsX, y: totY + 10 }, end: { x: totalsX + totalsBoxWidth, y: totY + 10 }, thickness: 1, color: borderColor });
  totY -= 5;

  page.drawText("GRAND TOTAL", { x: lblX, y: totY, size: 12, font: fontBold, color: primaryColor });
  drawRightText(formatCurrency(data.grandTotal), valX, totY, 12, fontBold, primaryColor);

  // ── Payment Status Stamp ────────────────────────────────────────────
  // Track the y position for the left column (status + QR below totals)
  let leftY = y;

  if (data.paymentStatus === "paid") {
    page.drawText("PAID IN FULL", { x: margin, y: leftY - 15, size: 22, font: fontBold, color: rgb(0.2, 0.7, 0.3) });
    leftY -= 40;
  } else if (data.paymentStatus === "partial" && data.amountPaid > 0) {
    const balanceDue = data.grandTotal - data.amountPaid;

    // Paid amount
    page.drawText("PARTIALLY PAID", { x: margin, y: leftY - 15, size: 14, font: fontBold, color: rgb(0.9, 0.55, 0.1) });
    leftY -= 35;

    // Paid row
    page.drawRectangle({ x: margin, y: leftY - 8, width: 200, height: 22, color: rgb(0.95, 0.98, 0.95) });
    page.drawText("Paid:", { x: margin + 10, y: leftY - 2, size: 10, font: fontRegular, color: textColor });
    drawRightText(formatCurrency(data.amountPaid), margin + 190, leftY - 2, 10, fontBold, rgb(0.15, 0.55, 0.3));
    leftY -= 24;

    // Balance row
    page.drawRectangle({ x: margin, y: leftY - 8, width: 200, height: 22, color: rgb(1, 0.95, 0.95) });
    page.drawText("Balance Due:", { x: margin + 10, y: leftY - 2, size: 10, font: fontBold, color: rgb(0.7, 0.15, 0.15) });
    drawRightText(formatCurrency(balanceDue), margin + 190, leftY - 2, 10, fontBold, rgb(0.7, 0.15, 0.15));
    leftY -= 30;
  } else if (data.paymentStatus === "unpaid") {
    page.drawText("UNPAID", { x: margin, y: leftY - 15, size: 16, font: fontBold, color: rgb(0.8, 0.2, 0.2) });
    leftY -= 40;
  }

  // ─── UPI QR Code (below payment status) ────────────────────────────
  if (data.upiQrDataUrl && data.upiVpa && data.paymentStatus !== "paid") {
    const qrSize = 80;
    const qrX = margin;
    const qrY = leftY - qrSize - 5;
    const qrTextX = qrX + qrSize + 15;

    // Calculate the amount to show on QR (balance for partial, full for unpaid)
    const qrAmount = data.paymentStatus === "partial" && data.amountPaid > 0
      ? data.grandTotal - data.amountPaid
      : data.grandTotal;

    try {
      const base64Data = data.upiQrDataUrl.split(",")[1];
      if (base64Data) {
        const qrImageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const qrImage = await pdfDoc.embedPng(qrImageBytes);
        page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
      }
    } catch {
      // Ignore QR errors
    }

    page.drawText("Scan to Pay", { x: qrTextX, y: qrY + qrSize - 15, size: 10, font: fontBold, color: textColor });
    page.drawText(formatCurrency(qrAmount), { x: qrTextX, y: qrY + qrSize - 35, size: 14, font: fontBold, color: primaryColor });
    if (data.paymentStatus === "partial") {
      page.drawText("(Balance Due)", { x: qrTextX, y: qrY + qrSize - 50, size: 8, font: fontRegular, color: rgb(0.9, 0.55, 0.1) });
      page.drawText(`UPI ID: ${data.upiVpa}`, { x: qrTextX, y: qrY + qrSize - 64, size: 9, font: fontRegular, color: mutedColor });
    } else {
      page.drawText(`UPI ID: ${data.upiVpa}`, { x: qrTextX, y: qrY + qrSize - 50, size: 9, font: fontRegular, color: mutedColor });
    }
  }

  // ─── Footer ────────────────────────────────────────────────────────
  page.drawText("Authorized Signature", { x: width - margin - 110, y: 50, size: 10, font: fontRegular, color: textColor });
  page.drawLine({ start: { x: width - margin - 150, y: 65 }, end: { x: width - margin, y: 65 }, thickness: 1, color: textColor });

  page.drawText("Thank you for your business!", { x: margin, y: 30, size: 10, font: fontBold, color: primaryColor });
  page.drawText("This is a computer-generated invoice and does not require a physical signature.", { x: margin, y: 18, size: 8, font: fontRegular, color: mutedColor });

  return pdfDoc.save();
}
