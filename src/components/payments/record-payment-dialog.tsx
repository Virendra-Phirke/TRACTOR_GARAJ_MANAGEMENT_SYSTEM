"use client";

/**
 * record-payment-dialog.tsx
 *
 * Replaces the old manual payment status dialog.
 *
 * Supports:
 * - Cash payments (POST /api/payments/cash)
 * - Online payments via Razorpay Checkout (POST /api/payments/razorpay/create-order → verify)
 *
 * Security:
 * - Amount is validated server-side.
 * - Frontend NEVER marks the invoice paid directly.
 * - Online payment status comes from server verify endpoint.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { openRazorpayCheckout } from "./razorpay-checkout";
import { Banknote, CreditCard, Loader2 } from "lucide-react";

interface PaymentSummary {
  paymentStatus: string;
  paidAmountInr: number;
  dueAmountInr: number;
}

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  invoiceNumber: string;
  dueAmountInr: number;
  customerName?: string | null;
  customerPhone?: string | null;
  /** Called after any successful payment so the parent can refresh state */
  onPaymentSuccess: (summary: PaymentSummary) => void;
}

type PaymentMethod = "cash" | "online";

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  dueAmountInr,
  customerName,
  customerPhone,
  onPaymentSuccess,
}: RecordPaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState<string>(dueAmountInr.toFixed(2));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const amountNum = parseFloat(amount);
  const isValidAmount =
    !isNaN(amountNum) && amountNum > 0 && amountNum <= dueAmountInr + 0.01;

  const handleCashPayment = async () => {
    if (!isValidAmount) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payments/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          amount: amountNum,
          notes: notes.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        invoice?: PaymentSummary;
        error?: string;
      };

      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Cash payment failed.");
      } else {
        toast.success("Cash payment recorded!");
        onPaymentSuccess(data.invoice!);
        onOpenChange(false);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!isValidAmount) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setLoading(true);
    try {
      // 1. Create Razorpay order on the server
      const orderRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, amount: amountNum }),
      });

      const orderData = (await orderRes.json()) as {
        localPaymentId?: number;
        razorpayOrderId?: string;
        amountPaise?: number;
        currency?: string;
        publicKeyId?: string;
        error?: string;
      };

      if (!orderRes.ok || !orderData.razorpayOrderId) {
        toast.error(orderData.error ?? "Could not create payment order.");
        setLoading(false);
        return;
      }

      // 2. Open Razorpay Checkout
      await openRazorpayCheckout({
        publicKeyId: orderData.publicKeyId!,
        razorpayOrderId: orderData.razorpayOrderId,
        localPaymentId: orderData.localPaymentId!,
        amountPaise: orderData.amountPaise!,
        currency: orderData.currency ?? "INR",
        prefill: {
          name: customerName ?? "",
          contact: customerPhone ?? "",
        },
        description: `Invoice #${invoiceNumber}`,
        onSuccess: (summary) => {
          onPaymentSuccess(summary);
          onOpenChange(false);
        },
        onFailure: (reason) => {
          // Dialog stays open so user can retry
          console.error("[checkout] Payment failed:", reason);
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (method === "cash") {
      handleCashPayment();
    } else {
      handleOnlinePayment();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Invoice #{invoiceNumber} · Balance due:{" "}
            <span className="font-semibold text-foreground">
              ₹{dueAmountInr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="payment-amount">Amount (₹)</Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={dueAmountInr}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Method selector */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod("cash")}
                disabled={loading}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition-colors ${
                  method === "cash"
                    ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                    : "border-border hover:border-violet-300"
                }`}
              >
                <Banknote className="h-4 w-4" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => setMethod("online")}
                disabled={loading}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition-colors ${
                  method === "online"
                    ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                    : "border-border hover:border-violet-300"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Online
              </button>
            </div>
          </div>

          {/* Notes (optional) */}
          {method === "cash" && (
            <div className="space-y-1">
              <Label htmlFor="payment-notes">Notes (optional)</Label>
              <Input
                id="payment-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid in full"
                disabled={loading}
                maxLength={500}
              />
            </div>
          )}

          {method === "online" && (
            <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
              Clicking &ldquo;Pay Online&rdquo; will open Razorpay Checkout. You can pay via UPI,
              card, net banking, or wallet. Payment status is verified server-side.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isValidAmount}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {method === "online" ? "Opening Checkout…" : "Recording…"}
              </>
            ) : method === "cash" ? (
              "Confirm Cash Payment"
            ) : (
              "Pay Online"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
