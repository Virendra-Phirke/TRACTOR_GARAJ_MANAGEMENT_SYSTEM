CREATE TABLE "backups" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(15) NOT NULL,
	"email" varchar(255) DEFAULT '',
	"address" text DEFAULT '',
	"outstanding_balance" real DEFAULT 0,
	"total_spent" real DEFAULT 0,
	"visit_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text DEFAULT '',
	"amount" real NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"payment_method" varchar(20) DEFAULT 'cash',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "garage_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'My Tractor Garage' NOT NULL,
	"address" text DEFAULT '',
	"phone" varchar(15) DEFAULT '',
	"email" varchar(255) DEFAULT '',
	"gst_number" varchar(20) DEFAULT '',
	"tagline" text DEFAULT '',
	"invoice_theme" varchar(50) DEFAULT 'default',
	"invoice_format" varchar(50) DEFAULT 'standard',
	"custom_layout_config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_labors" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" text NOT NULL,
	"hours" real DEFAULT 1,
	"rate" real NOT NULL,
	"total" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"spare_part_id" integer,
	"part_name" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" real NOT NULL,
	"total" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(20) NOT NULL,
	"customer_id" integer NOT NULL,
	"vehicle_id" integer,
	"labor_total" real DEFAULT 0,
	"parts_total" real DEFAULT 0,
	"subtotal" real DEFAULT 0,
	"tax_rate" real DEFAULT 0,
	"tax_amount" real DEFAULT 0,
	"discount_type" varchar(10) DEFAULT 'fixed',
	"discount_value" real DEFAULT 0,
	"discount_amount" real DEFAULT 0,
	"grand_total" real DEFAULT 0,
	"amount_paid" real DEFAULT 0,
	"cash_amount" real DEFAULT 0,
	"upi_amount" real DEFAULT 0,
	"payment_status" varchar(20) DEFAULT 'unpaid' NOT NULL,
	"payment_method" varchar(20) DEFAULT 'cash',
	"notes" text DEFAULT '',
	"payment_done_at" timestamp,
	"partner_paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"razorpay_order_id" varchar(100),
	"razorpay_payment_id" varchar(100),
	"razorpay_signature" varchar(255),
	"razorpay_qr_id" varchar(100),
	"gateway_method" varchar(30),
	"paid_at" timestamp,
	"failure_reason" text,
	"notes" text,
	"source" varchar(30) DEFAULT 'cash_manual',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spare_parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" integer,
	"part_number" varchar(50) DEFAULT '',
	"unit" varchar(20) DEFAULT 'piece',
	"description" text DEFAULT '',
	"stock" integer DEFAULT 0,
	"min_stock_alert" integer DEFAULT 0,
	"purchase_price" integer DEFAULT 0,
	"selling_price" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"spare_part_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"quantity" integer NOT NULL,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"reference" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"rate" real NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upi_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"vpa" varchar(100) DEFAULT '' NOT NULL,
	"payee_name" varchar(100) DEFAULT '' NOT NULL,
	"merchant_code" varchar(20) DEFAULT '',
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"registration_number" varchar(20) NOT NULL,
	"brand" varchar(100) NOT NULL,
	"model" varchar(100) DEFAULT '',
	"year" integer,
	"engine_number" varchar(50) DEFAULT '',
	"chassis_number" varchar(50) DEFAULT '',
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_labors" ADD CONSTRAINT "invoice_labors_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_parts" ADD CONSTRAINT "invoice_parts_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_parts" ADD CONSTRAINT "invoice_parts_spare_part_id_spare_parts_id_fk" FOREIGN KEY ("spare_part_id") REFERENCES "public"."spare_parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_spare_part_id_spare_parts_id_fk" FOREIGN KEY ("spare_part_id") REFERENCES "public"."spare_parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "invoice_labors_invoice_idx" ON "invoice_labors" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_parts_invoice_idx" ON "invoice_parts" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_number_idx" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_customer_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoices_vehicle_idx" ON "invoices" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "invoices_created_idx" ON "invoices" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("payment_status");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_event_id_idx" ON "payment_webhook_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "webhook_processed_idx" ON "payment_webhook_events" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "webhook_type_idx" ON "payment_webhook_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "payments_invoice_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_created_idx" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_razorpay_order_idx" ON "payments" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_razorpay_payment_idx" ON "payments" USING btree ("razorpay_payment_id");--> statement-breakpoint
CREATE INDEX "spare_parts_category_idx" ON "spare_parts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "spare_parts_name_idx" ON "spare_parts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "stock_history_part_idx" ON "stock_history" USING btree ("spare_part_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_reg_idx" ON "vehicles" USING btree ("registration_number");--> statement-breakpoint
CREATE INDEX "vehicles_customer_idx" ON "vehicles" USING btree ("customer_id");