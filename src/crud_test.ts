import { db } from './db';
import { invoices, invoiceLabors, invoiceParts, spareParts, customers, vehicles } from './db/schema';
import { createInvoice } from './lib/actions/invoices';
import { updateInvoice } from './lib/actions/invoices-edit';
import { deleteInvoice } from './lib/actions/invoices';
import { eq } from 'drizzle-orm';

async function testCrud() {
  console.log('--- 1. PREPARING TEST DATA ---');
  // Get an existing customer and vehicle
  const [cust] = await db.select().from(customers).limit(1);
  if (!cust) throw new Error('No customer found');
  const [veh] = await db.select().from(vehicles).where(eq(vehicles.customerId, cust.id)).limit(1);
  const [part] = await db.select().from(spareParts).limit(1);
  if (!part) throw new Error('No spare part found');

  const initialStock = part.stock || 0;
  console.log('Customer:', cust.name, 'Part:', part.name, 'Initial Stock:', initialStock);

  console.log('\n--- 2. TESTING CREATE INVOICE ---');
  const createdInvoice = await createInvoice({
    customerId: cust.id,
    vehicleId: veh?.id || null,
    laborItems: [{ description: 'Oil Service Test', hours: 1, rate: 500 }],
    partItems: [{ sparePartId: part.id, partName: part.name, quantity: 2, unitPrice: 300 }],
    taxRate: 18,
    discountType: 'fixed',
    discountValue: 0,
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    amountPaid: 0,
    notes: 'Automated CRUD test invoice',
  });
  const invoiceId = createdInvoice.id;
  console.log('Created Invoice ID:', invoiceId);

  // Check stock deducted
  const [partAfterCreate] = await db.select().from(spareParts).where(eq(spareParts.id, part.id)).limit(1);
  console.log('Stock after creation (expected -2):', partAfterCreate.stock);

  console.log('\n--- 3. TESTING UPDATE / EDIT INVOICE ---');
  await updateInvoice(invoiceId, {
    customerId: cust.id,
    vehicleId: veh?.id || null,
    laborItems: [{ description: 'Engine Tuneup', hours: 2, rate: 800 }],
    partItems: [{ sparePartId: part.id, partName: part.name, quantity: 1, unitPrice: 300 }], // changed qty from 2 to 1
    taxRate: 18,
    discountType: 'fixed',
    discountValue: 50,
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    amountPaid: 0,
    notes: 'Updated via CRUD test',
  });
  console.log('UpdateInvoice SUCCESS!');

  // Check stock after update: should be initialStock - 1
  const [partAfterEdit] = await db.select().from(spareParts).where(eq(spareParts.id, part.id)).limit(1);
  console.log('Stock after edit (expected initial - 1):', partAfterEdit.stock);

  console.log('\n--- 4. TESTING DELETE INVOICE ---');
  await deleteInvoice(invoiceId);
  console.log('DeleteInvoice SUCCESS!');

  // Check stock restored
  const [partAfterDelete] = await db.select().from(spareParts).where(eq(spareParts.id, part.id)).limit(1);
  console.log('Stock after delete (expected restored to initial):', partAfterDelete.stock);
  if (partAfterDelete.stock !== initialStock) {
    console.error('Stock mismatch!', { initialStock, current: partAfterDelete.stock });
  } else {
    console.log('Stock perfectly restored!');
  }

  // Check invoice is gone
  const [deletedInv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  console.log('Invoice in DB after delete:', deletedInv ? 'STILL EXISTS' : 'CONFIRMED DELETED');

  console.log('\n--- ALL CRUD TESTS PASSED SUCCESSFULLY! ---');
}

testCrud().catch(console.error).finally(() => process.exit(0));
