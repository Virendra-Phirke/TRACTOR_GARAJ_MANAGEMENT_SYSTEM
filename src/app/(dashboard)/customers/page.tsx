import { Header } from "@/components/layout/header";
import { getCustomers } from "@/lib/actions/customers";
import { CustomersClient } from "@/app/(dashboard)/customers/customers-client";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const customersList = await getCustomers(params.search);

  return (
    <>
      <Header title="Customers" />
      <div className="p-4 md:p-6 animate-in-page">
        <CustomersClient
          customers={customersList}
          searchQuery={params.search || ""}
        />
      </div>
    </>
  );
}
