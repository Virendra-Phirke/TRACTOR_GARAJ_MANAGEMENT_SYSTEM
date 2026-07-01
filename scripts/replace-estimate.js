const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../src/app/(dashboard)/estimates/new/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf-8');
pageContent = pageContent.replace(/InvoiceWizard/g, 'EstimateWizard');
pageContent = pageContent.replace(/invoices\/new\/invoice-wizard/g, 'estimates/new/estimate-wizard');
pageContent = pageContent.replace(/New Invoice/g, 'New Estimate');
fs.writeFileSync(pagePath, pageContent);

const wizardPath = path.join(__dirname, '../src/app/(dashboard)/estimates/new/estimate-wizard.tsx');
let wizardContent = fs.readFileSync(wizardPath, 'utf-8');
wizardContent = wizardContent.replace(/InvoiceWizard/g, 'EstimateWizard');
wizardContent = wizardContent.replace(/createInvoice/g, 'createEstimate');
wizardContent = wizardContent.replace(/lib\/actions\/invoices/g, 'lib/actions/estimates');
wizardContent = wizardContent.replace(/Invoice/g, 'Estimate');
wizardContent = wizardContent.replace(/invoice/g, 'estimate');
// Ensure CreateEstimateData is imported
wizardContent = wizardContent.replace(/CreateEstimateData/g, 'CreateEstimateData');
// Wait, the action `createEstimate` doesn't have `paymentStatus`, `paymentMethod`, `amountPaid`. 
// Let's remove them from the submit payload.
wizardContent = wizardContent.replace(/paymentStatus:(.*?),/g, '');
wizardContent = wizardContent.replace(/paymentMethod:(.*?),/g, '');
wizardContent = wizardContent.replace(/amountPaid:(.*?),/g, '');

// Also remove them from the form state if they exist.
wizardContent = wizardContent.replace(/const \[paymentStatus(.*)/g, '');
wizardContent = wizardContent.replace(/const \[paymentMethod(.*)/g, '');
wizardContent = wizardContent.replace(/const \[amountPaid(.*)/g, '');

fs.writeFileSync(wizardPath, wizardContent);
console.log('Replacement complete.');
