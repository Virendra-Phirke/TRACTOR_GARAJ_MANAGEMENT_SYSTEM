const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../src/app/(dashboard)/estimates/[id]/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf-8');
pageContent = pageContent.replace(/InvoiceDetailClient/g, 'EstimateDetailClient');
pageContent = pageContent.replace(/invoice-detail-client/g, 'estimate-detail-client');
pageContent = pageContent.replace(/getInvoiceById/g, 'getEstimateById');
pageContent = pageContent.replace(/invoices/g, 'estimates');
pageContent = pageContent.replace(/Invoice/g, 'Estimate');
pageContent = pageContent.replace(/invoice/g, 'estimate');
fs.writeFileSync(pagePath, pageContent);

const detailPath = path.join(__dirname, '../src/app/(dashboard)/estimates/[id]/estimate-detail-client.tsx');
let detailContent = fs.readFileSync(detailPath, 'utf-8');
detailContent = detailContent.replace(/InvoiceDetailClient/g, 'EstimateDetailClient');
detailContent = detailContent.replace(/Invoice/g, 'Estimate');
detailContent = detailContent.replace(/invoice/g, 'estimate');
detailContent = detailContent.replace(/getEstimateById/g, 'getEstimateById');
detailContent = detailContent.replace(/invoices/g, 'estimates');

// Remove updatePaymentStatus and related modal stuff
detailContent = detailContent.replace(/import \{ updatePaymentStatus(.*)/g, 'import { updateEstimateStatus } from "@/lib/actions/estimates";\nimport { useRouter } from "next/navigation";');
detailContent = detailContent.replace(/import \{ useRouter \} from "next\/navigation";/g, '');

fs.writeFileSync(detailPath, detailContent);
console.log('Replacement complete.');
