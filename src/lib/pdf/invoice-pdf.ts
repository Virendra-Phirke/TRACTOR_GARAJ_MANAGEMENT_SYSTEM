import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

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
  theme?: string; // "default", "modern", "minimal", "bold"
  format?: string; // "standard", "modern", "compact"
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function generateInvoicePdf(
  data: InvoicePdfData
): Promise<Uint8Array> {
  const formatStr = data.format || "standard";
  
  if (formatStr === "compact") {
    return generateCompactFormat(data);
  } else if (formatStr === "modern") {
    return generateModernFormat(data);
  } else {
    return generateStandardFormat(data);
  }
}

// ─── Theme Colors Helper ──────────────────────────────────────────────
function getThemeColors(themeStr: string) {
  let primaryColor = rgb(0.1, 0.5, 0.3); // Deep Green (default)
  let secondaryColor = rgb(0.98, 0.98, 0.98);
  let textColor = rgb(0.2, 0.2, 0.2);
  let mutedColor = rgb(0.4, 0.4, 0.4);
  let lightGray = rgb(0.95, 0.95, 0.95);
  let borderColor = rgb(0.85, 0.85, 0.85);
  let headerTextColor = primaryColor;
  let tableHeaderBg = primaryColor;
  let tableHeaderTextColor = rgb(1,1,1);
  let showBorders = true;
  let borderWidth = 1;

  if (themeStr === "modern") {
    primaryColor = rgb(0.15, 0.38, 0.82); // Blue
    headerTextColor = rgb(0.1, 0.1, 0.1);
    tableHeaderBg = rgb(0.92, 0.95, 0.99);
    tableHeaderTextColor = rgb(0.1, 0.1, 0.2);
    borderColor = rgb(0.9, 0.9, 0.9);
  } else if (themeStr === "minimal") {
    primaryColor = rgb(0.1, 0.1, 0.1); // Black
    headerTextColor = rgb(0.1, 0.1, 0.1);
    tableHeaderBg = rgb(1, 1, 1);
    tableHeaderTextColor = rgb(0.1, 0.1, 0.1);
    secondaryColor = rgb(1, 1, 1);
    lightGray = rgb(1, 1, 1);
    showBorders = false;
  } else if (themeStr === "bold") {
    primaryColor = rgb(0.8, 0.2, 0.2); // Red
    headerTextColor = rgb(0.8, 0.2, 0.2);
    tableHeaderBg = rgb(0.1, 0.1, 0.1);
    tableHeaderTextColor = rgb(1, 1, 1);
    borderColor = rgb(0.1, 0.1, 0.1);
    secondaryColor = rgb(0.96, 0.96, 0.96);
    borderWidth = 2;
  } else if (themeStr === "sunset") {
    primaryColor = rgb(0.85, 0.45, 0.15); // Orange
    headerTextColor = rgb(0.8, 0.4, 0.1);
    tableHeaderBg = rgb(1, 0.95, 0.9);
    tableHeaderTextColor = rgb(0.3, 0.15, 0);
    borderColor = rgb(0.95, 0.8, 0.7);
  } else if (themeStr === "purple") {
    primaryColor = rgb(0.5, 0.25, 0.7); // Purple
    headerTextColor = rgb(0.4, 0.15, 0.6);
    tableHeaderBg = rgb(0.96, 0.92, 1);
    tableHeaderTextColor = rgb(0.2, 0.05, 0.3);
    borderColor = rgb(0.85, 0.75, 0.95);
  } else if (themeStr === "teal") {
    primaryColor = rgb(0.1, 0.6, 0.6); // Teal
    headerTextColor = rgb(0.05, 0.5, 0.5);
    tableHeaderBg = rgb(0.9, 0.98, 0.98);
    tableHeaderTextColor = rgb(0, 0.25, 0.25);
    borderColor = rgb(0.7, 0.9, 0.9);
  } else if (themeStr === "slate") {
    primaryColor = rgb(0.3, 0.35, 0.4); // Slate
    headerTextColor = rgb(0.2, 0.25, 0.3);
    tableHeaderBg = rgb(0.94, 0.95, 0.96);
    tableHeaderTextColor = rgb(0.1, 0.15, 0.2);
    borderColor = rgb(0.8, 0.85, 0.9);
  }

  return { primaryColor, secondaryColor, textColor, mutedColor, lightGray, borderColor, headerTextColor, tableHeaderBg, tableHeaderTextColor, showBorders, borderWidth };
}

// ─── Standard Format ──────────────────────────────────────────────────
async function generateStandardFormat(data: InvoicePdfData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;
  
  const colors = getThemeColors(data.theme || "default");

  const drawRightText = (text: string, xPos: number, yPos: number, size: number, font: PDFFont, color = colors.textColor) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: xPos - textWidth, y: yPos, size, font, color });
  };

  // Header (Left aligned garage, right aligned invoice)
  page.drawText(data.garageName.toUpperCase(), { x: margin, y: y - 10, size: 22, font: fontBold, color: colors.headerTextColor });
  y -= 25;
  if (data.ownerName) { page.drawText(`Proprietor: ${data.ownerName}`, { x: margin, y, size: 10, font: fontBold, color: colors.textColor }); y -= 14; }
  if (data.garageTagline) { page.drawText(data.garageTagline, { x: margin, y, size: 9, font: fontRegular, color: colors.mutedColor }); y -= 14; }
  if (data.garageAddress) { page.drawText(data.garageAddress, { x: margin, y, size: 9, font: fontRegular, color: colors.mutedColor }); y -= 14; }
  const contactParts = [data.garagePhone, data.garageEmail].filter(Boolean);
  if (contactParts.length) { page.drawText(contactParts.join(" | "), { x: margin, y, size: 9, font: fontRegular, color: colors.mutedColor }); y -= 14; }
  if (data.gstNumber) { page.drawText(`GSTIN: ${data.gstNumber}`, { x: margin, y, size: 9, font: fontBold, color: colors.textColor }); }

  let invY = height - margin - 10;
  drawRightText("TAX INVOICE", width - margin, invY, 20, fontBold, colors.primaryColor);
  invY -= 22;
  drawRightText(`Invoice No: ${data.invoiceNumber}`, width - margin, invY, 10, fontBold, colors.textColor);
  invY -= 14;
  drawRightText(`Created: ${data.invoiceDate}`, width - margin, invY, 10, fontRegular, colors.mutedColor);
  if (data.paymentDate && data.paymentStatus === "paid") {
    invY -= 14;
    drawRightText(`Paid On: ${data.paymentDate}`, width - margin, invY, 10, fontRegular, rgb(0.1, 0.6, 0.3));
  }

  y = Math.min(y - 20, invY - 20);
  if (colors.showBorders || data.theme === "minimal") {
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: colors.borderWidth, color: data.theme === "minimal" ? rgb(0,0,0) : colors.primaryColor });
  }
  y -= 20;

  // Bill To Box
  if (colors.showBorders) {
    page.drawRectangle({ x: margin, y: y - 85, width: width - (margin * 2), height: 100, color: colors.secondaryColor, borderColor: colors.borderColor, borderWidth: colors.borderWidth });
  }
  const col1X = margin + 15;
  const col2X = width / 2 + 15;
  let infoY = y - 5;
  page.drawText("BILL TO", { x: col1X, y: infoY, size: 9, font: fontBold, color: colors.primaryColor });
  page.drawText("VEHICLE DETAILS", { x: col2X, y: infoY, size: 9, font: fontBold, color: colors.primaryColor });
  infoY -= 18;
  page.drawText(data.customerName, { x: col1X, y: infoY, size: 11, font: fontBold, color: colors.textColor });
  page.drawText(`${data.vehicleBrand} ${data.vehicleModel}`.trim(), { x: col2X, y: infoY, size: 11, font: fontBold, color: colors.textColor });
  infoY -= 16;
  page.drawText(`Phone: ${data.customerPhone}`, { x: col1X, y: infoY, size: 10, font: fontRegular, color: colors.textColor });
  page.drawText(`Reg No: ${data.vehicleReg}`, { x: col2X, y: infoY, size: 10, font: fontRegular, color: colors.textColor });
  infoY -= 16;
  if (data.customerAddress) {
    page.drawText(data.customerAddress.substring(0, 50), { x: col1X, y: infoY, size: 10, font: fontRegular, color: colors.textColor });
  }
  y -= 105;

  y = drawItemsTable(page, data, y, margin, width, fontRegular, fontBold, colors, drawRightText);

  // Totals
  const totalsBoxWidth = 220;
  const totalsX = width - margin - totalsBoxWidth;
  if (colors.showBorders) {
    page.drawRectangle({ x: totalsX, y: y - 145, width: totalsBoxWidth, height: 155, color: colors.secondaryColor, borderColor: colors.borderColor, borderWidth: colors.borderWidth });
  }
  const lblX = totalsX + 15;
  const valX = totalsX + totalsBoxWidth - (colors.showBorders ? 15 : 0);
  let totY = y - 15;
  const drawSummaryRow = (label: string, value: string, bold = false) => {
    const f = bold ? fontBold : fontRegular;
    page.drawText(label, { x: lblX, y: totY, size: 10, font: f, color: colors.textColor });
    drawRightText(value, valX, totY, 10, f, colors.textColor);
    totY -= 18;
  };
  drawSummaryRow("Labor Total:", formatCurrency(data.laborTotal));
  drawSummaryRow("Parts Total:", formatCurrency(data.partsTotal));
  drawSummaryRow("Subtotal:", formatCurrency(data.subtotal));
  if (data.taxRate > 0) drawSummaryRow(`Tax (${data.taxRate}%):`, formatCurrency(data.taxAmount));
  if (data.discountAmount > 0) drawSummaryRow("Discount:", `-${formatCurrency(data.discountAmount)}`);
  
  page.drawLine({ start: { x: totalsX, y: totY + 10 }, end: { x: totalsX + totalsBoxWidth, y: totY + 10 }, thickness: colors.borderWidth, color: data.theme === "minimal" ? rgb(0,0,0) : colors.borderColor });
  totY -= 5;
  page.drawText("GRAND TOTAL", { x: lblX, y: totY, size: 12, font: fontBold, color: colors.primaryColor });
  drawRightText(formatCurrency(data.grandTotal), valX, totY, 12, fontBold, colors.primaryColor);

  await drawPaymentInfoAndFooter(pdfDoc, page, data, margin, width, y, fontRegular, fontBold, colors, drawRightText);
  return pdfDoc.save();
}

// ─── Modern Format (Centered) ─────────────────────────────────────────
async function generateModernFormat(data: InvoicePdfData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;
  
  const colors = getThemeColors(data.theme || "modern"); // defaults to modern

  const drawCenterText = (text: string, yPos: number, size: number, font: PDFFont, color = colors.textColor) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y: yPos, size, font, color });
  }
  const drawRightText = (text: string, xPos: number, yPos: number, size: number, font: PDFFont, color = colors.textColor) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: xPos - textWidth, y: yPos, size, font, color });
  };

  // Header (Centered)
  drawCenterText(data.garageName.toUpperCase(), y - 10, 24, fontBold, colors.primaryColor);
  y -= 25;
  if (data.ownerName) { drawCenterText(`Proprietor: ${data.ownerName}`, y, 10, fontBold, colors.textColor); y -= 14; }
  if (data.garageTagline) { drawCenterText(data.garageTagline, y, 9, fontRegular, colors.mutedColor); y -= 14; }
  if (data.garageAddress) { drawCenterText(data.garageAddress, y, 9, fontRegular, colors.mutedColor); y -= 14; }
  const contactParts = [data.garagePhone, data.garageEmail].filter(Boolean);
  if (contactParts.length) { drawCenterText(contactParts.join(" | "), y, 9, fontRegular, colors.mutedColor); y -= 14; }
  if (data.gstNumber) { drawCenterText(`GSTIN: ${data.gstNumber}`, y, 9, fontBold, colors.textColor); }

  y -= 30;
  page.drawText("TAX INVOICE", { x: margin, y, size: 16, font: fontBold, color: colors.primaryColor });
  drawRightText(`Invoice No: ${data.invoiceNumber}`, width - margin, y, 10, fontBold, colors.textColor);
  y -= 14;
  drawRightText(`Date: ${data.invoiceDate}`, width - margin, y, 10, fontRegular, colors.mutedColor);
  
  if (colors.showBorders || data.theme === "minimal") {
    y -= 10;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: colors.borderWidth, color: data.theme === "minimal" ? rgb(0,0,0) : colors.primaryColor });
  }
  y -= 20;

  // Bill to / Vehicle (Side by side plain text, no box for modern)
  const col1X = margin;
  const col2X = width / 2;
  page.drawText("BILL TO", { x: col1X, y, size: 9, font: fontBold, color: colors.primaryColor });
  page.drawText("VEHICLE DETAILS", { x: col2X, y, size: 9, font: fontBold, color: colors.primaryColor });
  y -= 18;
  page.drawText(data.customerName, { x: col1X, y, size: 11, font: fontBold, color: colors.textColor });
  page.drawText(`${data.vehicleBrand} ${data.vehicleModel}`.trim(), { x: col2X, y, size: 11, font: fontBold, color: colors.textColor });
  y -= 16;
  page.drawText(`Phone: ${data.customerPhone}`, { x: col1X, y, size: 10, font: fontRegular, color: colors.textColor });
  page.drawText(`Reg No: ${data.vehicleReg}`, { x: col2X, y, size: 10, font: fontRegular, color: colors.textColor });
  y -= 16;
  if (data.customerAddress) {
    page.drawText(data.customerAddress.substring(0, 50), { x: col1X, y, size: 10, font: fontRegular, color: colors.textColor });
  }
  y -= 25;

  y = drawItemsTable(page, data, y, margin, width, fontRegular, fontBold, colors, drawRightText);

  // Modern Totals (Full width row)
  y -= 10;
  if (colors.showBorders || data.theme === "minimal") {
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: colors.borderColor });
    y -= 15;
  }
  
  const rightAlign = width - margin;
  let totY = y;
  
  const drawTot = (lbl: string, val: string, isBold: boolean, offY: number) => {
    drawRightText(val, rightAlign, totY - offY, 10, isBold ? fontBold : fontRegular, colors.textColor);
    drawRightText(lbl, rightAlign - 80, totY - offY, 10, isBold ? fontBold : fontRegular, colors.textColor);
  }
  
  drawTot("Subtotal:", formatCurrency(data.subtotal), false, 0);
  let off = 18;
  if (data.taxRate > 0) { drawTot(`Tax (${data.taxRate}%):`, formatCurrency(data.taxAmount), false, off); off += 18; }
  if (data.discountAmount > 0) { drawTot("Discount:", `-${formatCurrency(data.discountAmount)}`, false, off); off += 18; }
  
  if (colors.showBorders) {
    page.drawRectangle({ x: rightAlign - 160, y: totY - off - 15, width: 160, height: 25, color: colors.tableHeaderBg });
  }
  drawRightText(formatCurrency(data.grandTotal), rightAlign - 5, totY - off - 8, 12, fontBold, colors.tableHeaderTextColor);
  drawRightText("TOTAL:", rightAlign - 85, totY - off - 8, 12, fontBold, colors.tableHeaderTextColor);
  
  await drawPaymentInfoAndFooter(pdfDoc, page, data, margin, width, totY, fontRegular, fontBold, colors, drawRightText);
  return pdfDoc.save();
}

// ─── Compact Format (Receipt Style) ───────────────────────────────────
async function generateCompactFormat(data: InvoicePdfData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([400, 700]); // Smaller page size
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const margin = 20;
  let y = height - margin;
  
  const colors = getThemeColors(data.theme || "minimal"); // defaults to minimal

  const drawCenterText = (text: string, yPos: number, size: number, font: PDFFont, color = colors.textColor) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y: yPos, size, font, color });
  }
  const drawRightText = (text: string, xPos: number, yPos: number, size: number, font: PDFFont, color = colors.textColor) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: xPos - textWidth, y: yPos, size, font, color });
  };

  drawCenterText(data.garageName.toUpperCase(), y, 16, fontBold, colors.primaryColor);
  y -= 15;
  if (data.garageAddress) { drawCenterText(data.garageAddress, y, 8, fontRegular, colors.mutedColor); y -= 12; }
  if (data.garagePhone) { drawCenterText(data.garagePhone, y, 8, fontRegular, colors.mutedColor); y -= 12; }
  if (data.gstNumber) { drawCenterText(`GSTIN: ${data.gstNumber}`, y, 8, fontBold, colors.textColor); y -= 15; }
  
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: colors.borderColor, dashArray: [3, 3] });
  y -= 15;
  
  page.drawText(`Invoice: ${data.invoiceNumber}`, { x: margin, y, size: 9, font: fontBold, color: colors.textColor });
  drawRightText(data.invoiceDate, width - margin, y, 9, fontRegular, colors.textColor);
  y -= 12;
  page.drawText(`Customer: ${data.customerName}`, { x: margin, y, size: 9, font: fontRegular, color: colors.textColor });
  drawRightText(`Vehicle: ${data.vehicleReg}`, width - margin, y, 9, fontRegular, colors.textColor);
  y -= 15;

  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: colors.borderColor, dashArray: [3, 3] });
  y -= 15;

  const drawItems = (title: string, items: any[], type: "labor" | "parts") => {
    if (items.length === 0) return;
    page.drawText(title, { x: margin, y, size: 9, font: fontBold, color: colors.primaryColor });
    y -= 15;
    items.forEach((item) => {
      const desc = type === "labor" ? item.description : item.partName;
      page.drawText(desc.substring(0, 35), { x: margin, y, size: 9, font: fontRegular, color: colors.textColor });
      if (type === "parts") {
        drawRightText(`${item.quantity} x ${item.unitPrice}`, width - margin - 60, y, 8, fontRegular, colors.mutedColor);
      }
      drawRightText(formatCurrency(item.total), width - margin, y, 9, fontRegular, colors.textColor);
      y -= 12;
    });
    y -= 5;
  };

  drawItems("LABOR", data.laborItems, "labor");
  drawItems("PARTS", data.partItems, "parts");

  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: colors.borderColor, dashArray: [3, 3] });
  y -= 15;

  drawRightText(`Subtotal: ${formatCurrency(data.subtotal)}`, width - margin, y, 9, fontRegular, colors.textColor); y -= 12;
  if (data.taxRate > 0) { drawRightText(`Tax: ${formatCurrency(data.taxAmount)}`, width - margin, y, 9, fontRegular, colors.textColor); y -= 12; }
  if (data.discountAmount > 0) { drawRightText(`Discount: -${formatCurrency(data.discountAmount)}`, width - margin, y, 9, fontRegular, colors.textColor); y -= 12; }
  
  y -= 5;
  page.drawText("TOTAL", { x: margin, y, size: 12, font: fontBold, color: colors.primaryColor });
  drawRightText(formatCurrency(data.grandTotal), width - margin, y, 12, fontBold, colors.primaryColor);
  y -= 25;

  await drawPaymentInfoAndFooter(pdfDoc, page, data, margin, width, y, fontRegular, fontBold, colors, drawRightText);
  return pdfDoc.save();
}

// ─── Shared Components ────────────────────────────────────────────────
function drawItemsTable(page: PDFPage, data: InvoicePdfData, startY: number, margin: number, width: number, fontRegular: PDFFont, fontBold: PDFFont, colors: any, drawRightText: any) {
  let y = startY;
  const drawTable = (title: string, items: any[], type: "labor" | "parts") => {
    if (items.length === 0) return;
    page.drawText(title, { x: margin, y, size: 11, font: fontBold, color: colors.primaryColor });
    y -= 25;
    page.drawRectangle({ x: margin, y: y - 6, width: width - (margin * 2), height: 22, color: colors.tableHeaderBg });
    if (colors.theme === "minimal") {
       page.drawLine({ start: { x: margin, y: y - 6 }, end: { x: width - margin, y: y - 6 }, thickness: 1, color: rgb(0,0,0) });
       page.drawLine({ start: { x: margin, y: y + 16 }, end: { x: width - margin, y: y + 16 }, thickness: 1, color: rgb(0,0,0) });
    }
    const cIdx = margin + 10;
    const cDesc = margin + 40;
    const cQty = margin + 300;
    const cRate = margin + 380;
    const cAmt = width - margin - 10;
    const thY = y;
    page.drawText("#", { x: cIdx, y: thY, size: 9, font: fontBold, color: colors.tableHeaderTextColor });
    page.drawText(type === "labor" ? "Description" : "Part Name", { x: cDesc, y: thY, size: 9, font: fontBold, color: colors.tableHeaderTextColor });
    if (type === "parts") {
      drawRightText("Qty", cQty, thY, 9, fontBold, colors.tableHeaderTextColor);
      drawRightText("Rate", cRate, thY, 9, fontBold, colors.tableHeaderTextColor);
    }
    drawRightText("Total", cAmt, thY, 9, fontBold, colors.tableHeaderTextColor);
    y -= 20;

    items.forEach((item, index) => {
      if (index % 2 === 0 && colors.theme !== "minimal") {
        page.drawRectangle({ x: margin, y: y - 6, width: width - (margin * 2), height: 22, color: colors.lightGray });
      }
      page.drawText(`${index + 1}`, { x: cIdx, y, size: 9, font: fontRegular, color: colors.textColor });
      const desc = type === "labor" ? item.description : item.partName;
      page.drawText(desc.substring(0, 50), { x: cDesc, y, size: 9, font: fontRegular, color: colors.textColor });
      if (type === "parts") {
        drawRightText(`${item.quantity}`, cQty, y, 9, fontRegular, colors.textColor);
        drawRightText(formatCurrency(item.unitPrice), cRate, y, 9, fontRegular, colors.textColor);
      }
      drawRightText(formatCurrency(item.total), cAmt, y, 9, fontBold, colors.textColor);
      y -= 20;
    });
    if (colors.showBorders || colors.theme === "minimal") {
      page.drawLine({ start: { x: margin, y: y + 10 }, end: { x: width - margin, y: y + 10 }, thickness: 1, color: colors.theme === "minimal" ? rgb(0,0,0) : colors.borderColor });
    }
    y -= 15;
  };

  drawTable("LABOR CHARGES", data.laborItems, "labor");
  drawTable("SPARE PARTS", data.partItems, "parts");
  return y;
}

async function drawPaymentInfoAndFooter(pdfDoc: PDFDocument, page: PDFPage, data: InvoicePdfData, margin: number, width: number, startY: number, fontRegular: PDFFont, fontBold: PDFFont, colors: any, drawRightText: any) {
  let leftY = startY;
  if (data.paymentStatus === "paid") {
    page.drawText("PAID IN FULL", { x: margin, y: leftY - 15, size: 16, font: fontBold, color: rgb(0.2, 0.7, 0.3) });
    leftY -= 35;
    if ((data.cashAmount && data.cashAmount > 0) || (data.upiAmount && data.upiAmount > 0)) {
      if (data.cashAmount && data.cashAmount > 0) { page.drawText(`Via Cash: ${formatCurrency(data.cashAmount)}`, { x: margin, y: leftY, size: 10, font: fontRegular, color: colors.textColor }); leftY -= 14; }
      if (data.upiAmount && data.upiAmount > 0) { page.drawText(`Via UPI: ${formatCurrency(data.upiAmount)}`, { x: margin, y: leftY, size: 10, font: fontRegular, color: colors.textColor }); leftY -= 14; }
    }
  } else if (data.paymentStatus === "partial" && data.amountPaid > 0) {
    const balanceDue = data.grandTotal - data.amountPaid;
    page.drawText("PARTIALLY PAID", { x: margin, y: leftY - 15, size: 14, font: fontBold, color: rgb(0.9, 0.55, 0.1) });
    leftY -= 35;
    page.drawText(`Paid: ${formatCurrency(data.amountPaid)}`, { x: margin, y: leftY, size: 10, font: fontRegular, color: rgb(0.15, 0.55, 0.3) });
    leftY -= 15;
    page.drawText(`Balance Due: ${formatCurrency(balanceDue)}`, { x: margin, y: leftY, size: 10, font: fontBold, color: rgb(0.7, 0.15, 0.15) });
    leftY -= 20;
  } else if (data.paymentStatus === "unpaid") {
    page.drawText("UNPAID", { x: margin, y: leftY - 15, size: 16, font: fontBold, color: rgb(0.8, 0.2, 0.2) });
    leftY -= 30;
  }

  // QR Code
  if (data.upiQrDataUrl && data.upiVpa && data.paymentStatus !== "paid") {
    const qrSize = 60;
    try {
      const base64Data = data.upiQrDataUrl.split(",")[1];
      if (base64Data) {
        const qrImageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const qrImage = await pdfDoc.embedPng(qrImageBytes);
        page.drawImage(qrImage, { x: margin, y: leftY - qrSize, width: qrSize, height: qrSize });
        page.drawText("Scan to Pay", { x: margin + qrSize + 10, y: leftY - 15, size: 9, font: fontBold, color: colors.textColor });
        page.drawText(`UPI ID: ${data.upiVpa}`, { x: margin + qrSize + 10, y: leftY - 28, size: 8, font: fontRegular, color: colors.mutedColor });
      }
    } catch {}
  }

  // Footer
  page.drawText("Authorized Signature", { x: width - margin - 110, y: 50, size: 10, font: fontRegular, color: colors.textColor });
  page.drawLine({ start: { x: width - margin - 130, y: 65 }, end: { x: width - margin, y: 65 }, thickness: 1, color: colors.textColor });
  page.drawText("Thank you for your business!", { x: margin, y: 30, size: 10, font: fontBold, color: colors.primaryColor });
}
