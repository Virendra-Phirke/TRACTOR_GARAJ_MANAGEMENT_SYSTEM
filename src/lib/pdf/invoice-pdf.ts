import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, degrees } from "pdf-lib";

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
  cashAmount?: number;
  upiAmount?: number;
  paymentMethod?: string;
  paymentStatus: string;
  upiQrDataUrl?: string;
  upiVpa?: string;
  format?: string;
  theme?: string;
  customLayoutConfig?: any;
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getPdfColors(theme: string) {
  switch (theme) {
    case "modern": return { primaryColor: rgb(37/255, 99/255, 235/255), textColor: rgb(0.2, 0.2, 0.2), mutedColor: rgb(0.4, 0.4, 0.4) }; // Ocean Blue
    case "minimal": return { primaryColor: rgb(26/255, 26/255, 26/255), textColor: rgb(0.2, 0.2, 0.2), mutedColor: rgb(0.4, 0.4, 0.4) }; // Minimal Dark
    case "bold": return { primaryColor: rgb(220/255, 38/255, 38/255), textColor: rgb(0.2, 0.2, 0.2), mutedColor: rgb(0.4, 0.4, 0.4) }; // Bold Red
    case "sunset": return { primaryColor: rgb(217/255, 119/255, 6/255), textColor: rgb(0.2, 0.2, 0.2), mutedColor: rgb(0.4, 0.4, 0.4) }; // Sunset Orange
    case "purple": return { primaryColor: rgb(147/255, 51/255, 234/255), textColor: rgb(0.2, 0.2, 0.2), mutedColor: rgb(0.4, 0.4, 0.4) }; // Purple
    case "teal": return { primaryColor: rgb(13/255, 148/255, 136/255), textColor: rgb(0.2, 0.2, 0.2), mutedColor: rgb(0.4, 0.4, 0.4) }; // Teal
    case "slate": return { primaryColor: rgb(71/255, 85/255, 105/255), textColor: rgb(0.2, 0.2, 0.2), mutedColor: rgb(0.4, 0.4, 0.4) }; // Slate
    default: return { primaryColor: rgb(21/255, 128/255, 61/255), textColor: rgb(0.2, 0.2, 0.2), mutedColor: rgb(0.4, 0.4, 0.4) }; // Classic Green
  }
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const colors = getPdfColors(data.theme || "default");
  const fmt = data.format || "classic_boxed";
  
  if (fmt === "custom_layout") {
    return generateCustomLayout(data, colors);
  } else if (fmt === "centered_pro") {
    return generateCenteredProfessional(data, colors);
  } else if (fmt === "grid_structured") {
    return generateGridStructured(data, colors);
  } else if (fmt === "modern_accent") {
    return generateModernAccent(data, colors);
  } else if (fmt === "original_standard") {
    return generateOriginalStandard(data, colors);
  }
  
  return generateClassicBoxed(data, colors);
}

const drawRightText = (page: PDFPage, text: string, xPos: number, yPos: number, size: number, font: PDFFont, color: any) => {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: xPos - textWidth, y: yPos, size, font, color });
};

async function renderPaymentStatus(page: PDFPage, data: InvoicePdfData, pdfDoc: PDFDocument, margin: number, leftY: number, textColor: any, mutedColor: any, primaryColor: any, fontBold: PDFFont, fontRegular: PDFFont) {
  if (data.paymentStatus === "paid") {
    page.drawText("PAID IN FULL", { x: margin, y: leftY - 15, size: 22, font: fontBold, color: rgb(0.2, 0.7, 0.3) });
    leftY -= 35;
    if ((data.cashAmount && data.cashAmount > 0) || (data.upiAmount && data.upiAmount > 0)) {
      if (data.cashAmount && data.cashAmount > 0) {
        page.drawText(`Via Cash: ${formatCurrency(data.cashAmount)}`, { x: margin, y: leftY, size: 10, font: fontRegular, color: textColor });
        leftY -= 14;
      }
      if (data.upiAmount && data.upiAmount > 0) {
        page.drawText(`Via UPI: ${formatCurrency(data.upiAmount)}`, { x: margin, y: leftY, size: 10, font: fontRegular, color: textColor });
        leftY -= 14;
      }
      leftY -= 5;
    }
  } else if (data.paymentStatus === "partial" && data.amountPaid > 0) {
    const balanceDue = data.grandTotal - data.amountPaid;
    page.drawText("PARTIALLY PAID", { x: margin, y: leftY - 15, size: 14, font: fontBold, color: rgb(0.9, 0.55, 0.1) });
    leftY -= 35;
    page.drawRectangle({ x: margin, y: leftY - 8, width: 200, height: 22, color: rgb(0.95, 0.98, 0.95) });
    page.drawText("Paid:", { x: margin + 10, y: leftY - 2, size: 10, font: fontRegular, color: textColor });
    drawRightText(page, formatCurrency(data.amountPaid), margin + 190, leftY - 2, 10, fontBold, rgb(0.15, 0.55, 0.3));
    leftY -= 20;

    if ((data.cashAmount && data.cashAmount > 0) || (data.upiAmount && data.upiAmount > 0)) {
      if (data.cashAmount && data.cashAmount > 0) {
        page.drawText(`Via Cash: ${formatCurrency(data.cashAmount)}`, { x: margin + 10, y: leftY - 2, size: 9, font: fontRegular, color: mutedColor });
        leftY -= 12;
      }
      if (data.upiAmount && data.upiAmount > 0) {
        page.drawText(`Via UPI: ${formatCurrency(data.upiAmount)}`, { x: margin + 10, y: leftY - 2, size: 9, font: fontRegular, color: mutedColor });
        leftY -= 12;
      }
      leftY -= 5;
    } else {
      leftY -= 5;
    }
    page.drawRectangle({ x: margin, y: leftY - 8, width: 200, height: 22, color: rgb(1, 0.95, 0.95) });
    page.drawText("Balance Due:", { x: margin + 10, y: leftY - 2, size: 10, font: fontBold, color: rgb(0.7, 0.15, 0.15) });
    drawRightText(page, formatCurrency(balanceDue), margin + 190, leftY - 2, 10, fontBold, rgb(0.7, 0.15, 0.15));
    leftY -= 30;
  } else if (data.paymentStatus === "unpaid") {
    page.drawText("UNPAID", { x: margin, y: leftY - 15, size: 16, font: fontBold, color: rgb(0.8, 0.2, 0.2) });
    leftY -= 40;
  }

  if (data.upiQrDataUrl && data.upiVpa && data.paymentStatus !== "paid") {
    const qrSize = 80;
    const qrX = margin;
    const qrY = leftY - qrSize - 5;
    const qrTextX = qrX + qrSize + 15;
    const qrAmount = data.paymentStatus === "partial" && data.amountPaid > 0 ? data.grandTotal - data.amountPaid : data.grandTotal;

    try {
      const base64Data = data.upiQrDataUrl.split(",")[1];
      if (base64Data) {
        const qrImageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const qrImage = await pdfDoc.embedPng(qrImageBytes);
        page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
      }
    } catch { }

    page.drawText("Scan to Pay", { x: qrTextX, y: qrY + qrSize - 15, size: 10, font: fontBold, color: textColor });
    page.drawText(formatCurrency(qrAmount), { x: qrTextX, y: qrY + qrSize - 35, size: 14, font: fontBold, color: primaryColor });
    if (data.paymentStatus === "partial") {
      page.drawText("(Balance Due)", { x: qrTextX, y: qrY + qrSize - 50, size: 8, font: fontRegular, color: rgb(0.9, 0.55, 0.1) });
      page.drawText(`UPI ID: ${data.upiVpa}`, { x: qrTextX, y: qrY + qrSize - 64, size: 9, font: fontRegular, color: mutedColor });
    } else {
      page.drawText(`UPI ID: ${data.upiVpa}`, { x: qrTextX, y: qrY + qrSize - 50, size: 9, font: fontRegular, color: mutedColor });
    }
  }
}

async function generateOriginalStandard(data: InvoicePdfData, colors: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;

  const { primaryColor, textColor, mutedColor } = colors;
  const borderColor = rgb(0.85, 0.85, 0.85);

  page.drawText(data.garageName.toUpperCase(), { x: margin, y: y - 10, size: 22, font: fontBold, color: primaryColor });
  y -= 25;
  if (data.ownerName) { page.drawText(`Proprietor: ${data.ownerName}`, { x: margin, y, size: 10, font: fontBold, color: textColor }); y -= 14; }
  if (data.garageTagline) { page.drawText(data.garageTagline, { x: margin, y, size: 9, font: fontRegular, color: mutedColor }); y -= 14; }
  if (data.garageAddress) { page.drawText(data.garageAddress, { x: margin, y, size: 9, font: fontRegular, color: mutedColor }); y -= 14; }
  const contactParts = [data.garagePhone, data.garageEmail].filter(Boolean);
  if (contactParts.length) { page.drawText(contactParts.join(" | "), { x: margin, y, size: 9, font: fontRegular, color: mutedColor }); y -= 14; }
  if (data.gstNumber) { page.drawText(`GSTIN: ${data.gstNumber}`, { x: margin, y, size: 9, font: fontBold, color: textColor }); }

  let invY = height - margin - 10;
  drawRightText(page, "TAX INVOICE", width - margin, invY, 20, fontBold, primaryColor);
  invY -= 22;
  drawRightText(page, `Invoice No: ${data.invoiceNumber}`, width - margin, invY, 10, fontBold, textColor);
  invY -= 14;
  drawRightText(page, `Created: ${data.invoiceDate}`, width - margin, invY, 10, fontRegular, mutedColor);
  if (data.paymentDate && data.paymentStatus === "paid") {
    invY -= 14;
    drawRightText(page, `Paid On: ${data.paymentDate}`, width - margin, invY, 10, fontRegular, rgb(0.1, 0.6, 0.3));
  }

  y = Math.min(y - 20, invY - 20);
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: primaryColor });
  y -= 20;

  page.drawRectangle({
    x: margin, y: y - 85, width: width - (margin * 2), height: 100,
    color: rgb(0.98, 0.98, 0.98), borderColor, borderWidth: 1,
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
  y -= 105;

  const drawTable = (title: string, items: any[], type: "labor" | "parts") => {
    if (items.length === 0) return;
    page.drawText(title, { x: margin, y, size: 11, font: fontBold, color: primaryColor });
    y -= 25;
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
      drawRightText(page, "Qty", cQty, thY, 9, fontBold, rgb(1,1,1));
      drawRightText(page, "Rate", cRate, thY, 9, fontBold, rgb(1,1,1));
    }
    drawRightText(page, "Total", cAmt, thY, 9, fontBold, rgb(1,1,1));
    y -= 20;

    items.forEach((item, index) => {
      if (index % 2 === 0) page.drawRectangle({ x: margin, y: y - 6, width: width - (margin * 2), height: 22, color: rgb(0.95, 0.95, 0.95) });
      page.drawText(`${index + 1}`, { x: cIdx, y, size: 9, font: fontRegular, color: textColor });
      const desc = type === "labor" ? item.description : item.partName;
      page.drawText(desc.substring(0, 50), { x: cDesc, y, size: 9, font: fontRegular, color: textColor });
      if (type === "parts") {
        drawRightText(page, `${item.quantity}`, cQty, y, 9, fontRegular, textColor);
        drawRightText(page, formatCurrency(item.unitPrice), cRate, y, 9, fontRegular, textColor);
      }
      drawRightText(page, formatCurrency(item.total), cAmt, y, 9, fontBold, textColor);
      y -= 20;
    });
    page.drawLine({ start: { x: margin, y: y + 10 }, end: { x: width - margin, y: y + 10 }, thickness: 1, color: borderColor });
    y -= 15;
  };

  drawTable("LABOR CHARGES", data.laborItems, "labor");
  drawTable("SPARE PARTS", data.partItems, "parts");

  const totalsBoxWidth = 220;
  const totalsX = width - margin - totalsBoxWidth;
  page.drawRectangle({
    x: totalsX, y: y - 145, width: totalsBoxWidth, height: 155,
    color: rgb(0.98, 0.98, 0.98), borderColor, borderWidth: 1,
  });

  const lblX = totalsX + 15;
  const valX = totalsX + totalsBoxWidth - 15;
  let totY = y - 15;

  const drawSummaryRow = (label: string, value: string, bold = false) => {
    const f = bold ? fontBold : fontRegular;
    page.drawText(label, { x: lblX, y: totY, size: 10, font: f, color: textColor });
    drawRightText(page, value, valX, totY, 10, f, textColor);
    totY -= 18;
  };

  drawSummaryRow("Labor Total:", formatCurrency(data.laborTotal));
  drawSummaryRow("Parts Total:", formatCurrency(data.partsTotal));
  drawSummaryRow("Subtotal:", formatCurrency(data.subtotal));
  if (data.taxRate > 0) drawSummaryRow(`Tax (${data.taxRate}%):`, formatCurrency(data.taxAmount));
  if (data.discountAmount > 0) drawSummaryRow("Discount:", `-${formatCurrency(data.discountAmount)}`);
  
  page.drawLine({ start: { x: totalsX, y: totY + 10 }, end: { x: totalsX + totalsBoxWidth, y: totY + 10 }, thickness: 1, color: borderColor });
  totY -= 5;
  page.drawText("GRAND TOTAL", { x: lblX, y: totY, size: 12, font: fontBold, color: primaryColor });
  drawRightText(page, formatCurrency(data.grandTotal), valX, totY, 12, fontBold, primaryColor);

  await renderPaymentStatus(page, data, pdfDoc, margin, y, textColor, mutedColor, primaryColor, fontBold, fontRegular);

  page.drawText("Authorized Signature", { x: width - margin - 110, y: 50, size: 10, font: fontRegular, color: textColor });
  page.drawLine({ start: { x: width - margin - 150, y: 65 }, end: { x: width - margin, y: 65 }, thickness: 1, color: textColor });
  page.drawText("Thank you for your business!", { x: margin, y: 30, size: 10, font: fontBold, color: primaryColor });
  page.drawText("This is a computer-generated invoice and does not require a physical signature.", { x: margin, y: 18, size: 8, font: fontRegular, color: mutedColor });

  return pdfDoc.save();
}

async function generateClassicBoxed(data: InvoicePdfData, colors: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - 60;
  const { primaryColor, textColor, mutedColor } = colors;

  page.drawText(data.garageName.toUpperCase(), { x: margin, y, size: 20, font: fontBold, color: primaryColor });
  let subY = y - 15;
  if (data.ownerName) { page.drawText(data.ownerName, { x: margin, y: subY, size: 10, font: fontBold, color: textColor }); subY -= 14; }
  const contactParts = [data.garagePhone, data.garageEmail].filter(Boolean);
  if (contactParts.length) { page.drawText(contactParts.join(" | "), { x: margin, y: subY, size: 9, font: fontRegular, color: mutedColor }); subY -= 12; }
  if (data.garageAddress) { page.drawText(data.garageAddress, { x: margin, y: subY, size: 9, font: fontRegular, color: mutedColor }); subY -= 12; }
  
  drawRightText(page, "TAX INVOICE", width - margin, y, 18, fontBold, primaryColor);
  drawRightText(page, `Invoice No: ${data.invoiceNumber}`, width - margin, y - 18, 10, fontBold, textColor);
  drawRightText(page, `Date: ${data.invoiceDate}`, width - margin, y - 32, 9, fontRegular, mutedColor);

  y = subY - 30;

  const boxWidth = (width - (margin * 2) - 20) / 2;
  page.drawRectangle({ x: margin, y: y - 110, width: boxWidth, height: 110, borderColor: primaryColor, borderWidth: 1 });
  page.drawRectangle({ x: margin + boxWidth + 20, y: y - 110, width: boxWidth, height: 110, borderColor: primaryColor, borderWidth: 1 });
  
  page.drawRectangle({ x: margin + 10, y: y - 10, width: 50, height: 20, color: rgb(1,1,1) });
  page.drawText("BILL TO", { x: margin + 15, y: y - 5, size: 10, font: fontBold, color: textColor });
  
  let b1Y = y - 25;
  page.drawText(data.customerName, { x: margin + 10, y: b1Y, size: 11, font: fontBold, color: textColor }); b1Y -= 16;
  page.drawText(`Phone: ${data.customerPhone}`, { x: margin + 10, y: b1Y, size: 10, font: fontRegular, color: textColor }); b1Y -= 16;
  if (data.customerAddress) { page.drawText(data.customerAddress.substring(0, 45), { x: margin + 10, y: b1Y, size: 10, font: fontRegular, color: textColor }); }

  const vX = margin + boxWidth + 20;
  page.drawRectangle({ x: vX + 10, y: y - 10, width: 60, height: 20, color: rgb(1,1,1) });
  page.drawText("VEHICLE", { x: vX + 15, y: y - 5, size: 10, font: fontBold, color: textColor });

  let b2Y = y - 25;
  page.drawText(`${data.vehicleBrand} ${data.vehicleModel}`.trim(), { x: vX + 10, y: b2Y, size: 11, font: fontBold, color: textColor }); b2Y -= 16;
  if (data.vehicleReg) { page.drawText(`Reg No: ${data.vehicleReg}`, { x: vX + 10, y: b2Y, size: 10, font: fontRegular, color: textColor }); }

  y -= 130;

  const drawTable = (title: string, items: any[], type: "labor" | "parts") => {
    if (items.length === 0) return;
    page.drawText(title, { x: margin, y, size: 10, font: fontBold, color: primaryColor });
    y -= 20;
    
    page.drawRectangle({ x: margin, y: y - 5, width: width - (margin * 2), height: 18, color: rgb(0.92, 0.92, 0.92) });
    const cDesc = margin + 10;
    const cQty = margin + 300;
    const cRate = margin + 380;
    const cAmt = width - margin - 10;
    
    page.drawText(type === "labor" ? "Description" : "Part Name", { x: cDesc, y, size: 9, font: fontBold, color: textColor });
    if (type === "parts") {
      drawRightText(page, "Qty", cQty, y, 9, fontBold, textColor);
      drawRightText(page, "Rate", cRate, y, 9, fontBold, textColor);
    }
    drawRightText(page, "Total", cAmt, y, 9, fontBold, textColor);
    y -= 18;

    items.forEach((item, index) => {
      if (index % 2 !== 0) page.drawRectangle({ x: margin, y: y - 5, width: width - (margin * 2), height: 18, color: rgb(0.96, 0.96, 0.96) });
      const desc = type === "labor" ? item.description : item.partName;
      page.drawText(desc.substring(0, 55), { x: cDesc, y, size: 9, font: fontRegular, color: textColor });
      if (type === "parts") {
        drawRightText(page, `${item.quantity}`, cQty, y, 9, fontRegular, textColor);
        drawRightText(page, formatCurrency(item.unitPrice), cRate, y, 9, fontRegular, textColor);
      }
      drawRightText(page, formatCurrency(item.total), cAmt, y, 9, fontBold, textColor);
      y -= 18;
    });
    y -= 10;
  };

  drawTable("LABOR CHARGES", data.laborItems, "labor");
  drawTable("SPARE PARTS", data.partItems, "parts");

  const totalsBoxWidth = 220;
  const totalsX = width - margin - totalsBoxWidth;
  page.drawRectangle({ x: totalsX, y: y - 115, width: totalsBoxWidth, height: 125, borderColor: primaryColor, borderWidth: 1 });
  
  let totY = y - 15;
  const drawSummaryRow = (label: string, value: string, bold = false) => {
    const f = bold ? fontBold : fontRegular;
    page.drawText(label, { x: totalsX + 15, y: totY, size: 10, font: f, color: textColor });
    drawRightText(page, value, totalsX + totalsBoxWidth - 15, totY, 10, f, textColor);
    totY -= 18;
  };

  drawSummaryRow("Subtotal:", formatCurrency(data.subtotal));
  if (data.taxRate > 0) drawSummaryRow(`Tax (${data.taxRate}%):`, formatCurrency(data.taxAmount));
  if (data.discountAmount > 0) drawSummaryRow("Discount:", `-${formatCurrency(data.discountAmount)}`);
  
  page.drawLine({ start: { x: totalsX, y: totY + 10 }, end: { x: totalsX + totalsBoxWidth, y: totY + 10 }, thickness: 1, color: primaryColor });
  totY -= 5;
  page.drawText("TOTAL", { x: totalsX + 15, y: totY, size: 12, font: fontBold, color: primaryColor });
  drawRightText(page, formatCurrency(data.grandTotal), totalsX + totalsBoxWidth - 15, totY, 12, fontBold, primaryColor);

  await renderPaymentStatus(page, data, pdfDoc, margin, y - 10, textColor, mutedColor, primaryColor, fontBold, fontRegular);

  return pdfDoc.save();
}

async function generateCenteredProfessional(data: InvoicePdfData, colors: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height;
  const { primaryColor, textColor, mutedColor } = colors;

  page.drawRectangle({ x: 0, y: height - 15, width, height: 15, color: primaryColor });
  y -= 45;
  
  const textWidth = fontBold.widthOfTextAtSize(data.garageName.toUpperCase(), 24);
  page.drawText(data.garageName.toUpperCase(), { x: (width - textWidth)/2, y, size: 24, font: fontBold, color: primaryColor });
  y -= 18;

  const contactParts = [data.garagePhone, data.garageEmail, data.garageAddress].filter(Boolean);
  const contactText = contactParts.join(" | ");
  const cWidth = fontRegular.widthOfTextAtSize(contactText, 9);
  page.drawText(contactText, { x: (width - cWidth)/2, y, size: 9, font: fontRegular, color: mutedColor });
  
  y -= 40;
  page.drawRectangle({ x: margin, y: y - 5, width: width - (margin * 2), height: 25, color: rgb(0.95, 0.95, 0.95) });
  page.drawText(`INVOICE NO: ${data.invoiceNumber}`, { x: margin + 10, y: y + 2, size: 10, font: fontBold, color: textColor });
  drawRightText(page, `DATE: ${data.invoiceDate}`, width - margin - 10, y + 2, 10, fontBold, textColor);
  
  y -= 25;
  page.drawRectangle({ x: margin, y: y - 85, width: width - (margin * 2), height: 85, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
  page.drawLine({ start: { x: width/2, y: y }, end: { x: width/2, y: y - 85 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  
  page.drawText("BILL TO", { x: margin + 10, y: y - 15, size: 9, font: fontBold, color: textColor });
  page.drawText(data.customerName, { x: margin + 10, y: y - 35, size: 10, font: fontRegular, color: textColor });
  page.drawText(`Phone: ${data.customerPhone}`, { x: margin + 10, y: y - 48, size: 10, font: fontRegular, color: textColor });
  if (data.customerAddress) { page.drawText(data.customerAddress.substring(0, 45), { x: margin + 10, y: y - 61, size: 10, font: fontRegular, color: textColor }); }

  const vX = width/2 + 10;
  page.drawText("VEHICLE DETAILS", { x: vX, y: y - 15, size: 9, font: fontBold, color: textColor });
  page.drawText(`${data.vehicleBrand} ${data.vehicleModel}`.trim(), { x: vX, y: y - 35, size: 10, font: fontRegular, color: textColor });
  if (data.vehicleReg) { page.drawText(`Reg No: ${data.vehicleReg}`, { x: vX, y: y - 48, size: 10, font: fontRegular, color: textColor }); }

  y -= 105;

  const drawTable = (title: string, items: any[], type: "labor" | "parts") => {
    if (items.length === 0) return;
    
    page.drawRectangle({ x: margin, y: y - 5, width: width - (margin * 2), height: 20, color: rgb(0.15, 0.15, 0.15) });
    const cDesc = margin + 10;
    const cQty = margin + 300;
    const cRate = margin + 380;
    const cAmt = width - margin - 10;
    
    page.drawText(type === "labor" ? "DESCRIPTION" : "PART NAME", { x: cDesc, y, size: 9, font: fontBold, color: rgb(1,1,1) });
    if (type === "parts") {
      drawRightText(page, "QTY", cQty, y, 9, fontBold, rgb(1,1,1));
      drawRightText(page, "RATE", cRate, y, 9, fontBold, rgb(1,1,1));
    }
    drawRightText(page, "TOTAL", cAmt, y, 9, fontBold, rgb(1,1,1));
    y -= 20;

    page.drawText(title, { x: margin + 10, y: y - 2, size: 8, font: fontBold, color: primaryColor });
    y -= 16;

    items.forEach((item) => {
      const desc = type === "labor" ? item.description : item.partName;
      page.drawText(desc.substring(0, 55), { x: cDesc, y, size: 9, font: fontRegular, color: textColor });
      if (type === "parts") {
        drawRightText(page, `${item.quantity}`, cQty, y, 9, fontRegular, textColor);
        drawRightText(page, formatCurrency(item.unitPrice), cRate, y, 9, fontRegular, textColor);
      }
      drawRightText(page, formatCurrency(item.total), cAmt, y, 9, fontBold, textColor);
      page.drawLine({ start: { x: margin, y: y - 8 }, end: { x: width - margin, y: y - 8 }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
      y -= 20;
    });
    y -= 10;
  };

  drawTable("LABOR CHARGES", data.laborItems, "labor");
  drawTable("SPARE PARTS", data.partItems, "parts");

  const totalsBoxWidth = 200;
  const totalsX = width - margin - totalsBoxWidth;
  
  let totY = y;
  const drawSummaryRow = (label: string, value: string, bold = false) => {
    const f = bold ? fontBold : fontRegular;
    page.drawText(label, { x: totalsX + 15, y: totY, size: 10, font: f, color: textColor });
    drawRightText(page, value, totalsX + totalsBoxWidth - 5, totY, 10, f, textColor);
    totY -= 18;
  };

  drawSummaryRow("Subtotal:", formatCurrency(data.subtotal));
  if (data.taxRate > 0) drawSummaryRow(`Tax (${data.taxRate}%):`, formatCurrency(data.taxAmount));
  
  totY -= 5;
  page.drawText("TOTAL", { x: totalsX + 15, y: totY, size: 12, font: fontBold, color: primaryColor });
  drawRightText(page, formatCurrency(data.grandTotal), totalsX + totalsBoxWidth - 5, totY, 12, fontBold, primaryColor);

  await renderPaymentStatus(page, data, pdfDoc, margin, y - 5, textColor, mutedColor, primaryColor, fontBold, fontRegular);

  page.drawText("Thank you for your business!", { x: width / 2 - fontRegular.widthOfTextAtSize("Thank you for your business!", 10)/2, y: 30, size: 10, font: fontRegular, color: mutedColor });

  return pdfDoc.save();
}

async function generateGridStructured(data: InvoicePdfData, colors: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - 50;
  const { primaryColor, textColor, mutedColor } = colors;

  page.drawText(data.garageName.toUpperCase(), { x: margin, y, size: 18, font: fontBold, color: primaryColor });
  drawRightText(page, "TAX INVOICE", width - margin, y, 16, fontBold, primaryColor);
  
  y -= 18;
  const contactParts = [data.garageAddress, data.garagePhone, data.garageEmail].filter(Boolean);
  if (contactParts.length) { page.drawText(contactParts.join(" | "), { x: margin, y, size: 9, font: fontRegular, color: mutedColor }); }
  drawRightText(page, data.invoiceNumber, width - margin, y, 10, fontRegular, textColor);
  
  y -= 30;
  const boxWidth = (width - (margin * 2) - 10) / 2;
  page.drawRectangle({ x: margin, y: y - 50, width: boxWidth, height: 50, borderColor: primaryColor, borderWidth: 1 });
  page.drawRectangle({ x: margin + boxWidth + 10, y: y - 50, width: boxWidth, height: 50, borderColor: primaryColor, borderWidth: 1 });
  
  page.drawText(`BILL TO: ${data.customerName}`, { x: margin + 10, y: y - 18, size: 10, font: fontBold, color: textColor });
  page.drawText(`Phone: ${data.customerPhone}`, { x: margin + 10, y: y - 34, size: 9, font: fontRegular, color: textColor });
  
  const vX = margin + boxWidth + 20;
  page.drawText(`VEHICLE: ${data.vehicleBrand} ${data.vehicleModel}`, { x: vX, y: y - 18, size: 10, font: fontBold, color: textColor });
  if (data.vehicleReg) page.drawText(`Reg: ${data.vehicleReg}`, { x: vX, y: y - 34, size: 9, font: fontRegular, color: textColor });

  y -= 70;
  const drawTable = (title: string, items: any[], type: "labor" | "parts") => {
    if (items.length === 0) return;
    
    let startY = y;
    const rH = 20;
    
    // Dynamic columns for Parts vs Labor
    const dividers = type === "parts" 
      ? [width - margin - 200, width - margin - 160, width - margin - 80, width - margin] // Desc | Qty (40) | Rate (80) | Total (80)
      : [width - margin - 80, width - margin]; // Desc | Total
      
    const cTotal = type === "parts" ? dividers[2] : dividers[0];
    const cEnd = type === "parts" ? dividers[3] : dividers[1];

    page.drawRectangle({ x: margin, y: y - rH, width: width - (margin * 2), height: rH, color: rgb(0.9, 0.9, 0.9), borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 });
    page.drawText(type === "labor" ? "DESCRIPTION" : "PART NAME", { x: margin + 5, y: y - 14, size: 9, font: fontBold, color: textColor });
    
    if (type === "parts") {
      page.drawText("QTY", { x: dividers[0] + 5, y: y - 14, size: 9, font: fontBold, color: textColor });
      page.drawText("RATE", { x: dividers[1] + 5, y: y - 14, size: 9, font: fontBold, color: textColor });
      page.drawText("TOTAL", { x: dividers[2] + 5, y: y - 14, size: 9, font: fontBold, color: textColor });
    } else {
      page.drawText("TOTAL", { x: dividers[0] + 5, y: y - 14, size: 9, font: fontBold, color: textColor });
    }
    
    // Draw vertical header lines
    dividers.slice(0, -1).forEach(d => {
      page.drawLine({ start: { x: d, y: startY }, end: { x: d, y: startY - rH }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
    });
    
    y -= rH;

    page.drawRectangle({ x: margin, y: y - rH, width: width - (margin * 2), height: rH, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 });
    page.drawText(title, { x: margin + 5, y: y - 14, size: 8, font: fontBold, color: primaryColor });
    y -= rH;

    items.forEach((item) => {
      page.drawRectangle({ x: margin, y: y - rH, width: width - (margin * 2), height: rH, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 });
      const desc = type === "labor" ? item.description : item.partName;
      page.drawText(desc.substring(0, 50), { x: margin + 5, y: y - 14, size: 9, font: fontRegular, color: textColor });
      
      if (type === "parts") {
        drawRightText(page, `${item.quantity}`, dividers[1] - 5, y - 14, 9, fontRegular, textColor);
        drawRightText(page, formatCurrency(item.unitPrice), dividers[2] - 5, y - 14, 9, fontRegular, textColor);
      }
      drawRightText(page, formatCurrency(item.total), cEnd - 5, y - 14, 9, fontRegular, textColor);
      
      // Draw vertical item lines
      dividers.slice(0, -1).forEach(d => {
        page.drawLine({ start: { x: d, y: y }, end: { x: d, y: y - rH }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
      });
      y -= rH;
    });
    
    page.drawRectangle({ x: margin, y: y - rH, width: width - (margin * 2), height: rH, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 });
    page.drawText(`Total ${title}`, { x: margin + 5, y: y - 14, size: 9, font: fontBold, color: textColor });
    drawRightText(page, formatCurrency(type === "labor" ? data.laborTotal : data.partsTotal), cEnd - 5, y - 14, 9, fontBold, textColor);
    
    // Draw vertical total line
    page.drawLine({ start: { x: cTotal, y: y }, end: { x: cTotal, y: y - rH }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
    y -= (rH + 10);
  };

  drawTable("LABOR CHARGES", data.laborItems, "labor");
  drawTable("SPARE PARTS", data.partItems, "parts");

  const totalsBoxWidth = 240;
  const totalsX = width - margin - totalsBoxWidth;
  const rH = 20;
  
  let totY = y - rH;
  const drawGridRow = (label: string, value: string, bold = false, bg = false) => {
    page.drawRectangle({ x: totalsX, y: totY, width: totalsBoxWidth, height: rH, color: bg ? rgb(0.98, 0.9, 0.9) : undefined, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 });
    page.drawLine({ start: { x: totalsX + 120, y: totY }, end: { x: totalsX + 120, y: totY + rH }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
    const f = bold ? fontBold : fontRegular;
    const c = bg ? primaryColor : textColor;
    page.drawText(label, { x: totalsX + 5, y: totY + 6, size: 9, font: f, color: c });
    drawRightText(page, value, totalsX + totalsBoxWidth - 5, totY + 6, 9, f, c);
    totY -= rH;
  };

  drawGridRow("Subtotal", formatCurrency(data.subtotal));
  if (data.taxRate > 0) drawGridRow(`Tax (${data.taxRate}%)`, formatCurrency(data.taxAmount));
  drawGridRow("GRAND TOTAL", formatCurrency(data.grandTotal), true, true);

  await renderPaymentStatus(page, data, pdfDoc, margin, y - 10, textColor, mutedColor, primaryColor, fontBold, fontRegular);
  return pdfDoc.save();
}

async function generateModernAccent(data: InvoicePdfData, colors: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - 50;
  const { primaryColor, textColor, mutedColor } = colors;

  if (data.paymentStatus === "paid") {
    page.drawText("PAID", { x: width/2 - 100, y: height/2 + 50, size: 100, font: fontBold, color: rgb(0.9, 0.95, 0.9), rotate: degrees(30) });
  }

  page.drawText(data.garageName.toUpperCase(), { x: margin, y, size: 22, font: fontBold, color: primaryColor });
  drawRightText(page, "INVOICE", width - margin, y, 22, fontBold, primaryColor);
  y -= 20;

  const contactParts = [data.garageAddress, data.garagePhone, data.garageEmail].filter(Boolean);
  if (contactParts.length) { page.drawText(contactParts.join(" | "), { x: margin, y, size: 9, font: fontRegular, color: mutedColor }); }
  drawRightText(page, data.invoiceNumber, width - margin, y, 10, fontRegular, textColor);
  
  y -= 40;
  page.drawRectangle({ x: margin, y: y - 70, width: width/2 - 50, height: 70, borderColor: primaryColor, borderWidth: 2 });
  page.drawText(`BILL TO`, { x: margin + 10, y: y - 20, size: 9, font: fontBold, color: primaryColor });
  page.drawText(data.customerName, { x: margin + 10, y: y - 35, size: 11, font: fontBold, color: textColor });
  page.drawText(`Phone: ${data.customerPhone}`, { x: margin + 10, y: y - 50, size: 10, font: fontRegular, color: mutedColor });
  
  y -= 90;

  const drawTable = (title: string, items: any[], type: "labor" | "parts") => {
    if (items.length === 0) return;
    
    page.drawRectangle({ x: margin, y: y - 5, width: width - (margin * 2), height: 20, color: rgb(0.95, 0.95, 0.95) });
    const cDesc = margin + 10;
    const cQty = margin + 300;
    const cRate = margin + 380;
    const cAmt = width - margin - 10;
    
    page.drawText(type === "labor" ? "DESCRIPTION" : "PART NAME", { x: cDesc, y, size: 9, font: fontBold, color: textColor });
    if (type === "parts") {
      drawRightText(page, "QTY", cQty, y, 9, fontBold, textColor);
      drawRightText(page, "RATE", cRate, y, 9, fontBold, textColor);
    }
    drawRightText(page, "TOTAL", cAmt, y, 9, fontBold, textColor);
    y -= 20;

    items.forEach((item) => {
      page.drawRectangle({ x: margin, y: y - 5, width: width - (margin * 2), height: 20, color: rgb(0.98, 0.98, 0.98) });
      const desc = type === "labor" ? item.description : item.partName;
      page.drawText(desc.substring(0, 45), { x: cDesc, y, size: 9, font: fontRegular, color: textColor });
      if (type === "parts") {
        drawRightText(page, `${item.quantity}`, cQty, y, 9, fontRegular, textColor);
        drawRightText(page, formatCurrency(item.unitPrice), cRate, y, 9, fontRegular, textColor);
      }
      drawRightText(page, formatCurrency(item.total), cAmt, y, 9, fontRegular, textColor);
      y -= 20;
    });
    
    page.drawRectangle({ x: margin, y: y - 5, width: width - (margin * 2), height: 20, color: rgb(0.95, 0.95, 0.95) });
    page.drawText(`Total ${title}`, { x: cDesc, y, size: 9, font: fontBold, color: textColor });
    drawRightText(page, formatCurrency(type === "labor" ? data.laborTotal : data.partsTotal), cAmt, y, 9, fontBold, textColor);
    y -= 30;
  };

  drawTable("LABOR CHARGES", data.laborItems, "labor");
  drawTable("SPARE PARTS", data.partItems, "parts");

  const totalsBoxWidth = 220;
  const totalsX = width - margin - totalsBoxWidth;
  
  let totY = y;
  const drawSummaryRow = (label: string, value: string, bold = false) => {
    const f = bold ? fontBold : fontRegular;
    page.drawText(label, { x: totalsX + 15, y: totY, size: 10, font: f, color: textColor });
    drawRightText(page, value, totalsX + totalsBoxWidth - 15, totY, 10, f, textColor);
    totY -= 18;
  };

  drawSummaryRow("Subtotal:", formatCurrency(data.subtotal));
  if (data.taxRate > 0) drawSummaryRow(`Tax (${data.taxRate}%):`, formatCurrency(data.taxAmount));
  if (data.discountAmount > 0) drawSummaryRow("Discount:", `-${formatCurrency(data.discountAmount)}`);
  
  totY -= 10;
  page.drawRectangle({ x: totalsX, y: totY - 8, width: totalsBoxWidth, height: 28, color: rgb(1, 0.94, 0.94) });
  page.drawLine({ start: { x: totalsX, y: totY - 8 + 28 }, end: { x: totalsX + totalsBoxWidth, y: totY - 8 + 28 }, thickness: 1, color: primaryColor });
  
  page.drawText("TOTAL", { x: totalsX + 15, y: totY, size: 12, font: fontBold, color: primaryColor });
  drawRightText(page, formatCurrency(data.grandTotal), totalsX + totalsBoxWidth - 15, totY, 12, fontBold, primaryColor);

  await renderPaymentStatus(page, data, pdfDoc, margin, y - 10, textColor, mutedColor, primaryColor, fontBold, fontRegular);

  return pdfDoc.save();
}

async function generateCustomLayout(data: InvoicePdfData, colors: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { primaryColor, textColor, mutedColor } = colors;

  const elements = data.customLayoutConfig?.elements || [];
  
  for (const el of elements) {
    // PDF coordinates: Y is from bottom. HTML UI Y is from top.
    // PDF Y = 842 - HTML Y - HTML Height
    const pdfY = 842 - el.y - (el.h || 20);
    const font = el.bold ? fontBold : fontRegular;
    const size = el.fontSize || 12;

    if (el.type === 'text' && el.text) {
      page.drawText(el.text, { x: el.x, y: pdfY, size, font, color: textColor });
    } else if (el.type === 'box') {
      page.drawRectangle({ x: el.x, y: pdfY, width: el.w, height: el.h, borderColor: textColor, borderWidth: 1 });
    } else if (el.type === 'dynamic') {
      let val = "";
      if (el.dynamicField === 'garageName') val = data.garageName;
      if (el.dynamicField === 'garageAddress') val = data.garageAddress;
      if (el.dynamicField === 'invoiceNumber') val = `INV-${data.invoiceNumber}`;
      if (el.dynamicField === 'invoiceDate') val = data.invoiceDate;
      if (el.dynamicField === 'customerName') val = data.customerName;
      if (el.dynamicField === 'customerPhone') val = data.customerPhone;
      if (el.dynamicField === 'vehicleBrandModel') val = `${data.vehicleBrand} ${data.vehicleModel}`;
      if (el.dynamicField === 'vehicleReg') val = data.vehicleReg;
      page.drawText(val, { x: el.x, y: pdfY, size, font, color: textColor });
    } else if (el.type === 'table') {
      let ty = pdfY + (el.h || 100) - 20;
      page.drawText(el.dynamicField === 'table_labor' ? "LABOR CHARGES" : "SPARE PARTS", { x: el.x, y: ty, size: 10, font: fontBold, color: primaryColor });
      ty -= 15;
      const items = el.dynamicField === 'table_labor' ? data.laborItems : data.partItems;
      for (const item of items) {
        const desc = (item as any).description || (item as any).partName;
        page.drawText(desc.substring(0, 40), { x: el.x, y: ty, size: 9, font: fontRegular, color: textColor });
        drawRightText(page, formatCurrency(item.total), el.x + el.w - 10, ty, 9, fontRegular, textColor);
        ty -= 15;
      }
      page.drawLine({ start: { x: el.x, y: ty + 10 }, end: { x: el.x + el.w, y: ty + 10 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
      page.drawText("Total", { x: el.x, y: ty - 5, size: 9, font: fontBold, color: textColor });
      const total = el.dynamicField === 'table_labor' ? data.laborTotal : data.partsTotal;
      drawRightText(page, formatCurrency(total), el.x + el.w - 10, ty - 5, 9, fontBold, textColor);
    } else if (el.type === 'totals') {
      let ty = pdfY + (el.h || 100) - 15;
      page.drawText("Subtotal:", { x: el.x, y: ty, size: 9, font: fontRegular, color: textColor });
      drawRightText(page, formatCurrency(data.subtotal), el.x + el.w - 10, ty, 9, fontRegular, textColor);
      ty -= 15;
      if (data.taxRate > 0) {
        page.drawText(`Tax (${data.taxRate}%):`, { x: el.x, y: ty, size: 9, font: fontRegular, color: textColor });
        drawRightText(page, formatCurrency(data.taxAmount), el.x + el.w - 10, ty, 9, fontRegular, textColor);
        ty -= 15;
      }
      if (data.discountAmount > 0) {
        page.drawText("Discount:", { x: el.x, y: ty, size: 9, font: fontRegular, color: textColor });
        drawRightText(page, `-${formatCurrency(data.discountAmount)}`, el.x + el.w - 10, ty, 9, fontRegular, textColor);
        ty -= 15;
      }
      page.drawRectangle({ x: el.x, y: ty - 5, width: el.w, height: 20, color: rgb(0.95, 0.95, 0.95) });
      page.drawText("GRAND TOTAL:", { x: el.x + 5, y: ty, size: 10, font: fontBold, color: primaryColor });
      drawRightText(page, formatCurrency(data.grandTotal), el.x + el.w - 10, ty, 10, fontBold, primaryColor);
    } else if (el.type === 'qr') {
      if (data.upiQrDataUrl) {
        try {
          const qrImage = await pdfDoc.embedPng(data.upiQrDataUrl);
          page.drawImage(qrImage, { x: el.x, y: pdfY, width: el.w, height: el.h });
        } catch(e) {}
      }
    }
  }

  return pdfDoc.save();
}
