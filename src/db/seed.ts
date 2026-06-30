import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "@/db";
import {
  customers,
  vehicles,
  categories,
  spareParts,
  invoices,
  invoiceLabors,
  invoiceParts,
  expenses,
} from "@/db/schema";


async function seed() {
  console.log("Starting DB seeding...");

  // 1. Create Categories & Spare Parts
  const [engineCategory] = await db.insert(categories).values({ name: "Engine Parts" }).returning();
  const [oilCategory] = await db.insert(categories).values({ name: "Oils & Lubricants" }).returning();
  const [filterCategory] = await db.insert(categories).values({ name: "Filters" }).returning();

  const parts = await db.insert(spareParts).values([
    { name: "Piston Ring Set", categoryId: engineCategory.id, unit: "set" },
    { name: "Engine Oil 15W40", categoryId: oilCategory.id, unit: "liter" },
    { name: "Air Filter", categoryId: filterCategory.id, unit: "piece" },
    { name: "Fuel Filter", categoryId: filterCategory.id, unit: "piece" },
    { name: "Clutch Plate", categoryId: engineCategory.id, unit: "piece" },
  ]).returning();

  // 2. Create 5 Customers
  const createdCustomers = await db.insert(customers).values([
    { name: "Ramesh Kumar", phone: "9876543210", address: "Village A, District X", totalSpent: 4800, visitCount: 1 },
    { name: "Suresh Patil", phone: "9876543211", address: "Village B, District Y", totalSpent: 3500, visitCount: 1 },
    { name: "Anil Sharma", phone: "9876543212", address: "Village C, District X", totalSpent: 1450, visitCount: 1 },
    { name: "Vikram Singh", phone: "9876543213", address: "Village D, District Z", totalSpent: 8900, visitCount: 2 },
    { name: "Rajesh Das", phone: "9876543214", address: "Village E, District Y", totalSpent: 2200, visitCount: 1 },
  ]).returning();

  // 3. Create Vehicles for Customers
  const createdVehicles = await db.insert(vehicles).values([
    { customerId: createdCustomers[0].id, registrationNumber: "MH-12-AB-1234", brand: "Mahindra", model: "Arjun 555" },
    { customerId: createdCustomers[1].id, registrationNumber: "MH-14-CD-5678", brand: "Swaraj", model: "744 FE" },
    { customerId: createdCustomers[2].id, registrationNumber: "MH-11-EF-9012", brand: "John Deere", model: "5050 D" },
    { customerId: createdCustomers[3].id, registrationNumber: "MH-09-GH-3456", brand: "Massey Ferguson", model: "241 DI" },
    { customerId: createdCustomers[4].id, registrationNumber: "MH-10-IJ-7890", brand: "Sonalika", model: "DI 745" },
  ]).returning();

  // 4. Create Invoices (Tractor issues)
  // Issue 1: Engine Oil Change
  const [inv1] = await db.insert(invoices).values({
    invoiceNumber: "INV-202401-0001",
    customerId: createdCustomers[0].id,
    vehicleId: createdVehicles[0].id,
    laborTotal: 500,
    partsTotal: 1100,
    subtotal: 1600,
    taxRate: 5,
    taxAmount: 80,
    grandTotal: 1680,
    amountPaid: 1680,
    paymentStatus: "paid",
    paymentMethod: "cash",
  }).returning();

  await db.insert(invoiceLabors).values({ invoiceId: inv1.id, description: "Engine Oil Change & Servicing", hours: 1, rate: 500, total: 500 });
  await db.insert(invoiceParts).values({ invoiceId: inv1.id, sparePartId: parts[1].id, partName: parts[1].name, quantity: 1, unitPrice: 1100, total: 1100 });

  // Issue 2: Clutch Plate Replacement
  const [inv2] = await db.insert(invoices).values({
    invoiceNumber: "INV-202401-0002",
    customerId: createdCustomers[1].id,
    vehicleId: createdVehicles[1].id,
    laborTotal: 1500,
    partsTotal: 3200,
    subtotal: 4700,
    taxRate: 18,
    taxAmount: 846,
    grandTotal: 5546,
    amountPaid: 3000,
    paymentStatus: "partial",
    paymentMethod: "upi",
    notes: "Pending amount to be paid next week.",
  }).returning();

  await db.insert(invoiceLabors).values({ invoiceId: inv2.id, description: "Clutch Plate Assembly Replacement", hours: 3, rate: 500, total: 1500 });
  await db.insert(invoiceParts).values({ invoiceId: inv2.id, sparePartId: parts[4].id, partName: parts[4].name, quantity: 1, unitPrice: 3200, total: 3200 });

  // Issue 3: Routine Filter Changes
  const [inv3] = await db.insert(invoices).values({
    invoiceNumber: "INV-202401-0003",
    customerId: createdCustomers[2].id,
    vehicleId: createdVehicles[2].id,
    laborTotal: 300,
    partsTotal: 630,
    subtotal: 930,
    taxRate: 0,
    taxAmount: 0,
    grandTotal: 930,
    amountPaid: 930,
    paymentStatus: "paid",
    paymentMethod: "cash",
  }).returning();

  await db.insert(invoiceLabors).values({ invoiceId: inv3.id, description: "Filter Replacements", hours: 1, rate: 300, total: 300 });
  await db.insert(invoiceParts).values([
    { invoiceId: inv3.id, sparePartId: parts[2].id, partName: parts[2].name, quantity: 1, unitPrice: 350, total: 350 },
    { invoiceId: inv3.id, sparePartId: parts[3].id, partName: parts[3].name, quantity: 1, unitPrice: 280, total: 280 }
  ]);

  // Issue 4: Engine Overhaul (Unpaid)
  const [inv4] = await db.insert(invoices).values({
    invoiceNumber: "INV-202401-0004",
    customerId: createdCustomers[3].id,
    vehicleId: createdVehicles[3].id,
    laborTotal: 4000,
    partsTotal: 1800,
    subtotal: 5800,
    taxRate: 18,
    taxAmount: 1044,
    grandTotal: 6844,
    amountPaid: 0,
    paymentStatus: "unpaid",
    paymentMethod: "cash",
  }).returning();

  await db.insert(invoiceLabors).values({ invoiceId: inv4.id, description: "Complete Engine Overhaul", hours: 8, rate: 500, total: 4000 });
  await db.insert(invoiceParts).values({ invoiceId: inv4.id, sparePartId: parts[0].id, partName: parts[0].name, quantity: 1, unitPrice: 1800, total: 1800 });

  // 5. Create Expenses
  await db.insert(expenses).values([
    { category: "Rent", description: "Monthly Shop Rent", amount: 15000, paymentMethod: "upi", date: new Date() },
    { category: "Electricity", description: "Power Bill for Jan", amount: 2400, paymentMethod: "cash", date: new Date() },
    { category: "Tools", description: "New Wrench Set", amount: 1200, paymentMethod: "cash", date: new Date() },
    { category: "Salary", description: "Mechanic Helper Wages", amount: 8000, paymentMethod: "upi", date: new Date() },
    { category: "Maintenance", description: "Air Compressor Repair", amount: 850, paymentMethod: "cash", date: new Date() },
  ]);

  console.log("Database seeded successfully!");
}

seed()
  .catch((e) => console.error(e))
  .finally(() => process.exit(0));
