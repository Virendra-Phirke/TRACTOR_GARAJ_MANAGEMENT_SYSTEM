import QRCode from "qrcode";

export interface UpiPaymentData {
  vpa: string;
  payeeName: string;
  amount?: number;
  transactionNote?: string;
  merchantCode?: string;
  currency?: string;
}

export async function generateUpiQrDataUrl(
  data: UpiPaymentData
): Promise<string> {
  const params = new URLSearchParams();
  params.set("pa", data.vpa);
  params.set("pn", data.payeeName);
  if (data.amount !== undefined) {
    params.set("am", data.amount.toFixed(2));
  }
  params.set("cu", data.currency || "INR");
  if (data.transactionNote) {
    params.set("tn", data.transactionNote);
  }
  if (data.merchantCode) {
    params.set("mc", data.merchantCode);
  }

  const upiUrl = `upi://pay?${params.toString()}`;

  const qrDataUrl = await QRCode.toDataURL(upiUrl, {
    width: 280,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });

  return qrDataUrl;
}

export function buildUpiIntentUrl(data: UpiPaymentData): string {
  const params = new URLSearchParams();
  params.set("pa", data.vpa);
  params.set("pn", data.payeeName);
  if (data.amount !== undefined) {
    params.set("am", data.amount.toFixed(2));
  }
  params.set("cu", data.currency || "INR");
  if (data.transactionNote) {
    params.set("tn", data.transactionNote);
  }
  return `upi://pay?${params.toString()}`;
}
