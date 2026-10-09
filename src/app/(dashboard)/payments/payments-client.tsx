"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Download,
  RefreshCw,
  Copy,
  ExternalLink,
  Receipt,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PaymentHistoryItem,
  PaymentHistorySummary,
  syncPaymentLinkStatus,
} from "@/lib/actions/payments";

interface PaymentsClientProps {
  initialData: {
    payments: PaymentHistoryItem[];
    summary: PaymentHistorySummary;
  };
}

function formatINR(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val);
}

export function PaymentsClient({ initialData }: PaymentsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const payments = initialData.payments;
  const summary = initialData.summary;

  // Filtered dataset
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesQuery =
          item.invoiceNumber.toLowerCase().includes(query) ||
          (item.customerName && item.customerName.toLowerCase().includes(query)) ||
          (item.customerPhone && item.customerPhone.toLowerCase().includes(query)) ||
          (item.razorpayPaymentId && item.razorpayPaymentId.toLowerCase().includes(query)) ||
          (item.razorpayPaymentLinkId && item.razorpayPaymentLinkId.toLowerCase().includes(query)) ||
          (item.notes && item.notes.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      // Method filter
      if (methodFilter !== "all" && item.paymentMethod !== methodFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter !== "all" && item.source !== sourceFilter) {
        return false;
      }

      return true;
    });
  }, [payments, search, methodFilter, statusFilter, sourceFilter]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSyncStatus = async (paymentId: number) => {
    setSyncingId(paymentId);
    try {
      const res = await syncPaymentLinkStatus(paymentId);
      if (res.updated) {
        toast.success(res.message);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.info(res.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sync failed";
      toast.error(message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = [
      "Payment ID",
      "Invoice #",
      "Customer",
      "Phone",
      "Amount (INR)",
      "Method",
      "Channel",
      "Status",
      "Source",
      "Razorpay Payment ID",
      "Payment Link ID",
      "Paid At",
      "Created At",
    ];

    const rows = filteredPayments.map((p) => [
      p.id,
      p.invoiceNumber,
      `"${(p.customerName || "").replace(/"/g, '""')}"`,
      p.customerPhone || "",
      p.amountInr.toFixed(2),
      p.paymentMethod,
      p.gatewayMethod || "",
      p.status,
      p.source || "",
      p.razorpayPaymentId || "",
      p.razorpayPaymentLinkId || "",
      p.paidAt ? format(new Date(p.paidAt), "yyyy-MM-dd HH:mm:ss") : "",
      format(new Date(p.createdAt), "yyyy-MM-dd HH:mm:ss"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `gbms-payment-history-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Payment ledger exported as CSV");
  };

  return (
    <div className="space-y-6">
      {/* ── Metric Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/70 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Collected
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(summary.totalCollectedInr)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {summary.successCount}
              </span>{" "}
              successful transactions
            </p>
          </CardContent>
        </Card>

        {/* Razorpay Online */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/70 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Razorpay Online
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(summary.totalOnlineInr)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              UPI, Cards &amp; Payment Links
            </p>
          </CardContent>
        </Card>

        {/* Cash Collected */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/70 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cash Ledger
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(summary.totalCashInr)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Physical cash receipts
            </p>
          </CardContent>
        </Card>

        {/* Pending & Active Links */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/70 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending / Active
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(summary.pendingAmountInr)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-sky-600 dark:text-sky-400">
                {summary.pendingCount}
              </span>{" "}
              pending links &amp; attempts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Toolbar: Search, Filters & CSV Export ─────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card/60 p-3 rounded-xl border border-border/60 backdrop-blur-sm">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search invoice, customer, payment ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Payment Method */}
          <Select value={methodFilter} onValueChange={(val) => val && setMethodFilter(val)}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="online">Online (Razorpay)</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          {/* Source */}
          <Select value={sourceFilter} onValueChange={(val) => val && setSourceFilter(val)}>
            <SelectTrigger className="h-9 w-[140px] text-xs hidden lg:flex">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="razorpay_payment_link">Payment Link</SelectItem>
              <SelectItem value="razorpay_checkout">Checkout Modal</SelectItem>
              <SelectItem value="cash_manual">Cash Manual</SelectItem>
              <SelectItem value="manual_upi">Manual UPI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              startTransition(() => {
                router.refresh();
              });
              toast.info("Refreshed payment ledger");
            }}
            disabled={isPending}
            className="h-9 w-9 p-0 cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw
              className={`w-4 h-4 text-muted-foreground ${
                isPending ? "animate-spin" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* ── Table Card ─────────────────────────────────────────────────── */}
      <Card className="border-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[170px] text-xs font-semibold uppercase">
                  Date &amp; Time
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Invoice
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Customer
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Amount
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Method &amp; Channel
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Gateway Ref / Link
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-10 h-10 stroke-1 text-muted-foreground/60" />
                      <p className="text-sm font-medium">No payments found</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {search || methodFilter !== "all" || statusFilter !== "all"
                          ? "Try clearing your filters or search term to see other transactions."
                          : "No payments recorded yet. Record a cash payment or generate a Razorpay payment link from an invoice."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((item) => {
                  const dateObj = new Date(item.paidAt || item.createdAt);
                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Date & Time */}
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {format(dateObj, "dd MMM yyyy")}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {format(dateObj, "hh:mm a")}
                        </div>
                      </TableCell>

                      {/* Invoice */}
                      <TableCell className="whitespace-nowrap">
                        <Link
                          href={`/invoices/${item.invoiceId}`}
                          className="font-mono text-xs font-semibold text-primary hover:underline flex items-center gap-1 group"
                        >
                          {item.invoiceNumber}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="whitespace-nowrap">
                        <div className="text-xs font-medium text-foreground">
                          {item.customerName}
                        </div>
                        {item.customerPhone && item.customerPhone !== "—" && (
                          <div className="text-[11px] text-muted-foreground">
                            {item.customerPhone}
                          </div>
                        )}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="whitespace-nowrap">
                        <span className="text-sm font-bold text-foreground">
                          {formatINR(item.amountInr)}
                        </span>
                      </TableCell>

                      {/* Method & Channel */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.paymentMethod === "online" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 gap-1"
                            >
                              <CreditCard className="w-2.5 h-2.5" />
                              Online
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 gap-1"
                            >
                              <Banknote className="w-2.5 h-2.5" />
                              Cash
                            </Badge>
                          )}

                          {item.gatewayMethod && (
                            <span className="text-[11px] font-mono uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {item.gatewayMethod}
                            </span>
                          )}

                          {item.source === "razorpay_payment_link" && (
                            <span className="text-[10px] font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 px-1 rounded flex items-center gap-0.5">
                              <LinkIcon className="w-2.5 h-2.5" />
                              Link
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="whitespace-nowrap">
                        {item.status === "success" && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Success
                          </Badge>
                        )}
                        {item.status === "pending" && (
                          <Badge
                            variant="secondary"
                            className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300/50 text-[11px] font-medium gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </Badge>
                        )}
                        {item.status === "failed" && (
                          <Badge
                            variant="destructive"
                            className="text-[11px] font-medium gap-1"
                          >
                            <AlertCircle className="w-3 h-3" />
                            Failed
                          </Badge>
                        )}
                        {item.status === "refunded" && (
                          <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 text-[11px] font-medium gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Refunded
                          </Badge>
                        )}
                      </TableCell>

                      {/* Reference IDs & Link */}
                      <TableCell className="max-w-[200px]">
                        <div className="flex flex-col gap-0.5">
                          {item.razorpayPaymentId && (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
                                {item.razorpayPaymentId}
                              </span>
                              <button
                                onClick={() =>
                                  handleCopy(
                                    item.razorpayPaymentId!,
                                    "Payment ID"
                                  )
                                }
                                className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                                title="Copy Payment ID"
                              >
                                {copiedId === item.razorpayPaymentId ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}

                          {item.paymentLinkUrl && (
                            <div className="flex items-center gap-1">
                              <a
                                href={item.paymentLinkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline truncate max-w-[120px]"
                              >
                                {item.paymentLinkUrl.replace(/^https?:\/\//, "")}
                              </a>
                              <button
                                onClick={() =>
                                  handleCopy(
                                    item.paymentLinkUrl!,
                                    "Payment Link"
                                  )
                                }
                                className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                                title="Copy Payment Link"
                              >
                                {copiedId === item.paymentLinkUrl ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}

                          {!item.razorpayPaymentId && !item.paymentLinkUrl && (
                            <span className="text-[11px] text-muted-foreground italic">
                              {item.source === "cash_manual"
                                ? "Cash Receipt"
                                : "—"}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sync Button if pending and has link */}
                          {item.status === "pending" &&
                            item.razorpayPaymentLinkId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSyncStatus(item.id)}
                                disabled={syncingId === item.id}
                                className="h-7 px-2 text-xs gap-1 border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
                                title="Check payment status with Razorpay"
                              >
                                <RefreshCw
                                  className={`w-3 h-3 ${
                                    syncingId === item.id ? "animate-spin" : ""
                                  }`}
                                />
                                Check
                              </Button>
                            )}

                          <Link
                            href={`/invoices/${item.invoiceId}`}
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium h-7 px-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            Invoice
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
