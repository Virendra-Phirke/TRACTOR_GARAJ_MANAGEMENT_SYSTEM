import { Header } from "@/components/layout/header";
import { getSpareParts, getCategories } from "@/lib/actions/inventory";
import { InventoryClient } from "@/app/(dashboard)/inventory/inventory-client";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const [parts, cats] = await Promise.all([
    getSpareParts(params.search),
    getCategories(),
  ]);

  return (
    <>
      <Header title="Inventory" />
      <div className="p-6 animate-in-page">
        <InventoryClient
          parts={parts}
          categories={cats}
          searchQuery={params.search || ""}
        />
      </div>
    </>
  );
}
