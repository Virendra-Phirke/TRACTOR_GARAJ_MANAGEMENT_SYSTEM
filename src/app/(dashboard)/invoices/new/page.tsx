import { Header } from "@/components/layout/header";
import { getCustomers } from "@/lib/actions/customers";
import { getSpareParts } from "@/lib/actions/inventory";
import { getTaxSettings } from "@/lib/actions/settings";
import { InvoiceWizard } from "./invoice-wizard";

export default async function NewInvoicePage() {
  const [customersList, partsList, taxRates] = await Promise.all([
    getCustomers(),
    getSpareParts(),
    getTaxSettings(),
  ]);

  return (
    <>
      <Header title="Create Invoice" />
      <div className="p-4 md:p-6 animate-in-page">
        <InvoiceWizard
          customers={customersList}
          spareParts={partsList}
          taxRates={taxRates}
        />
      </div>
    </>
  );
}
