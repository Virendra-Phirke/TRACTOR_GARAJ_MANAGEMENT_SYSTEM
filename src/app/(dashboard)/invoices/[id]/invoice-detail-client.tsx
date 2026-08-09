"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, QrCode, CheckCircle, X, MessageCircle } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateInvoicePayment, deleteInvoice } from "@/lib/actions/invoices";
import { generateUpiQrDataUrl } from "@/lib/qr/upi-qr";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

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
  cashAmount: number | null;
  upiAmount: number | null;
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
  garage,
  upi,
}: {
  invoice: InvoiceDetail;
  garage: GarageSettings;
  upi: UpiSettings;
}) {
  const router = useRouter();
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
  const { playSound } = useTheme();

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
    
    if (payMethod === "split") {
      setDraftCash(invoice.cashAmount ? invoice.cashAmount.toString() : "");
      setDraftUpi(invoice.upiAmount ? invoice.upiAmount.toString() : "");
    } else {
      setDraftCash(invoice.amountPaid ? invoice.amountPaid.toString() : "");
      setDraftUpi("");
    }
    
    setIsPayDialogOpen(true);
  };

  const handleSavePayment = async () => {
    let finalAmount = 0;
    let cAmt = 0;
    let uAmt = 0;
    let pMethod = draftPayMethod;

    if (draftStatus === "paid") {
      finalAmount = invoice.grandTotal || 0;
      if (draftPayMethod === "split") {
        cAmt = Number(draftCash) || 0;
        uAmt = Number(draftUpi) || 0;
        finalAmount = cAmt + uAmt;
        if (Math.abs(finalAmount - (invoice.grandTotal || 0)) > 0.01) {
          toast.error("Split amounts must equal the grand total for Paid status.");
          playSound("error");
          return;
        }
      } else {
        // Smart additive logic: pay remaining balance using the chosen method, preserving previous payments
        const existingCash = invoice.cashAmount || 0;
        const existingUpi = invoice.upiAmount || 0;
        const remaining = Math.max(0, finalAmount - (invoice.amountPaid || 0));
        
        if (draftPayMethod === "cash") {
          cAmt = existingCash + remaining;
          uAmt = existingUpi;
        } else if (draftPayMethod === "upi") {
          uAmt = existingUpi + remaining;
          cAmt = existingCash;
        }
        if (cAmt > 0 && uAmt > 0) pMethod = "split";
      }
    } else if (draftStatus === "partial") {
      if (draftPayMethod === "split") {
        cAmt = Number(draftCash) || 0;
        uAmt = Number(draftUpi) || 0;
        finalAmount = cAmt + uAmt;
        pMethod = "split";
      } else {
        const typedAmount = Number(draftCash) || 0;
        if (draftPayMethod === "cash") {
          cAmt = typedAmount;
          if ((invoice.upiAmount || 0) > 0) {
            uAmt = invoice.upiAmount || 0;
            pMethod = "split";
          }
        } else if (draftPayMethod === "upi") {
          uAmt = typedAmount;
          if ((invoice.cashAmount || 0) > 0) {
            cAmt = invoice.cashAmount || 0;
            pMethod = "split";
          }
        }
        finalAmount = cAmt + uAmt;
      }
    } else {
      finalAmount = 0;
      pMethod = "cash";
    }

    let actualStatus = draftStatus;
    if (actualStatus === "partial" && finalAmount >= (invoice.grandTotal || 0)) {
      actualStatus = "paid";
    }

    await updateInvoicePayment(invoice.id, {
      paymentStatus: actualStatus,
      paymentMethod: pMethod,
      amountPaid: finalAmount,
      cashAmount: cAmt,
      upiAmount: uAmt,
    });

    setStatus(actualStatus);
    setPayMethod(draftPayMethod);
    setIsPayDialogOpen(false);
    toast.success(`Payment recorded as ${actualStatus}`);
    playSound("success");
    router.refresh();
  };

  const handleDeleteInvoice = () => {
    const timeoutId = setTimeout(async () => {
      try {
        await deleteInvoice(invoice.id);
      } catch {
        toast.error("Failed to delete invoice");
        playSound("error");
      }
    }, 5000);

    toast.success("Invoice deleted successfully", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(timeoutId);
          toast.success("Invoice restored");
          router.push(`/invoices/${invoice.id}`);
        }
      }
    });
    playSound("delete");
    router.push("/invoices");
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
    if (s === "paid") return "border-primary/30 text-primary bg-primary/10";
    if (s === "partial") return "border-primary/50 text-primary/80 bg-primary/10";
    return "border-muted-foreground/30 text-muted-foreground bg-muted-foreground/10";
  };

  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false);

  const handleWhatsAppShare = async () => {
    try {
      // Build a clean phone number for WhatsApp
      let phone = invoice.customerPhone ? invoice.customerPhone.replace(/[\s\-\(\)\.]/g, '') : '';
      // Strip leading + if present
      if (phone.startsWith('+')) phone = phone.substring(1);
      // If it starts with 0 (local format), remove it and prepend 91
      if (phone.startsWith('0')) phone = '91' + phone.substring(1);
      // If it's a 10-digit Indian number, prepend 91
      if (/^\d{10}$/.test(phone)) phone = '91' + phone;
      // If phone is still empty or invalid, let the user know
      if (!phone || phone.length < 10) {
        toast.error("Customer phone number is missing or invalid. Cannot open WhatsApp.");
        return;
      }

      // Open window synchronously to avoid popup blockers
      const newWindow = window.open('about:blank', '_blank');
      if (newWindow) {
        newWindow.document.write('Loading WhatsApp share...');
      }

      setIsWhatsAppLoading(true);

      const balanceDue = (invoice.grandTotal || 0) - (invoice.amountPaid || 0);

      // Fetch the share token from the server (with credentials so cookies are sent)
      let shareLink = "";
      try {
        const tokenRes = await fetch("/api/share-token/" + invoice.id, {
          credentials: "include",
        });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          if (tokenData.token) {
            let baseUrl = window.location.origin;
            // Mask the Vercel URL with the provided da.gd masked URL
            if (baseUrl.includes("garaje-bill-management.vercel.app")) {
              baseUrl = "https://shrikrupatractors.com-akola@da.gd/RTEuF";
            }
            shareLink = baseUrl + "/api/share/" + invoice.id + "/pdf?token=" + tokenData.token;
          }
        } else {
          console.warn("Share token fetch failed:", tokenRes.status);
        }
      } catch (err) {
        console.warn("Share token fetch error:", err);
      }

      // Build the message text
      // Build a clean, human-like WhatsApp message
      const lines = [
        "Hello " + (invoice.customerName || "Customer") + ",",
        "",
        "Thank you for choosing " + garage.name + "!",
        "Here is a summary of your recent service:",
        "",
        "Invoice No: " + invoice.invoiceNumber,
        "Date: " + format(new Date(invoice.createdAt), "dd MMM yyyy"),
        "",
        "Vehicle Details:",
        (invoice.vehicleBrand || "") + " " + (invoice.vehicleModel || "") + (invoice.vehicleReg ? " (" + invoice.vehicleReg + ")" : ""),
        "",
      ];

      // Add labor and parts breakdown if available
      if (invoice.laborItems.length > 0 || invoice.partItems.length > 0) {
        lines.push("Service Details:");
        
        invoice.laborItems.forEach(item => {
           lines.push("- " + item.description);
        });
        
        invoice.partItems.forEach(item => {
           lines.push("- " + item.partName + " (Qty: " + item.quantity + ")");
        });
        
        lines.push("");
      }

      lines.push("------------------------");
      lines.push("Grand Total: Rs " + (invoice.grandTotal || 0).toLocaleString("en-IN"));

      if ((invoice.amountPaid || 0) > 0) {
         lines.push("Amount Paid: Rs " + invoice.amountPaid?.toLocaleString("en-IN"));
      }

      if (balanceDue > 0) {
         lines.push("Balance Due: Rs " + balanceDue.toLocaleString("en-IN"));
      }
      lines.push("------------------------");
      lines.push("");
      
      const cleanPaidLabel = status === "paid" ? "PAID" : status === "partial" ? "PARTIAL" : "UNPAID";
      lines.push("Payment Status: " + cleanPaidLabel);

      if (shareLink) {
        lines.push("");
        lines.push("Click the link below to view and download your full invoice:");
        lines.push(shareLink);
      }

      lines.push("");
      lines.push("For any queries, please feel free to reach out to us.");

      const messageText = lines.join("\n");
      const encodedText = encodeURIComponent(messageText);

      // Construct the WhatsApp URL using string concatenation (avoid any encoding issues)
      const whatsappUrl = "https://wa.me/" + phone + "?text=" + encodedText;

      // Navigate the previously opened window to WhatsApp
      if (newWindow) {
        newWindow.location.href = whatsappUrl;
      } else {
        // Fallback if popup blocker completely blocked the initial window.open
        window.location.href = whatsappUrl;
      }
    } catch (err) {
      console.error("WhatsApp share error:", err);
      toast.error("Failed to open WhatsApp. Please try again.");
    } finally {
      setIsWhatsAppLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 block-stagger">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">{invoice.invoiceNumber}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(invoice.createdAt), "dd MMM yyyy, hh:mm a")}
            </p>
            {invoice.paymentDoneAt && invoice.paymentStatus === "paid" && (
              <p className="text-xs text-primary/80 font-medium mt-0.5">
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
          <Link href={`/invoices/${invoice.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer text-xs">
              Edit Invoice
            </Button>
          </Link>
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
          <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer text-xs border-primary/30 text-primary hover:bg-primary/10" onClick={handleWhatsAppShare} disabled={isWhatsAppLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>{isWhatsAppLoading ? "Opening..." : "WhatsApp"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="gap-1.5 cursor-pointer text-xs text-destructive hover:text-destructive hover:bg-destructive/10" />}><Trash2 className="w-3.5 h-3.5" /> Delete Invoice</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete Invoice #{invoice.invoiceNumber}? This action cannot be undone. Inventory stock and customer stats will be adjusted accordingly.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
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
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* ── Bill Summary ───────────────────────────────────────── */}
          <div className="block-section-elevated">
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
                <span className="text-primary">Discount</span>
                <span className="text-primary">-₹{(invoice.discountAmount || 0).toLocaleString("en-IN")}</span>
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

          {(invoice.amountPaid || 0) > 0 && (
            <>
              <div className="block-divider" />
              <div className="summary-row">
                <span className="summary-row-label">Total Paid</span>
                <span className={status === "paid" ? "text-primary font-medium" : ""}>₹{(invoice.amountPaid || 0).toLocaleString("en-IN")}</span>
              </div>
              
              {((invoice.cashAmount || 0) > 0 || (invoice.upiAmount || 0) > 0) && (
                <div className="flex flex-col gap-1.5 mt-2 mb-2 pl-3 border-l-2 border-border/40 text-xs text-muted-foreground">
                   {(invoice.cashAmount || 0) > 0 && (
                     <div className="flex justify-between">
                       <span>Via Cash</span>
                       <span>₹{invoice.cashAmount!.toLocaleString("en-IN")}</span>
                     </div>
                   )}
                   {(invoice.upiAmount || 0) > 0 && (
                     <div className="flex justify-between">
                       <span>Via UPI</span>
                       <span>₹{invoice.upiAmount!.toLocaleString("en-IN")}</span>
                     </div>
                   )}
                </div>
              )}

              {status !== "paid" && (
                <div className="summary-row mt-2">
                  <span className="text-muted-foreground font-medium">Balance Due</span>
                  <span className="text-muted-foreground font-semibold">
                    ₹{((invoice.grandTotal || 0) - (invoice.amountPaid || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* QR Code */}
        {qrDataUrl && status !== "paid" && (
          <div className="block-section flex flex-col items-center justify-center gap-4">
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
                <p className="text-[10px] text-muted-foreground font-medium">Balance Due</p>
              )}
              <p className="text-[10px] text-muted-foreground">{upi.vpa}</p>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ── PDF Viewer Overlay ──────────────────────────────────────── */}
      {isPdfViewerOpen && pdfViewerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative w-[53vw] h-[98vh] flex flex-col rounded-xl overflow-hidden bg-card border border-border">
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
