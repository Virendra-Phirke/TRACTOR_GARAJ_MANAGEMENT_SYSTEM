import { Header } from "@/components/layout/header";
import { getVehicles } from "@/lib/actions/vehicles";
import { getCustomers } from "@/lib/actions/customers";
import { VehiclesClient } from "./vehicles-client";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const [vehiclesList, customersList] = await Promise.all([
    getVehicles(params.search),
    getCustomers(),
  ]);

  return (
    <>
      <Header title="Vehicles" />
      <div className="p-6 animate-in-page">
        <VehiclesClient
          vehicles={vehiclesList}
          customers={customersList}
          searchQuery={params.search || ""}
        />
      </div>
    </>
  );
}
