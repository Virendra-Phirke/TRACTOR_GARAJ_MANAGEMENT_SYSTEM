import { Header } from "@/components/layout/header";
import { getEstimates } from "@/lib/actions/estimates";
import { EstimatesClient } from "./estimates-client";

export default async function EstimatesPage() {
  const estimates = await getEstimates();

  return (
    <>
      <Header title="Estimates" />
      <div className="p-6 animate-in-page">
        <EstimatesClient estimates={estimates} />
      </div>
    </>
  );
}
