"use client";

/**
 * razorpay-checkout.tsx
 *
 * Client component that loads the Razorpay Checkout SDK and handles
 * the payment flow. It is a controlled component: the parent drives
 * when to open the checkout via the `trigger` prop.
 *
 * Security:
 * - Only receives publicKeyId and razorpayOrderId from the server.
 * - Never sends payment status directly to the parent. It sends the
 *   raw checkout identifiers to the server verify endpoint instead.
 * - The server verify endpoint is authoritative for success/failure.
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";

// Razorpay Checkout Script URL
const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayCheckoutOptions {
  publicKeyId: string;
  razorpayOrderId: string;
  localPaymentId: number;
  amountPaise: number;
  currency: string;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  description?: string;
  onSuccess: (result: { paymentStatus: string; paidAmountInr: number; dueAmountInr: number }) => void;
  onFailure?: (reason: string) => void;
}

// Type for the Razorpay checkout instance (minimal interface)
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open(): void;
      on(event: string, handler: (response: Record<string, unknown>) => void): void;
    };
  }
}

/**
 * Load the Razorpay checkout.js script lazily (once per page load).
 */
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${RAZORPAY_CHECKOUT_URL}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout."));
    document.head.appendChild(script);
  });
}

/**
 * Opens the Razorpay Checkout modal and handles the payment flow.
 * Sends the checkout identifiers to the server verify endpoint.
 * Never marks the invoice paid from the browser callback.
 */
export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions
): Promise<void> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay SDK failed to load.");
  }

  return new Promise((resolve) => {
    const rzp = new window.Razorpay({
      key: options.publicKeyId,
      order_id: options.razorpayOrderId,
      amount: options.amountPaise,
      currency: options.currency,
      name: "Garaje",
      description: options.description ?? "Invoice Payment",
      prefill: {
        name: options.prefill?.name ?? "",
        contact: options.prefill?.contact ?? "",
        email: options.prefill?.email ?? "",
      },
      theme: { color: "#7c3aed" },
      modal: {
        ondismiss: () => {
          toast.info("Payment cancelled. You can try again.");
          resolve();
        },
      },
      handler: async (response: Record<string, unknown>) => {
        // IMPORTANT: Never trust this callback as proof of payment.
        // Always verify server-side.
        const toastId = toast.loading("Verifying payment…");

        try {
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              localPaymentId: options.localPaymentId,
              razorpayOrderId: response["razorpay_order_id"],
              razorpayPaymentId: response["razorpay_payment_id"],
              razorpaySignature: response["razorpay_signature"],
            }),
          });

          const data = (await verifyRes.json()) as {
            success?: boolean;
            invoice?: { paymentStatus: string; paidAmountInr: number; dueAmountInr: number };
            error?: string;
          };

          if (!verifyRes.ok || !data.success) {
            toast.dismiss(toastId);
            toast.error(data.error ?? "Payment verification failed. Please contact support.");
            options.onFailure?.(data.error ?? "Verification failed");
          } else {
            toast.dismiss(toastId);
            toast.success("Payment successful!");
            options.onSuccess(data.invoice!);
          }
        } catch {
          toast.dismiss(toastId);
          toast.error("Network error during verification. Please refresh.");
          options.onFailure?.("Network error");
        }

        resolve();
      },
    });

    rzp.on("payment.failed", (response: Record<string, unknown>) => {
      const errDesc =
        (response["error"] as Record<string, string> | undefined)?.["description"] ??
        "Payment failed";
      toast.error(errDesc);
      options.onFailure?.(errDesc);
      resolve();
    });

    rzp.open();
  });
}

/**
 * Hook-based component for use in React trees.
 * Exposes a `checkout` function that opens the Razorpay modal.
 */
export function useRazorpayCheckout() {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadRazorpayScript().catch(() => {
        // Pre-loading failed; will retry on demand
      });
    }
  }, []);

  return { openCheckout: openRazorpayCheckout };
}
