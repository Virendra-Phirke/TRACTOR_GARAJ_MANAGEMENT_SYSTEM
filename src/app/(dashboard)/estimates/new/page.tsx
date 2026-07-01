import { Header } from "@/components/layout/header";
import { getCustomers } from "@/lib/actions/customers";
import { getSpareParts } from "@/lib/actions/inventory";
import { getTaxSettings } from "@/lib/actions/settings";
import { EstimateWizard } from "./estimate-wizard";

export default async function NewEstimatePage() {
  const [customersList, partsList, taxRates] = await Promise.all([
    getCustomers(),
    getSpareParts(),
    getTaxSettings(),
  ]);

  return (
    <>
      <Header title="Create Estimate" />
      <div className="p-6 animate-in-page">
        <EstimateWizard
          customers={customersList}
          spareParts={partsList}
          taxRates={taxRates}
        />
      </div>
    </>
  );
}
