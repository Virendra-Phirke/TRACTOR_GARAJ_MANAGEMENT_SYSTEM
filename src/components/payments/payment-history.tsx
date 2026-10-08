"use client";

/**
 * payment-history.tsx
 *
 * Displays the list of payment records for an invoice,
 * plus the server-computed payment summary (paid/due/status).
 */

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PaymentRecord {
  id: number;
  amount: number;
  amountInr: number;
  paymentMethod: string;
  status: string;
  gatewayMethod: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paidAt: string | null;
  failureReason: string | null;
  notes: string | null;
  source: string | null;
  createdAt: string;
}

interface PaymentSummary {
  paidAmountInr: number;
  dueAmountInr: number;
  grandTotal: number;
  paymentStatus: string;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    refunded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function MethodLabel({ method, gatewayMethod }: { method: string; gatewayMethod: string | null }) {
  if (method === "online" && gatewayMethod) {
    return (
      <span className="flex items-center gap-1 text-sm">
        <span className="font-medium text-violet-600 dark:text-violet-400">Online</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground capitalize">{gatewayMethod}</span>
      </span>
    );
  }
  if (method === "online") {
    return <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Online</span>;
  }
  return <span className="text-sm font-medium">Cash</span>;
}

export function PaymentHistory({ invoiceId }: { invoiceId: number }) {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/payments`);
      if (!res.ok) throw new Error("Failed to load payments");
      const data = await res.json() as { payments: PaymentRecord[]; summary: PaymentSummary };
      setRecords(data.payments);
      setSummary(data.summary);
    } catch {
      setError("Could not load payment history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground animate-pulse">
        Loading payment history…
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      {summary && (
        <div className="rounded-xl border bg-card p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Grand Total</p>
            <p className="text-lg font-bold">
              ₹{summary.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Paid</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              ₹{summary.paidAmountInr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Balance Due</p>
            <p className={`text-lg font-bold ${summary.dueAmountInr > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              ₹{summary.dueAmountInr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Payment Records */}
      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No payments recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <div
              key={record.id}
              className="rounded-lg border bg-card/50 px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <MethodLabel method={record.paymentMethod} gatewayMethod={record.gatewayMethod} />
                  <StatusBadge status={record.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {record.paidAt
                    ? format(new Date(record.paidAt), "dd MMM yyyy, hh:mm a")
                    : format(new Date(record.createdAt), "dd MMM yyyy, hh:mm a")}
                </p>
                {record.razorpayPaymentId && (
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {record.razorpayPaymentId}
                  </p>
                )}
                {record.failureReason && (
                  <p className="text-xs text-red-500">{record.failureReason}</p>
                )}
                {record.notes && (
                  <p className="text-xs text-muted-foreground">{record.notes}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-base font-semibold">
                  ₹{record.amountInr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Export the refresh function signature for parent components
export type PaymentHistoryRef = { refresh: () => void };
