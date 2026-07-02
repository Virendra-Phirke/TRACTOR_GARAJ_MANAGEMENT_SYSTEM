import { Header } from "@/components/layout/header";
import { getCustomers } from "@/lib/actions/customers";
import { getSpareParts } from "@/lib/actions/inventory";
import { getTaxSettings } from "@/lib/actions/settings";
import { EditInvoiceWizard } from "./edit-invoice-wizard";
import { getInvoiceById } from "@/lib/actions/invoices";
import { notFound } from "next/navigation";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(Number(id));
  if (!invoice) notFound();

  const [customers, spareParts, taxRates] = await Promise.all([
    getCustomers(),
    getSpareParts(),
    getTaxSettings(),
  ]);

  return (
    <>
      <Header title={`Edit Invoice #${invoice.invoiceNumber}`} />
      <div className="p-4 sm:p-6 lg:p-8 animate-in-page">
        <EditInvoiceWizard 
          customers={customers} 
          spareParts={spareParts} 
          taxRates={taxRates} 
          invoice={invoice}
        />
      </div>
    </>
  );
}
