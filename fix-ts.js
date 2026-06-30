const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const { from, to } of replacements) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(fullPath, content);
}

// 1. customers-client.tsx
replaceInFile('src/app/(dashboard)/customers/customers-client.tsx', [
  { from: '<DialogTrigger asChild>\n            <Button className="gap-2 cursor-pointer">\n              <Plus className="w-4 h-4" />\n              Add Customer\n            </Button>\n          </DialogTrigger>', to: '<DialogTrigger render={<Button className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Add Customer</Button>} />' }
]);

// 2. dashboard-client.tsx
replaceInFile('src/app/(dashboard)/dashboard-client.tsx', [
  { from: 'formatter={(value: number)', to: 'formatter={(value: any)' }
]);

// 3. expenses-client.tsx
replaceInFile('src/app/(dashboard)/expenses/expenses-client.tsx', [
  { from: '<DialogTrigger asChild>\n            <Button className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Add Expense</Button>\n          </DialogTrigger>', to: '<DialogTrigger render={<Button className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Add Expense</Button>} />' },
  { from: 'onValueChange={setCategory}', to: 'onValueChange={(v) => setCategory(v || "")}' }
]);

// 4. inventory-client.tsx
replaceInFile('src/app/(dashboard)/inventory/inventory-client.tsx', [
  { from: '<DialogTrigger asChild>\n              <Button variant="outline" className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Category</Button>\n            </DialogTrigger>', to: '<DialogTrigger render={<Button variant="outline" className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Category</Button>} />' },
  { from: '<DialogTrigger asChild>\n              <Button className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Add Part</Button>\n            </DialogTrigger>', to: '<DialogTrigger render={<Button className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Add Part</Button>} />' },
  { from: 'onValueChange={setSelectedCategory}', to: 'onValueChange={(v) => setSelectedCategory(v || "")}' }
]);

// 5. invoice-detail-client.tsx
replaceInFile('src/app/(dashboard)/invoices/[id]/invoice-detail-client.tsx', [
  { from: 'onValueChange={handleStatusChange}', to: 'onValueChange={(v) => handleStatusChange(v || "")}' }
]);

// 6. invoice-wizard.tsx
replaceInFile('src/app/(dashboard)/invoices/new/invoice-wizard.tsx', [
  { from: 'onValueChange={handleSelectCustomer}', to: 'onValueChange={(v) => handleSelectCustomer(v || "")}' },
  { from: 'onValueChange={addPartItem}', to: 'onValueChange={(v) => addPartItem(v || "")}' },
  { from: 'onValueChange={setSelectedTaxRate}', to: 'onValueChange={(v) => setSelectedTaxRate(v || "")}' },
  { from: 'onValueChange={(v) => setDiscountType(v as "fixed" | "percent")}', to: 'onValueChange={(v) => setDiscountType((v || "fixed") as "fixed" | "percent")}' },
  { from: 'onValueChange={setPaymentMethod}', to: 'onValueChange={(v) => setPaymentMethod(v || "")}' },
  { from: 'onValueChange={setPaymentStatus}', to: 'onValueChange={(v) => setPaymentStatus(v || "")}' }
]);

// 7. vehicles-client.tsx
replaceInFile('src/app/(dashboard)/vehicles/vehicles-client.tsx', [
  { from: '<DialogTrigger asChild>\n            <Button className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Add Vehicle</Button>\n          </DialogTrigger>', to: '<DialogTrigger render={<Button className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Add Vehicle</Button>} />' },
  { from: 'onValueChange={setSelectedCustomer}', to: 'onValueChange={(v) => setSelectedCustomer(v || "")}' }
]);

// 8. route.ts
replaceInFile('src/app/api/invoices/[id]/pdf/route.ts', [
  { from: 'return new NextResponse(pdfBytes,', to: 'return new NextResponse(pdfBytes as any,' }
]);

// 10. sidebar.tsx
replaceInFile('src/components/layout/sidebar.tsx', [
  { from: '<Tooltip key={item.href} delayDuration={0}>', to: '<Tooltip key={item.href}>' },
  { from: '<TooltipTrigger asChild>{linkContent}</TooltipTrigger>', to: '<TooltipTrigger render={linkContent} />' }
]);

console.log('Fixes applied successfully!');
