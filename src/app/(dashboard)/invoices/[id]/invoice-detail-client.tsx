"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, QrCode, CheckCircle } from "lucide-react";
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
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);

  useEffect(() => {
    if (upi.isEnabled && upi.vpa && invoice.grandTotal) {
      generateUpiQrDataUrl({
        vpa: upi.vpa,
        payeeName: upi.payeeName,
        amount: invoice.grandTotal,
        transactionNote: invoice.invoiceNumber,
        merchantCode: upi.merchantCode || undefined,
      }).then(setQrDataUrl);
    }
  }, [upi, invoice]);

  const handleSavePayment = async () => {
    let finalAmount = 0;
    let cAmt = 0;
    let uAmt = 0;
    
    if (status === "paid") {
      finalAmount = invoice.grandTotal || 0;
    } else if (status === "partial") {
      if (payMethod === "split") {
        cAmt = Number(cashAmount) || 0;
        uAmt = Number(upiAmount) || 0;
        finalAmount = cAmt + uAmt;
      } else {
        finalAmount = Number(cashAmount) || 0;
        if (payMethod === "cash") cAmt = finalAmount;
        if (payMethod === "upi") uAmt = finalAmount;
      }
    } else {
      finalAmount = 0;
      setPayMethod("cash");
    }

    if (status === "paid" && payMethod === "split") {
      cAmt = Number(cashAmount) || 0;
      uAmt = Number(upiAmount) || 0;
      finalAmount = cAmt + uAmt;
      // ensure it equals grandTotal if they selected paid, or just trust their inputs?
      // we'll use their inputs but they should sum to grandTotal ideally
    } else if (status === "paid") {
      if (payMethod === "cash") cAmt = finalAmount;
      if (payMethod === "upi") uAmt = finalAmount;
    }

    await updateInvoicePayment(invoice.id, {
      paymentStatus: status,
      paymentMethod: payMethod,
      amountPaid: finalAmount,
      cashAmount: cAmt,
      upiAmount: uAmt,
    });
    
    setIsPayDialogOpen(false);
    toast.success(`Payment recorded as ${status}`);
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

  const statusColor = (s: string) => {
    if (s === "paid") return "border-emerald-400/30 text-emerald-400 bg-emerald-400/10";
    if (s === "partial") return "border-blue-400/30 text-blue-400 bg-blue-400/10";
    return "border-amber-400/30 text-amber-400 bg-amber-400/10";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono">{invoice.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Created: {format(new Date(invoice.createdAt), "dd MMM yyyy, hh:mm a")}
          </p>
          {invoice.paymentDoneAt && invoice.paymentStatus === "paid" && (
            <p className="text-sm text-emerald-500/80 font-medium mt-0.5">
              Paid At: {format(new Date(invoice.paymentDoneAt), "dd MMM yyyy, hh:mm a")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-sm px-3 py-1 ${statusColor(status)}`}>
            {status === "paid" && <CheckCircle className="w-3 h-3 mr-1" />}
            {status.toUpperCase()}
          </Badge>
          <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
            <DialogTrigger render={<Button variant="outline" className="gap-2 cursor-pointer" />}>
              Record Payment
            </DialogTrigger>
            <DialogContent className="sm:max-w-[30vw] w-full">
              <DialogHeader>
                <DialogTitle>Update Payment Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v || "unpaid")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {status !== "unpaid" && (
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={payMethod} onValueChange={(v) => setPayMethod(v || "cash")}>
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

                {status !== "unpaid" && payMethod === "split" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cash Amount (₹)</Label>
                      <Input type="number" placeholder="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>UPI Amount (₹)</Label>
                      <Input type="number" placeholder="0" value={upiAmount} onChange={(e) => setUpiAmount(e.target.value)} />
                    </div>
                  </div>
                )}
                
                {status === "partial" && payMethod !== "split" && (
                  <div className="space-y-2">
                    <Label>Amount Paid (₹)</Label>
                    <Input type="number" placeholder="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button onClick={handleSavePayment}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2 cursor-pointer" onClick={handleDownloadPdf}>
            <Download className="w-4 h-4" />PDF
          </Button>
          <Button variant="outline" className="gap-2 cursor-pointer" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer & Vehicle */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">Customer</p>
                <p className="font-semibold">{invoice.customerName}</p>
                <p className="text-sm text-muted-foreground">{invoice.customerPhone}</p>
                {invoice.customerAddress && <p className="text-xs text-muted-foreground mt-1">{invoice.customerAddress}</p>}
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">Vehicle</p>
                <p className="font-mono font-semibold">{invoice.vehicleReg || "—"}</p>
                <p className="text-sm text-muted-foreground">{invoice.vehicleBrand} {invoice.vehicleModel || ""}</p>
              </CardContent>
            </Card>
          </div>

          {/* Labor Items */}
          {invoice.laborItems.length > 0 && (
            <Card className="bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Labor Charges</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoice.laborItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span>{item.description}</span>
                      <span className="font-medium">₹{item.total.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Part Items */}
          {invoice.partItems.length > 0 && (
            <Card className="bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Spare Parts</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoice.partItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span>{item.partName} <span className="text-muted-foreground">({item.quantity} × ₹{item.unitPrice})</span></span>
                      <span className="font-medium">₹{item.total.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {invoice.notes && (
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">Notes</p>
                <p className="text-sm">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Totals + QR */}
        <div className="space-y-4">
          <Card className="bg-card/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Bill Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Labor</span><span>₹{(invoice.laborTotal || 0).toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Parts</span><span>₹{(invoice.partsTotal || 0).toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>₹{(invoice.subtotal || 0).toLocaleString("en-IN")}</span></div>
              {(invoice.taxRate || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span><span>₹{(invoice.taxAmount || 0).toLocaleString("en-IN")}</span></div>}
              {(invoice.discountAmount || 0) > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>Discount</span><span>-₹{(invoice.discountAmount || 0).toLocaleString("en-IN")}</span></div>}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">₹{(invoice.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              {status !== "paid" && (invoice.amountPaid || 0) > 0 && (
                <>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Paid</span><span>₹{(invoice.amountPaid || 0).toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between text-sm font-semibold text-amber-400"><span>Balance</span><span>₹{((invoice.grandTotal || 0) - (invoice.amountPaid || 0)).toLocaleString("en-IN")}</span></div>
                </>
              )}
            </CardContent>
          </Card>

          {/* UPI QR */}
          {qrDataUrl && status !== "paid" && (
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <QrCode className="w-4 h-4" />Scan to Pay
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="UPI QR Code" className="w-48 h-48" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">
                    ₹{(invoice.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">{upi.vpa}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
