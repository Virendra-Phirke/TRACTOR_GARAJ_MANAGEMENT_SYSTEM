/**
 * razorpay.ts
 *
 * Server-only Razorpay adapter.
 * NEVER import this in client components.
 * Secrets are guarded by getters that throw at startup if missing.
 */

import Razorpay from "razorpay";
import crypto from "crypto";

// ─── Secret guards ──────────────────────────────────────────────────────

function getRazorpayKeyId(): string {
  const key = process.env.RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error(
      "FATAL: RAZORPAY_KEY_ID environment variable is not set."
    );
  }
  return key;
}

function getRazorpayKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: RAZORPAY_KEY_SECRET environment variable is not set. " +
        "Never expose this on the client."
    );
  }
  return secret;
}

function getRazorpayWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: RAZORPAY_WEBHOOK_SECRET environment variable is not set."
    );
  }
  return secret;
}

// ─── Lazily-instantiated Razorpay client ───────────────────────────────

let _razorpayInstance: Razorpay | null = null;

function getRazorpayClient(): Razorpay {
  if (!_razorpayInstance) {
    _razorpayInstance = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: getRazorpayKeySecret(),
    });
  }
  return _razorpayInstance;
}

// ─── Types ──────────────────────────────────────────────────────────────

export interface CreateOrderParams {
  /** Amount in paise */
  amountPaise: number;
  /** Internal local payment ID (used as receipt) */
  localPaymentId: number;
  invoiceNumber: string;
  currency?: string;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

// ─── Order creation ─────────────────────────────────────────────────────

/**
 * Create a Razorpay order server-side.
 * Amount must be in paise (integer).
 * Never trust client-provided amounts.
 */
export async function createRazorpayOrder(
  params: CreateOrderParams
): Promise<RazorpayOrderResponse> {
  if (!Number.isInteger(params.amountPaise) || params.amountPaise <= 0) {
    throw new Error(
      `Invalid amount: ${params.amountPaise} paise. Must be a positive integer.`
    );
  }

  const client = getRazorpayClient();
  const order = await client.orders.create({
    amount: params.amountPaise,
    currency: params.currency ?? "INR",
    receipt: `pay_${params.localPaymentId}_inv_${params.invoiceNumber}`.slice(0, 40),
    notes: {
      invoice_number: params.invoiceNumber,
      local_payment_id: String(params.localPaymentId),
    },
  });

  return order as unknown as RazorpayOrderResponse;
}

// ─── Checkout signature verification ───────────────────────────────────

/**
 * Verify the Razorpay checkout signature.
 *
 * Razorpay computes:
 *   HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
 *
 * @returns true if signature is valid
 */
export function verifyCheckoutSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", getRazorpayKeySecret())
    .update(body)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(razorpaySignature, "hex")
    );
  } catch {
    // If buffers are different lengths, timingSafeEqual throws
    return false;
  }
}

// ─── Webhook signature verification ────────────────────────────────────

/**
 * Verify a Razorpay webhook HMAC-SHA256 signature.
 *
 * MUST be called with the RAW request body bytes BEFORE JSON.parse().
 * Do not use the parsed body — Razorpay signs the exact raw bytes.
 *
 * @param rawBody  Raw request body as string
 * @param signature  Value from x-razorpay-signature header
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  if (!rawBody || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", getRazorpayWebhookSecret())
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

// ─── Fetch payment from Razorpay API (reconciliation) ──────────────────

/**
 * Fetch a payment's details from Razorpay.
 * Used for reconciliation when webhook has not arrived.
 */
export async function fetchRazorpayPayment(razorpayPaymentId: string) {
  const client = getRazorpayClient();
  return client.payments.fetch(razorpayPaymentId);
}

/**
 * Fetch an order's details from Razorpay.
 */
export async function fetchRazorpayOrder(razorpayOrderId: string) {
  const client = getRazorpayClient();
  return client.orders.fetch(razorpayOrderId);
}

// ─── Public key (safe to expose to browser) ────────────────────────────

/**
 * Returns only the public key ID (safe for browser).
 * Throws if the public env var is not set.
 */
export function getRazorpayPublicKeyId(): string {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error(
      "FATAL: NEXT_PUBLIC_RAZORPAY_KEY_ID environment variable is not set."
    );
  }
  return key;
}

// ─── Payment Links (rzp.io) ─────────────────────────────────────────────

export interface CreatePaymentLinkParams {
  amountPaise: number;
  localPaymentId: number;
  invoiceId: number;
  invoiceNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  description?: string;
}

export interface RazorpayPaymentLinkResponse {
  id: string;
  short_url: string;
  order_id?: string;
  status: string;
  amount: number;
  amount_paid: number;
  currency: string;
  created_at: number;
}

/**
 * Create a Razorpay Payment Link (short URL: rzp.io/i/...) server-side.
 * Suitable for sending to customers via WhatsApp or SMS.
 */
export async function createRazorpayPaymentLink(
  params: CreatePaymentLinkParams
): Promise<RazorpayPaymentLinkResponse> {
  if (!Number.isInteger(params.amountPaise) || params.amountPaise <= 0) {
    throw new Error(
      `Invalid amount: ${params.amountPaise} paise. Must be a positive integer.`
    );
  }

  // Clean customer phone: standard 10-digit Indian phone or with +91
  let cleanPhone: string | undefined = undefined;
  if (params.customerPhone) {
    const digits = params.customerPhone.replace(/\D/g, "");
    if (digits.length === 10) {
      cleanPhone = digits;
    } else if (digits.length === 12 && digits.startsWith("91")) {
      cleanPhone = digits.slice(2);
    }
  }

  const client = getRazorpayClient();
  const paymentLink = await client.paymentLink.create({
    amount: params.amountPaise,
    currency: "INR",
    accept_partial: false,
    description: params.description ?? `Payment for Invoice #${params.invoiceNumber}`,
    customer: {
      name: params.customerName || "Customer",
      contact: cleanPhone,
      email: params.customerEmail,
    },
    notify: {
      sms: false,
      email: false,
    },
    reminder_enable: true,
    notes: {
      invoice_id: String(params.invoiceId),
      invoice_number: params.invoiceNumber,
      local_payment_id: String(params.localPaymentId),
    },
  });

  return paymentLink as unknown as RazorpayPaymentLinkResponse;
}

/**
 * Cancel an active Razorpay Payment Link.
 */
export async function cancelRazorpayPaymentLink(paymentLinkId: string) {
  const client = getRazorpayClient();
  return client.paymentLink.cancel(paymentLinkId);
}

/**
 * Fetch Payment Link details from Razorpay API.
 */
export async function fetchRazorpayPaymentLink(paymentLinkId: string) {
  const client = getRazorpayClient();
  return client.paymentLink.fetch(paymentLinkId);
}
