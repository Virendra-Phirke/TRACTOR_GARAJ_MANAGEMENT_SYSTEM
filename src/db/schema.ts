import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  boolean,
  serial,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Garage Settings (Singleton) ─────────────────────────────────────
export const garageSettings = pgTable("garage_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("My Tractor Garage"),
  address: text("address").default(""),
  phone: varchar("phone", { length: 15 }).default(""),
  email: varchar("email", { length: 255 }).default(""),
  gstNumber: varchar("gst_number", { length: 20 }).default(""),
  tagline: text("tagline").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── UPI Settings (Singleton) ────────────────────────────────────────
export const upiSettings = pgTable("upi_settings", {
  id: serial("id").primaryKey(),
  vpa: varchar("vpa", { length: 100 }).notNull().default(""),
  payeeName: varchar("payee_name", { length: 100 }).notNull().default(""),
  merchantCode: varchar("merchant_code", { length: 20 }).default(""),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Tax Settings ────────────────────────────────────────────────────
export const taxSettings = pgTable("tax_settings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  rate: real("rate").notNull(),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Customers ───────────────────────────────────────────────────────
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 15 }).notNull(),
    email: varchar("email", { length: 255 }).default(""),
    address: text("address").default(""),
    outstandingBalance: real("outstanding_balance").default(0),
    totalSpent: real("total_spent").default(0),
    visitCount: integer("visit_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("customers_phone_idx").on(table.phone),
    index("customers_name_idx").on(table.name),
  ]
);

export const customersRelations = relations(customers, ({ many }) => ({
  vehicles: many(vehicles),
  invoices: many(invoices),
}));

// ─── Vehicles ────────────────────────────────────────────────────────
export const vehicles = pgTable(
  "vehicles",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    registrationNumber: varchar("registration_number", { length: 20 }).notNull(),
    brand: varchar("brand", { length: 100 }).notNull(),
    model: varchar("model", { length: 100 }).default(""),
    year: integer("year"),
    engineNumber: varchar("engine_number", { length: 50 }).default(""),
    chassisNumber: varchar("chassis_number", { length: 50 }).default(""),
    notes: text("notes").default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("vehicles_reg_idx").on(table.registrationNumber),
    index("vehicles_customer_idx").on(table.customerId),
  ]
);

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  customer: one(customers, {
    fields: [vehicles.customerId],
    references: [customers.id],
  }),
  invoices: many(invoices),
}));

// ─── Categories ──────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  spareParts: many(spareParts),
}));

// ─── Spare Parts ─────────────────────────────────────────────────────
export const spareParts = pgTable(
  "spare_parts",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    partNumber: varchar("part_number", { length: 50 }).default(""),
    unit: varchar("unit", { length: 20 }).default("piece"),
    description: text("description").default(""),
    stock: integer("stock").default(0),
    minStockAlert: integer("min_stock_alert").default(0),
    purchasePrice: integer("purchase_price").default(0),
    sellingPrice: integer("selling_price").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("spare_parts_category_idx").on(table.categoryId),
    index("spare_parts_name_idx").on(table.name),
  ]
);

export const sparePartsRelations = relations(spareParts, ({ one, many }) => ({
  category: one(categories, {
    fields: [spareParts.categoryId],
    references: [categories.id],
  }),
  invoiceParts: many(invoiceParts),
  stockHistory: many(stockHistory),
}));

// ─── Invoices ────────────────────────────────────────────────────────
export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    invoiceNumber: varchar("invoice_number", { length: 20 }).notNull(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),
    vehicleId: integer("vehicle_id").references(() => vehicles.id),
    laborTotal: real("labor_total").default(0),
    partsTotal: real("parts_total").default(0),
    subtotal: real("subtotal").default(0),
    taxRate: real("tax_rate").default(0),
    taxAmount: real("tax_amount").default(0),
    discountType: varchar("discount_type", { length: 10 }).default("fixed"), // 'fixed' | 'percent'
    discountValue: real("discount_value").default(0),
    discountAmount: real("discount_amount").default(0),
    grandTotal: real("grand_total").default(0),
    amountPaid: real("amount_paid").default(0),
    cashAmount: real("cash_amount").default(0),
    upiAmount: real("upi_amount").default(0),
    paymentStatus: varchar("payment_status", { length: 20 })
      .default("unpaid")
      .notNull(), // 'paid' | 'unpaid' | 'partial'
    paymentMethod: varchar("payment_method", { length: 20 }).default("cash"), // 'cash' | 'upi' | 'card' | 'split' | 'other'
    notes: text("notes").default(""),
    paymentDoneAt: timestamp("payment_done_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("invoices_number_idx").on(table.invoiceNumber),
    index("invoices_customer_idx").on(table.customerId),
    index("invoices_vehicle_idx").on(table.vehicleId),
    index("invoices_created_idx").on(table.createdAt),
    index("invoices_status_idx").on(table.paymentStatus),
  ]
);

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  vehicle: one(vehicles, {
    fields: [invoices.vehicleId],
    references: [vehicles.id],
  }),
  laborItems: many(invoiceLabors),
  partItems: many(invoiceParts),
}));

// ─── Invoice Labor Items ─────────────────────────────────────────────
export const invoiceLabors = pgTable(
  "invoice_labors",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    hours: real("hours").default(1),
    rate: real("rate").notNull(),
    total: real("total").notNull(),
  },
  (table) => [index("invoice_labors_invoice_idx").on(table.invoiceId)]
);

export const invoiceLaborsRelations = relations(invoiceLabors, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLabors.invoiceId],
    references: [invoices.id],
  }),
}));

// ─── Invoice Parts Items ─────────────────────────────────────────────
export const invoiceParts = pgTable(
  "invoice_parts",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    sparePartId: integer("spare_part_id")
      .references(() => spareParts.id),
    partName: varchar("part_name", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: real("unit_price").notNull(),
    total: real("total").notNull(),
  },
  (table) => [index("invoice_parts_invoice_idx").on(table.invoiceId)]
);

export const invoicePartsRelations = relations(invoiceParts, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceParts.invoiceId],
    references: [invoices.id],
  }),
  sparePart: one(spareParts, {
    fields: [invoiceParts.sparePartId],
    references: [spareParts.id],
  }),
}));

// ─── Expenses ────────────────────────────────────────────────────────
export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    category: varchar("category", { length: 100 }).notNull(),
    description: text("description").default(""),
    amount: real("amount").notNull(),
    date: timestamp("date").defaultNow().notNull(),
    paymentMethod: varchar("payment_method", { length: 20 }).default("cash"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("expenses_date_idx").on(table.date)]
);

// ─── Stock History ───────────────────────────────────────────────────
export const stockHistory = pgTable(
  "stock_history",
  {
    id: serial("id").primaryKey(),
    sparePartId: integer("spare_part_id")
      .notNull()
      .references(() => spareParts.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // 'purchase' | 'sale' | 'adjustment'
    quantity: integer("quantity").notNull(),
    previousStock: integer("previous_stock").notNull(),
    newStock: integer("new_stock").notNull(),
    reference: text("reference").default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("stock_history_part_idx").on(table.sparePartId)]
);

export const stockHistoryRelations = relations(stockHistory, ({ one }) => ({
  sparePart: one(spareParts, {
    fields: [stockHistory.sparePartId],
    references: [spareParts.id],
  }),
}));

// ─── Backups ─────────────────────────────────────────────────────────
export const backups = pgTable("backups", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Estimates ───────────────────────────────────────────────────────
export const estimates = pgTable(
  "estimates",
  {
    id: serial("id").primaryKey(),
    estimateNumber: varchar("estimate_number", { length: 20 }).notNull(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),
    vehicleId: integer("vehicle_id").references(() => vehicles.id),
    laborTotal: real("labor_total").default(0),
    partsTotal: real("parts_total").default(0),
    subtotal: real("subtotal").default(0),
    taxRate: real("tax_rate").default(0),
    taxAmount: real("tax_amount").default(0),
    discountType: varchar("discount_type", { length: 10 }).default("fixed"),
    discountValue: real("discount_value").default(0),
    discountAmount: real("discount_amount").default(0),
    grandTotal: real("grand_total").default(0),
    status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, accepted, rejected, invoiced
    notes: text("notes").default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("estimates_number_idx").on(table.estimateNumber),
    index("estimates_customer_idx").on(table.customerId),
    index("estimates_vehicle_idx").on(table.vehicleId),
  ]
);

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  customer: one(customers, {
    fields: [estimates.customerId],
    references: [customers.id],
  }),
  vehicle: one(vehicles, {
    fields: [estimates.vehicleId],
    references: [vehicles.id],
  }),
  laborItems: many(estimateLabors),
  partItems: many(estimateParts),
}));

export const estimateLabors = pgTable(
  "estimate_labors",
  {
    id: serial("id").primaryKey(),
    estimateId: integer("estimate_id")
      .notNull()
      .references(() => estimates.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    hours: real("hours").default(1),
    rate: real("rate").notNull(),
    total: real("total").notNull(),
  },
  (table) => [index("estimate_labors_estimate_idx").on(table.estimateId)]
);

export const estimateLaborsRelations = relations(estimateLabors, ({ one }) => ({
  estimate: one(estimates, {
    fields: [estimateLabors.estimateId],
    references: [estimates.id],
  }),
}));

export const estimateParts = pgTable(
  "estimate_parts",
  {
    id: serial("id").primaryKey(),
    estimateId: integer("estimate_id")
      .notNull()
      .references(() => estimates.id, { onDelete: "cascade" }),
    sparePartId: integer("spare_part_id").references(() => spareParts.id),
    partName: varchar("part_name", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: real("unit_price").notNull(),
    total: real("total").notNull(),
  },
  (table) => [index("estimate_parts_estimate_idx").on(table.estimateId)]
);

export const estimatePartsRelations = relations(estimateParts, ({ one }) => ({
  estimate: one(estimates, {
    fields: [estimateParts.estimateId],
    references: [estimates.id],
  }),
  sparePart: one(spareParts, {
    fields: [estimateParts.sparePartId],
    references: [spareParts.id],
  }),
}));
