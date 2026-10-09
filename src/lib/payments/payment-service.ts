/**
 * payment-service.ts
 *
 * Central payment mutation layer.
 * All payment writes (cash, razorpay, reconciliation) go through here.
 * Business rules are enforced here, not in individual API routes.
 */

export {
  calculateInvoicePaymentSummary,
  reconcileInvoiceStatus,
  reconcileCustomerBalance,
  cancelPendingPaymentLinksForInvoice,
  inrToPaise,
  paiseToInr,
} from "./payment-calculations";

export {
  validatePaymentAmount,
  validateInvoiceExists,
  cashPaymentSchema,
  createOrderSchema,
  verifyPaymentSchema,
} from "./payment-validation";

export {
  createRazorpayOrder,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  fetchRazorpayPayment,
  fetchRazorpayOrder,
  getRazorpayPublicKeyId,
  createRazorpayPaymentLink,
  cancelRazorpayPaymentLink,
  fetchRazorpayPaymentLink,
} from "./razorpay";

