"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, MapPin, Phone, Building2, Calendar, User, Truck, FileSignature, Receipt, CopyCheck } from "lucide-react";
import { updateEstimateStatus, convertToInvoice } from "@/lib/actions/estimates";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EstimateData {
  id: number;
  estimateNumber: string;
  createdAt: Date;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  vehicleReg: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  laborTotal: number | null;
  partsTotal: number | null;
  subtotal: number | null;
  taxRate: number | null;
  taxAmount: number | null;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number | null;
  grandTotal: number | null;
  notes: string | null;
  laborItems: { description: string; hours: number | null; rate: number; total: number }[];
  partItems: { partName: string; quantity: number; unitPrice: number; total: number }[];
}

interface GarageSettings {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
}

export function EstimateDetailClient({
  estimate,
  garage,
}: {
  estimate: EstimateData;
  garage: GarageSettings | null;
}) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [converting, setConverting] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Estimate_${estimate.estimateNumber}`,
  });

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateEstimateStatus(estimate.id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleConvertToInvoice = async () => {
    if (!confirm("Are you sure you want to convert this estimate to an invoice?")) return;
    setConverting(true);
    try {
      const invoiceId = await convertToInvoice(estimate.id);
      toast.success("Successfully converted to Invoice!");
      router.push(`/invoices/${invoiceId}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to convert to invoice");
    } finally {
      setConverting(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "accepted") return "border-emerald-400/30 text-emerald-400 bg-emerald-400/10";
    if (s === "invoiced") return "border-blue-400/30 text-blue-400 bg-blue-400/10";
    if (s === "rejected") return "border-red-400/30 text-red-400 bg-red-400/10";
    return "border-amber-400/30 text-amber-400 bg-amber-400/10";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Action Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className={statusColor(estimate.status)}>
            {estimate.status.toUpperCase()}
          </Badge>
          <div className="text-sm text-muted-foreground">
            Created on {format(new Date(estimate.createdAt), "dd MMM yyyy, p")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {estimate.status !== "invoiced" && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline">Change Status</Button>} />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStatusChange("pending")}>Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("accepted")}>Accepted</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("rejected")}>Rejected</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                onClick={handleConvertToInvoice} 
                disabled={converting}
                className="gap-2"
              >
                <CopyCheck className="w-4 h-4" />
                {converting ? "Converting..." : "Convert to Invoice"}
              </Button>
            </>
          )}

          <Button variant="secondary" onClick={() => handlePrint()} className="gap-2 cursor-pointer">
            <Printer className="w-4 h-4" />
            Print Estimate
          </Button>
        </div>
      </div>

      {/* ── Printable Estimate ──────────────────────────────────────────────── */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px] bg-zinc-950 text-zinc-100 p-12 rounded-xl shadow-sm no-print-border" ref={printRef}>
          {/* Header Section */}
          <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-8 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
                {garage?.name || "Tractor Garage"}
              </h1>
              {garage?.address && (
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  {garage.address}
                </div>
              )}
              <div className="flex items-center gap-4 text-zinc-400 text-sm">
                {garage?.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    {garage.phone}
                  </div>
                )}
                {garage?.gstNumber && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-zinc-500" />
                    GST: {garage.gstNumber}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right space-y-2">
              <div className="inline-flex items-center justify-center px-4 py-1.5 bg-zinc-100 text-zinc-900 font-semibold tracking-widest text-sm rounded-md mb-2">
                ESTIMATE
              </div>
              <div className="text-sm">
                <span className="text-zinc-500">Estimate No:</span>
                <span className="ml-2 font-semibold text-zinc-100">{estimate.estimateNumber}</span>
              </div>
              <div className="text-sm">
                <span className="text-zinc-500">Date:</span>
                <span className="ml-2 font-medium text-zinc-100">
                  {format(new Date(estimate.createdAt), "dd MMM yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Vehicle Info */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="space-y-3">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bill To</div>
              <div className="bg-zinc-900 p-4 rounded-lg space-y-1 border border-zinc-800">
                <div className="font-semibold text-zinc-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-400" />
                  {estimate.customerName}
                </div>
                {estimate.customerPhone && <div className="text-sm text-zinc-400 pl-6">{estimate.customerPhone}</div>}
                {estimate.customerAddress && <div className="text-sm text-zinc-400 pl-6">{estimate.customerAddress}</div>}
              </div>
            </div>
            {estimate.vehicleReg && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vehicle Details</div>
                <div className="bg-zinc-900 p-4 rounded-lg space-y-1 border border-zinc-800">
                  <div className="font-semibold text-zinc-100 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-zinc-400" />
                    {estimate.vehicleReg}
                  </div>
                  {(estimate.vehicleBrand || estimate.vehicleModel) && (
                    <div className="text-sm text-zinc-400 pl-6">
                      {estimate.vehicleBrand} {estimate.vehicleModel}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Items Tables */}
          <div className="space-y-8 mb-10">
            {/* Parts Table */}
            {estimate.partItems.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-zinc-500" />
                  Spare Parts
                </h3>
                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-900/50">
                      <TableRow className="border-b-zinc-800 hover:bg-zinc-900/50">
                        <TableHead className="text-zinc-400 font-semibold h-10">Item Description</TableHead>
                        <TableHead className="text-right text-zinc-400 font-semibold h-10 w-24">Qty</TableHead>
                        <TableHead className="text-right text-zinc-400 font-semibold h-10 w-32">Rate</TableHead>
                        <TableHead className="text-right text-zinc-400 font-semibold h-10 w-32">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estimate.partItems.map((item, i) => (
                        <TableRow key={i} className="border-b-zinc-800/50 hover:bg-transparent">
                          <TableCell className="font-medium text-zinc-100">{item.partName}</TableCell>
                          <TableCell className="text-right text-zinc-300">{item.quantity}</TableCell>
                          <TableCell className="text-right text-zinc-300">₹{item.unitPrice.toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-right font-medium text-zinc-100">
                            ₹{item.total.toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Labor Table */}
            {estimate.laborItems.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-zinc-500" />
                  Labor Charges
                </h3>
                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-900/50">
                      <TableRow className="border-b-zinc-800 hover:bg-zinc-900/50">
                        <TableHead className="text-zinc-400 font-semibold h-10">Description</TableHead>
                        <TableHead className="text-right text-zinc-400 font-semibold h-10 w-32">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estimate.laborItems.map((item, i) => (
                        <TableRow key={i} className="border-b-zinc-800/50 hover:bg-transparent">
                          <TableCell className="font-medium text-zinc-100">{item.description}</TableCell>
                          <TableCell className="text-right font-medium text-zinc-100">
                            ₹{item.total.toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-4">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotal</span>
                <span className="font-medium text-zinc-100">₹{(estimate.subtotal || 0).toLocaleString("en-IN")}</span>
              </div>
              
              {(estimate.taxAmount || 0) > 0 && (
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Tax ({estimate.taxRate}%)</span>
                  <span className="font-medium text-zinc-100">₹{(estimate.taxAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              
              {(estimate.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-sm text-emerald-500">
                  <span>Discount</span>
                  <span className="font-medium">-₹{(estimate.discountAmount || 0).toLocaleString("en-IN")}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center border-t-2 border-zinc-800 pt-3 mt-3">
                <span className="font-bold text-zinc-100 uppercase">Grand Total</span>
                <span className="text-xl font-bold text-zinc-100">
                  ₹{(estimate.grandTotal || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-16 pt-8 border-t border-zinc-800 grid grid-cols-2 gap-8 text-sm">
            <div>
              {estimate.notes && (
                <>
                  <div className="font-bold text-zinc-100 mb-2">Terms & Notes:</div>
                  <div className="text-zinc-400 whitespace-pre-wrap">{estimate.notes}</div>
                </>
              )}
              <div className="text-zinc-500 mt-4 italic">
                * This is an estimate, not a final invoice. Prices may vary slightly upon actual repair.
              </div>
            </div>
            <div className="text-right flex flex-col justify-end">
              <div className="text-zinc-600 mb-8">(Authorized Signature)</div>
              <div className="font-bold text-zinc-100">{garage?.name}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
