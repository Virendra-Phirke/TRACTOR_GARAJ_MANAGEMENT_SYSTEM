"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, QrCode, CheckCircle, X } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateInvoicePayment } from "@/lib/actions/invoices";
import { generateUpiQrDataUrl } from "@/lib/qr/upi-qr";
import { toast } from "sonner";
import { format } from "date-fns";

interface InvoiceDetail {
  id: number;
  invoiceNumber: string;
  laborTotal: number | null;
  partsTotal: number | null;
  subtotal: number | null;
  taxRate: number | null;
  taxAmount: number | null;
  discountAmount: number | null;
  grandTotal: number | null;
  amountPaid: number | null;
  paymentStatus: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: Date;
  paymentDoneAt?: Date | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  vehicleReg: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  laborItems: { id: number; description: string; hours: number | null; rate: number; total: number }[];
  partItems: { id: number; partName: string; quantity: number; unitPrice: number; total: number }[];
}

interface GarageSettings {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
  tagline: string | null;
}

interface UpiSettings {
  vpa: string;
  payeeName: string;
  merchantCode: string | null;
  isEnabled: boolean | null;
}

export function InvoiceDetailClient({
  invoice,
  upi,
}: {
  invoice: InvoiceDetail;
  garage: GarageSettings;
  upi: UpiSettings;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState(invoice.paymentStatus);
  const [payMethod, setPayMethod] = useState(invoice.paymentMethod || "cash");
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);

  // Draft state for the payment dialog — isolated from the real status
  const [draftStatus, setDraftStatus] = useState(invoice.paymentStatus);
  const [draftPayMethod, setDraftPayMethod] = useState(invoice.paymentMethod || "cash");
  const [draftCash, setDraftCash] = useState("");
  const [draftUpi, setDraftUpi] = useState("");

  // PDF viewer state
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Calculate the remaining balance for partial payments
  const balanceAmount = status === "partial" && (invoice.amountPaid || 0) > 0
    ? (invoice.grandTotal || 0) - (invoice.amountPaid || 0)
    : (invoice.grandTotal || 0);

  useEffect(() => {
    const qrAmount = status === "partial" && (invoice.amountPaid || 0) > 0
      ? (invoice.grandTotal || 0) - (invoice.amountPaid || 0)
      : (invoice.grandTotal || 0);
    if (upi.isEnabled && upi.vpa && qrAmount > 0) {
      generateUpiQrDataUrl({
        vpa: upi.vpa,
        payeeName: upi.payeeName,
        amount: qrAmount,
        transactionNote: invoice.invoiceNumber,
        merchantCode: upi.merchantCode || undefined,
      }).then(setQrDataUrl);
    }
  }, [upi, invoice, status]);

  // Open the dialog and seed draft state from the real state
  const openPayDialog = () => {
    setDraftStatus(status);
    setDraftPayMethod(payMethod);
    setDraftCash("");
    setDraftUpi("");
    setIsPayDialogOpen(true);
  };

  const handleSavePayment = async () => {
    let finalAmount = 0;
    let cAmt = 0;
    let uAmt = 0;

    if (draftStatus === "paid") {
      finalAmount = invoice.grandTotal || 0;
    } else if (draftStatus === "partial") {
      if (draftPayMethod === "split") {
        cAmt = Number(draftCash) || 0;
        uAmt = Number(draftUpi) || 0;
        finalAmount = cAmt + uAmt;
      } else {
        finalAmount = Number(draftCash) || 0;
        if (draftPayMethod === "cash") cAmt = finalAmount;
        if (draftPayMethod === "upi") uAmt = finalAmount;
      }
    } else {
      finalAmount = 0;
    }

    if (draftStatus === "paid" && draftPayMethod === "split") {
      cAmt = Number(draftCash) || 0;
      uAmt = Number(draftUpi) || 0;
      finalAmount = cAmt + uAmt;
    } else if (draftStatus === "paid") {
      if (draftPayMethod === "cash") cAmt = finalAmount;
      if (draftPayMethod === "upi") uAmt = finalAmount;
    }

    await updateInvoicePayment(invoice.id, {
      paymentStatus: draftStatus,
      paymentMethod: draftPayMethod,
      amountPaid: finalAmount,
      cashAmount: cAmt,
      upiAmount: uAmt,
    });

    // Only NOW commit the draft to real state
    setStatus(draftStatus);
    setPayMethod(draftPayMethod);
    setIsPayDialogOpen(false);
    toast.success(`Payment recorded as ${draftStatus}`);
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  const handlePrintPdf = async () => {
    setIsPdfLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfViewerUrl(url);
      setIsPdfViewerOpen(true);
    } catch {
      toast.error("Failed to load PDF");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const closePdfViewer = () => {
    setIsPdfViewerOpen(false);
    if (pdfViewerUrl) {
      URL.revokeObjectURL(pdfViewerUrl);
      setPdfViewerUrl(null);
    }
  };

  const statusColor = (s: string) => {
    if (s === "paid") return "border-emerald-400/30 text-emerald-400 bg-emerald-400/10";
    if (s === "partial") return "border-blue-400/30 text-blue-400 bg-blue-400/10";
    return "border-amber-400/30 text-amber-400 bg-amber-400/10";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 block-stagger">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">{invoice.invoiceNumber}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(invoice.createdAt), "dd MMM yyyy, hh:mm a")}
            </p>
            {invoice.paymentDoneAt && invoice.paymentStatus === "paid" && (
              <p className="text-xs text-emerald-500/80 font-medium mt-0.5">
                Paid: {format(new Date(invoice.paymentDoneAt), "dd MMM yyyy, hh:mm a")}
              </p>
            )}
          </div>
          <Badge className={`text-xs px-2.5 py-0.5 ${statusColor(status)}`}>
            {status === "paid" && <CheckCircle className="w-3 h-3 mr-1" />}
            {status.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5 cursor-pointer text-xs" onClick={openPayDialog} />}>
              Record Payment
            </DialogTrigger>
            <DialogContent className="sm:max-w-[30vw] w-full">
              <DialogHeader>
                <DialogTitle>Update Payment Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v || "unpaid")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {draftStatus !== "unpaid" && (
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={draftPayMethod} onValueChange={(v) => setDraftPayMethod(v || "cash")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="split">Split (Cash + UPI)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {draftStatus !== "unpaid" && draftPayMethod === "split" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cash Amount (₹)</Label>
                      <Input type="number" placeholder="0" value={draftCash} onChange={(e) => setDraftCash(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>UPI Amount (₹)</Label>
                      <Input type="number" placeholder="0" value={draftUpi} onChange={(e) => setDraftUpi(e.target.value)} />
                    </div>
                  </div>
                )}

                {draftStatus === "partial" && draftPayMethod !== "split" && (
                  <div className="space-y-2">
                    <Label>Amount Paid (₹)</Label>
                    <Input type="number" placeholder="0" value={draftCash} onChange={(e) => setDraftCash(e.target.value)} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button onClick={handleSavePayment}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="sm" className="gap-1.5 cursor-pointer text-xs text-muted-foreground" onClick={handleDownloadPdf}>
            <Download className="w-3.5 h-3.5" />PDF
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 cursor-pointer text-xs text-muted-foreground" onClick={handlePrintPdf} disabled={isPdfLoading}>
            <Printer className="w-3.5 h-3.5" />{isPdfLoading ? "Loading..." : "Print"}
          </Button>
        </div>
      </div>

      {/* ── Customer & Vehicle ──────────────────────────────────────── */}
      <div className="block-section">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="block-label">Customer</div>
            <p className="text-sm font-semibold">{invoice.customerName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{invoice.customerPhone}</p>
            {invoice.customerAddress && <p className="text-xs text-muted-foreground mt-0.5">{invoice.customerAddress}</p>}
          </div>
          <div>
            <div className="block-label">Vehicle</div>
            <p className="text-sm font-mono font-semibold">{invoice.vehicleReg || "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{invoice.vehicleBrand} {invoice.vehicleModel || ""}</p>
          </div>
        </div>
      </div>

      {/* ── Line Items ──────────────────────────────────────────────── */}
      <div className="block-section">
        <div className="block-label">Line Items</div>

        {/* Labor */}
        {invoice.laborItems.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Labor Charges
              <span className="text-foreground/40 ml-1">({invoice.laborItems.length})</span>
            </p>
            <div className="space-y-0.5">
              {invoice.laborItems.map((item) => (
                <div key={item.id} className="item-row flex justify-between">
                  <span className="text-sm">{item.description}</span>
                  <span className="text-sm font-medium tabular-nums">₹{item.total.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parts */}
        {invoice.partItems.length > 0 && (
          <div>
            {invoice.laborItems.length > 0 && <div className="block-divider" />}
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Spare Parts
              <span className="text-foreground/40 ml-1">({invoice.partItems.length})</span>
            </p>
            <div className="space-y-0.5">
              {invoice.partItems.map((item) => (
                <div key={item.id} className="item-row flex justify-between">
                  <span className="text-sm">
                    {item.partName}
                    <span className="text-muted-foreground ml-1 text-xs">({item.quantity} × ₹{item.unitPrice})</span>
                  </span>
                  <span className="text-sm font-medium tabular-nums">₹{item.total.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Notes ───────────────────────────────────────────────────── */}
      {invoice.notes && (
        <div className="block-section">
          <div className="block-label">Notes</div>
          <p className="text-sm text-muted-foreground">{invoice.notes}</p>
        </div>
      )}

      {/* ── Bill Summary + QR ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Summary */}
        <div className={`block-section-elevated ${qrDataUrl && status !== "paid" ? "lg:col-span-3" : "lg:col-span-5"}`}>
          <div className="block-label">Bill Summary</div>

          <div className="space-y-0.5">
            <div className="summary-row">
              <span className="summary-row-label">Labor</span>
              <span>₹{(invoice.laborTotal || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row-label">Parts</span>
              <span>₹{(invoice.partsTotal || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row-label">Subtotal</span>
              <span className="font-medium">₹{(invoice.subtotal || 0).toLocaleString("en-IN")}</span>
            </div>
            {(invoice.taxRate || 0) > 0 && (
              <div className="summary-row">
                <span className="summary-row-label">Tax ({invoice.taxRate}%)</span>
                <span>₹{(invoice.taxAmount || 0).toLocaleString("en-IN")}</span>
              </div>
            )}
            {(invoice.discountAmount || 0) > 0 && (
              <div className="summary-row">
                <span className="text-emerald-400">Discount</span>
                <span className="text-emerald-400">-₹{(invoice.discountAmount || 0).toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>

          <div className="block-divider" />

          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">Grand Total</span>
            <span className="summary-total hero-total">
              ₹{(invoice.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {status !== "paid" && (invoice.amountPaid || 0) > 0 && (
            <>
              <div className="block-divider" />
              <div className="summary-row">
                <span className="summary-row-label">Paid</span>
                <span>₹{(invoice.amountPaid || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row">
                <span className="text-amber-400 font-medium">Balance Due</span>
                <span className="text-amber-400 font-semibold">
                  ₹{((invoice.grandTotal || 0) - (invoice.amountPaid || 0)).toLocaleString("en-IN")}
                </span>
              </div>
            </>
          )}
        </div>

        {/* QR Code */}
        {qrDataUrl && status !== "paid" && (
          <div className="block-section lg:col-span-2 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan to Pay</span>
            </div>
            <div className="p-3 bg-white rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="UPI QR Code" className="w-40 h-40" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">
                ₹{balanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              {status === "partial" && (invoice.amountPaid || 0) > 0 && (
                <p className="text-[10px] text-amber-400 font-medium">Balance Due</p>
              )}
              <p className="text-[10px] text-muted-foreground">{upi.vpa}</p>
            </div>
          </div>
        )}
      </div>
      {/* ── PDF Viewer Overlay ──────────────────────────────────────── */}
      {isPdfViewerOpen && pdfViewerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "oklch(0 0 0 / 80%)" }}>
          <div className="relative w-[53vw] h-[98vh] flex flex-col rounded-xl overflow-hidden" style={{ background: "oklch(0.17 0.01 260)" }}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
              <span className="text-sm font-medium text-muted-foreground">{invoice.invoiceNumber}.pdf</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="gap-1.5 cursor-pointer text-xs" onClick={handleDownloadPdf}>
                  <Download className="w-3.5 h-3.5" />Download
                </Button>
                <button
                  onClick={closePdfViewer}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* PDF iframe */}
            <iframe
              src={pdfViewerUrl}
              className="flex-1 w-full"
              title="Invoice PDF"
              style={{ border: "none", background: "white" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
