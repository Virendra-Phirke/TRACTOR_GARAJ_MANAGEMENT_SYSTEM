# Razorpay Payment Implementation Plan

## Repository-specific analysis

GBMS is a Next.js 16.2.9 App Router application using React 19, TypeScript, Drizzle ORM, Neon Serverless PostgreSQL, Zod and the qrcode package.

Relevant existing files:
- src/db/schema.ts
- src/db/index.ts
- src/lib/actions/invoices.ts
- src/app/(dashboard)/invoices/[id]/invoice-detail-client.tsx
- src/lib/qr/upi-qr.ts
- src/app/api/invoices/[id]/pdf/route.ts
- src/app/api/share-token/[id]/route.ts
- package.json
- drizzle.config.ts

Current invoice payment fields are grandTotal, amountPaid, cashAmount, upiAmount, paymentStatus, paymentMethod and paymentDoneAt. The UI currently supports manual cash, UPI, card and split Cash + UPI recording.

Current QR code generation in src/lib/qr/upi-qr.ts creates a direct upi://pay QR using the garage VPA, payee name, amount and transaction note. This QR must not be treated as proof of Razorpay payment.

## Architectural decision

The invoice is the commercial document. The payment ledger is the financial source of truth. Razorpay is the online gateway, not the application's payment model.

Application payment methods should be only:
- CASH
- ONLINE

Razorpay owns the underlying online method:
- UPI
- Card
- Net Banking
- Wallets
- Other enabled Razorpay methods

A single invoice must support unlimited payment records. Example:

Invoice ₹20,000
- Cash ₹10,000 -> SUCCESS
- Online ₹10,000 -> Razorpay -> UPI -> SUCCESS
- Paid ₹20,000
- Due ₹0
- Status PAID

## Phase 1 — Database/payment ledger

Add a payments table with:

- id
- invoiceId
- amount
- paymentMethod: cash | online
- status: pending | success | failed | refunded
- razorpayOrderId
- razorpayPaymentId
- razorpaySignature where required for checkout verification/audit
- razorpayQrId if the selected Razorpay QR API returns one
- gatewayMethod: upi | card | netbanking | wallet | other
- paidAt
- failureReason
- notes
- createdAt
- updatedAt

Add indexes on invoiceId, razorpayOrderId, razorpayPaymentId, status and createdAt.

Add paymentWebhookEvents:

- id
- eventId UNIQUE
- eventType
- payload JSONB
- processed
- processedAt
- createdAt

This table provides webhook idempotency and an audit trail.

Optionally add refunds later:

- id
- paymentId
- amount
- razorpayRefundId
- status
- reason
- createdAt
- updatedAt

Do not immediately remove the existing invoice payment columns. Migrate gradually so existing invoices, reports and PDFs keep working.

## Phase 2 — Payment calculations

Create a central payment calculation/service layer.

Server-side rules:

    paidAmount = SUM(successful payments for invoice)
    dueAmount = invoice.grandTotal - paidAmount

Invoice status:
- paidAmount = 0 -> unpaid
- paidAmount > 0 and paidAmount < grandTotal -> partial
- paidAmount >= grandTotal -> paid

The frontend must never be authoritative for payment status.

## Phase 3 — Cash payments

Create:

    POST /api/payments/cash

Server flow:
1. Authenticate the garage user.
2. Load the invoice.
3. Calculate current paid and due amounts from successful payments.
4. Reject amount <= 0.
5. Reject amount > current due.
6. Insert a payment with paymentMethod=cash and status=success.
7. Recalculate invoice state.
8. Reconcile customer outstanding balance.
9. Revalidate invoice/dashboard/report pages.

Cash does not involve Razorpay.

## Phase 4 — Razorpay order creation

Create:

    POST /api/payments/razorpay/create-order

Input:

    { invoiceId, amount }

Server flow:
1. Authenticate the user.
2. Load invoice.
3. Calculate current due.
4. Validate amount <= due.
5. Convert INR to paise.
6. Create Razorpay order server-side.
7. Insert a local pending ONLINE payment linked to the Razorpay order.
8. Return only safe checkout data.

Never trust a client-provided amount as the final financial value.

## Phase 5 — Razorpay Checkout

Frontend:
1. Request an order from the backend.
2. Receive public key ID and Razorpay order ID.
3. Open Razorpay Checkout.
4. Allow Razorpay to handle UPI, cards, net banking, wallets and other enabled methods.
5. Show a pending state.
6. Send checkout identifiers to backend verification.
7. Never directly mark the invoice paid from the browser callback.

Backend remains authoritative.

## Phase 6 — Checkout verification

Create:

    POST /api/payments/razorpay/verify

Verify:
- local payment ID
- stored Razorpay order ID
- Razorpay payment ID
- Razorpay signature

Flow:
1. Find the local pending payment.
2. Confirm the supplied order ID matches the stored order.
3. Compute and compare the Razorpay checkout signature using the server-side secret.
4. Validate amount and currency.
5. Confirm the payment belongs to the intended order/payment attempt.
6. Update only the matching payment.
7. Let webhook reconciliation handle asynchronous final state.

## Phase 7 — Razorpay QR

Requirement: customer can scan a QR and the payment is verified through Razorpay.

Production flow:

    Invoice due
      -> create ONLINE payment attempt
      -> create Razorpay-supported transaction-specific QR/payment context
      -> display QR
      -> customer scans with UPI app
      -> Razorpay processes payment
      -> Razorpay webhook
      -> match gateway transaction
      -> mark local payment SUCCESS

Do not use the existing generic upi://pay QR as proof of payment.

The existing QR generator can remain as a separate manual/fallback UPI QR feature if the garage explicitly wants it.

## Phase 8 — Razorpay webhook

Create:

    POST /api/webhooks/razorpay

Processing:
1. Read the raw request body.
2. Read Razorpay webhook signature.
3. Validate HMAC using RAZORPAY_WEBHOOK_SECRET.
4. Parse the event only after signature validation.
5. Read event ID/type.
6. Find the local payment/order.
7. Validate amount and currency where applicable.
8. Process idempotently.
9. Update payment.
10. Recalculate invoice status and customer outstanding balance.
11. Return HTTP 2xx.

Initial events to configure/evaluate:
- payment.authorized
- payment.captured
- payment.failed
- order.paid

Refund phase:
- refund.created
- refund.processed
- refund.failed

Treat payment.captured as the primary captured-payment event. Use order.paid as an additional order-level signal where useful. Never create duplicate payment records when multiple events refer to the same payment.

## Phase 9 — Webhook idempotency

Use paymentWebhookEvents.eventId as a unique key.

Flow:

    receive webhook
      -> verify signature
      -> read eventId
      -> already processed?
         -> yes: return 2xx
         -> no: store event
               -> process payment
               -> mark processed
               -> return 2xx

Also protect payment records with unique Razorpay order/payment IDs and status checks.

## Phase 10 — Payment reconciliation

For a successful online payment:
1. Match local payment by razorpayOrderId.
2. Ensure razorpayPaymentId is not already attached to another payment.
3. Validate amount.
4. Validate INR currency.
5. Store razorpayPaymentId.
6. Store gatewayMethod, e.g. upi or card.
7. Set status=success.
8. Set paidAt.
9. Recalculate invoice paid/due/status.
10. Reconcile customer outstanding balance.
11. Revalidate affected UI.

Example:

    Invoice = ₹20,000
    Cash = ₹10,000 SUCCESS
    Online = ₹10,000 SUCCESS, gatewayMethod=upi
    Paid = ₹20,000
    Due = ₹0
    Status = PAID

## Phase 11 — Split and partial payments

Support all of these:

    ₹20,000 invoice
    ₹10,000 CASH
    ₹ 5,000 ONLINE
    Due ₹5,000
    Status PARTIAL

Then:

    ₹5,000 CASH
    Paid ₹20,000
    Due ₹0
    Status PAID

Also support multiple cash and multiple online payments.

A failed online attempt must not change paid amount.

## Phase 12 — Customer balance migration

Current invoice actions update customers.outstandingBalance directly. Refactor this carefully.

Create one central reconciliation function that calculates the customer's outstanding amount from invoice/payment state. Webhook retries must never double-decrement customer balance.

## Phase 13 — Invoice creation migration

Current createInvoice accepts paymentMethod, paymentStatus and amountPaid.

Target:
1. Create invoice.
2. Start payment ledger at zero.
3. If an initial cash amount exists, create a successful CASH payment.
4. Never create a fake successful ONLINE payment during invoice creation.
5. Online payments always begin as a Razorpay pending payment attempt.

## Phase 14 — UI redesign

Replace the current manual payment-status dialog with:

    Record Payment
    Amount: ₹______

    Method:
    [ Cash ] [ Online ]

    Cash:
    [ Confirm Cash Payment ]

    Online:
    [ Create Online Payment ]
      -> Razorpay Checkout / QR
      -> Pending
      -> Success
      -> Failed / Retry

Payment history should show:
- amount
- CASH or ONLINE
- gateway method for ONLINE
- status
- timestamp
- Razorpay IDs for authorized staff where useful

Bill summary should show:

    Grand Total    ₹20,000
    Total Paid    ₹15,000
    Balance Due    ₹5,000

## Phase 15 — API structure

Primary:

    POST /api/payments/cash
    POST /api/payments/razorpay/create-order
    POST /api/payments/razorpay/verify
    POST /api/webhooks/razorpay
    GET  /api/payments/:id
    GET  /api/invoices/:id/payments

Later:

    POST /api/payments/:id/refund
    GET  /api/payments/:id/status
    POST /api/payments/razorpay/qr

## Phase 16 — Code organization

Recommended:

    src/app/api/payments/cash/route.ts
    src/app/api/payments/razorpay/create-order/route.ts
    src/app/api/payments/razorpay/verify/route.ts
    src/app/api/webhooks/razorpay/route.ts

    src/lib/payments/payment-service.ts
    src/lib/payments/payment-calculations.ts
    src/lib/payments/payment-validation.ts
    src/lib/payments/razorpay.ts

    src/components/payments/record-payment-dialog.tsx
    src/components/payments/payment-history.tsx
    src/components/payments/razorpay-checkout.tsx
    src/components/payments/razorpay-payment-status.tsx

Keep payment mutations centralized in the payment service.

## Phase 17 — Environment variables

Add:

    RAZORPAY_KEY_ID=
    RAZORPAY_KEY_SECRET=
    RAZORPAY_WEBHOOK_SECRET=
    NEXT_PUBLIC_RAZORPAY_KEY_ID=

Only the public key may reach the browser.

Never expose or commit:
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET

## Phase 18 — Security requirements

- Server-only Razorpay secret.
- Server-only webhook secret.
- HTTPS in production.
- Webhook HMAC verification.
- Checkout signature verification.
- Server-side amount validation.
- Authenticated garage-user checks.
- Unique Razorpay order/payment IDs.
- Webhook idempotency.
- No frontend-only invoice status mutation.
- No treating QR scan as payment proof.
- No payment secrets in logs or Git.
- Audit manual cash payments.
- Validate every payment against current invoice due.

## Phase 19 — Failure handling

Customer closes Checkout:
- Keep attempt pending/expired according to the selected Razorpay lifecycle.
- Allow another payment attempt.

Payment fails:
- Mark only that attempt failed.
- Preserve earlier successful payments.

Webhook arrives first:
- Webhook updates payment.
- Frontend re-fetches current state.

Frontend callback arrives first:
- Verify server-side.
- Webhook reconciles asynchronous state.

Duplicate webhook:
- Return 2xx without creating another payment.

Amount mismatch:
- Do not credit the invoice.
- Flag the transaction for investigation.

## Phase 20 — Refunds

Do not implement refunds in the first milestone unless required.

Later:

    Payment
      -> Refund request
      -> Razorpay refund
      -> refund webhook
      -> refund ledger
      -> recalculate net paid

Never overwrite the original successful payment amount.

## Phase 21 — Testing

Database:
- [ ] Payment migration succeeds.
- [ ] Existing invoices remain readable.
- [ ] Existing UPI settings remain intact.
- [ ] Existing PDFs remain functional.

Cash:
- [ ] Full cash payment.
- [ ] Partial cash payment.
- [ ] Multiple cash payments.
- [ ] Amount greater than due rejected.
- [ ] Zero/negative amount rejected.

Razorpay:
- [ ] Create order.
- [ ] Checkout opens.
- [ ] Test UPI.
- [ ] Test card.
- [ ] Test another enabled method.
- [ ] Successful payment.
- [ ] Failed payment.
- [ ] Checkout closed.
- [ ] Duplicate callback.
- [ ] Webhook success.
- [ ] Webhook failure.
- [ ] Duplicate webhook.
- [ ] Webhook before frontend callback.
- [ ] Frontend callback before webhook.
- [ ] Amount mismatch.
- [ ] Unknown order ID.

Split:
- [ ] Cash + online.
- [ ] Online + cash.
- [ ] Multiple online payments.
- [ ] Multiple partial payments.
- [ ] Final payment changes invoice to PAID.
- [ ] Due remains correct.

Regression:
- [ ] Dashboard revenue.
- [ ] Pending payments.
- [ ] Reports.
- [ ] Customer outstanding balance.
- [ ] Invoice list.
- [ ] Invoice detail.
- [ ] PDF.
- [ ] WhatsApp sharing.
- [ ] Invoice editing.
- [ ] Invoice deletion.
- [ ] Backup/export.

## Phase 22 — Rollout milestones

### M1 — Data model
- Add payments.
- Add paymentWebhookEvents.
- Add indexes/relations.
- Add migration.
- Preserve legacy compatibility.

### M2 — Payment calculations
- Centralize paid/due/status calculations.
- Stop adding new business logic to legacy payment columns.

### M3 — Cash
- Implement cash payment ledger.
- Replace manual status mutation.
- Update UI.

### M4 — Razorpay
- Add Razorpay server adapter.
- Configure Test Mode credentials.
- Implement order creation.
- Implement Checkout.

### M5 — Verification
- Implement checkout signature verification.
- Validate amount, currency and order.

### M6 — Webhooks
- Implement webhook endpoint.
- Verify HMAC.
- Add idempotency.
- Reconcile payment state.

### M7 — QR
- Implement the Razorpay-supported transaction-specific QR flow selected for production.
- Display exact online amount.
- Reconcile through Razorpay.

### M8 — UI/reporting
- Payment history.
- Split-payment display.
- Online gateway method display.
- Dashboard/report changes.
- PDF/WhatsApp payment information.

### M9 — Hardening
- Security review.
- Failure/retry tests.
- Duplicate webhook tests.
- Amount mismatch tests.
- Production configuration review.

## Complete fallback and security plan

### Fallback hierarchy

1. Razorpay-supported transaction-specific QR, when enabled for the account.
2. Razorpay Checkout with UPI.
3. Razorpay Checkout with cards, net banking or wallets.
4. Existing direct UPI QR as MANUAL UPI only.
5. Cash.

The existing generic UPI QR must never be treated as Razorpay verification and must never receive a fabricated Razorpay payment ID.

### Gateway outage

If Razorpay order creation, Checkout or QR creation fails:
- keep the invoice unchanged;
- show retry;
- allow another Razorpay method where possible;
- allow cash;
- never mark the payment successful locally.

If the webhook is delayed, show PROCESSING. After a configured threshold, the backend may fetch the gateway payment/order state. Razorpay recommends backend API fetching as a supplement for critical user-facing confirmation when webhook delivery has not arrived. citeturn0search4

### Webhook security

- Read the raw request body before parsing JSON.
- Verify the Razorpay HMAC-SHA256 signature.
- Use the webhook secret only on the server.
- Use x-razorpay-event-id as the idempotency key.
- Reject invalid signatures.
- Store webhook events for audit/replay.
- Do not assume event ordering.
- Do not downgrade SUCCESS because of a late FAILED event.
- Handle failed-to-captured UPI retry scenarios.

Razorpay explicitly documents raw-body signature validation, event idempotency and out-of-order delivery. citeturn0search1turn0search2

### Financial security

- Store gateway amounts as integer paise.
- Validate amount and currency server-side.
- Validate amount against current invoice due.
- Use database transactions for reconciliation.
- Protect against concurrent cash and online payments.
- Add unique constraints for Razorpay order/payment IDs.
- Never trust frontend payment status.
- Never expose Razorpay secret keys.
- Never log secrets or sensitive payment credentials.
- Use HTTPS.
- Apply authentication and tenant/invoice authorization.
- Rate-limit payment creation and status endpoints.
- Keep webhook rate limiting separate from normal user traffic.
- Use appropriate CSRF protection for cookie-authenticated mutations.
- Enable Razorpay Dashboard 2FA and role-based access.

Razorpay recommends secure secret handling, HTTPS, HMAC webhook validation, webhook IP controls where applicable, and Dashboard 2FA. citeturn0search0

### Idempotency

Implement three levels:

1. Webhook event ID idempotency.
2. Unique Razorpay order/payment IDs.
3. Application idempotency key for payment creation.

A repeated callback or webhook must never create a second successful payment.

### Concurrency

Example race:

    Due = ₹5,000
    Staff A records ₹5,000 cash
    Staff B starts ₹5,000 online

Use database locking or optimistic concurrency/version checks. Re-read the invoice due immediately before creating/committing the local payment state.

### Overpayment

If Razorpay captures money after another payment has already closed the invoice:
- record the gateway transaction;
- mark it as an exception;
- do not silently discard it;
- reconcile/refund according to policy.

### Reconciliation job

Periodically find PENDING/PROCESSING payments older than a threshold and query Razorpay server-side.

Possible outcomes:
- captured -> SUCCESS;
- failed -> FAILED;
- still pending -> remain pending;
- mismatch -> EXCEPTION.

This is a safety net, not the primary payment mechanism.

### Audit trail

Record:
- payment created;
- cash recorded;
- Razorpay order created;
- checkout verified;
- webhook received/rejected;
- captured/failed state;
- manual UPI verification;
- exceptions;
- refunds.

Recommended source values:
- cash_manual
- razorpay_checkout
- razorpay_qr
- manual_upi
- migration
- adjustment

Never fabricate Razorpay IDs for historical/manual UPI payments.

### Public payment page

If customer payment is exposed through a share link:
- use a high-entropy scoped token;
- bind it to exactly one invoice;
- do not trust a client invoice ID;
- expose only required invoice information;
- expose only the public Razorpay key;
- never expose server secrets;
- support token expiration/revocation where practical.

### Testing additions

Test:
- invalid webhook signature;
- modified webhook body;
- duplicate event ID;
- missing signature;
- missing event ID;
- malformed webhook;
- unknown event;
- unknown payment;
- payment.authorized;
- payment.captured;
- payment.failed;
- order.paid;
- out-of-order events;
- failed then captured;
- amount mismatch;
- currency mismatch;
- duplicate Checkout callback;
- delayed webhook;
- Razorpay API outage;
- concurrent cash/online payment;
- overpayment;
- reconciliation recovery.

Razorpay recommends testing webhook behavior in Test Mode before production. citeturn0search1

### Production rollout

1. Run database migration on staging.
2. Reconcile legacy invoice totals against the new ledger.
3. Run Razorpay Test Mode.
4. Test webhook retries and duplicates.
5. Test failure and recovery paths.
6. Test concurrency.
7. Verify secrets are absent from Git/client bundles.
8. Verify HTTPS and production webhook configuration.
9. Enable monitoring and reconciliation.
10. Configure Live Mode.
11. Start with controlled production rollout.
12. Monitor payment exceptions before broad rollout.

### Rollback

If production payment integration fails:
- disable new online payment initiation;
- keep cash available;
- keep webhook endpoint active;
- reconcile pending gateway payments;
- roll back application code if necessary;
- preserve all financial records;
- never delete payments as part of rollback.

## Definition of Done

- ₹20,000 invoice supports ₹10,000 cash + ₹10,000 Razorpay online.
- Multiple partial payments work.
- Application methods are CASH and ONLINE.
- Razorpay handles UPI/cards/net banking/etc.
- QR payments use the selected Razorpay-supported payment/QR flow.
- Online payment success is independently verified.
- Webhooks are signature-verified and idempotent.
- Duplicate webhooks cannot duplicate financial records.
- Invoice paid/due/status comes from the payment ledger.
- Customer outstanding balance remains correct.
- Existing invoice/PDF/report functionality continues working.
- Razorpay secrets never reach the browser.
- Test-mode success/failure/split/partial scenarios pass.

## Exact implementation order for this repository

1. Audit all invoice payment reads/writes.
2. Add payments and paymentWebhookEvents.
3. Add migration.
4. Build payment calculation/reconciliation service.
5. Migrate cash payment flow.
6. Add Razorpay server adapter.
7. Add create-order endpoint.
8. Add checkout verification endpoint.
9. Add webhook endpoint and signature verification.
10. Add webhook idempotency.
11. Add Razorpay QR flow.
12. Replace invoice payment dialog.
13. Add payment history.
14. Update dashboard/reports/customer balance.
15. Update PDF/WhatsApp payment information.
16. Run regression tests.
17. Configure Razorpay Test Mode.
18. Perform production verification.
19. Switch to Live Mode only after all reconciliation tests pass.

## Official references

- https://razorpay.com/docs/api/
- https://razorpay.com/docs/webhooks/
- https://razorpay.com/docs/payments/
- https://razorpay.com/docs/payments/qr-codes/
- https://razorpay.com/security/checklist/
