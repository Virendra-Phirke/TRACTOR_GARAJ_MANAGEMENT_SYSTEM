import { Header } from "@/components/layout/header";
import { getDashboardStats } from "@/lib/actions/invoices";
import { getLowStockParts } from "@/lib/actions/inventory";
import { getCustomerCount } from "@/lib/actions/customers";
import { getLastBackupDate } from "@/lib/actions/backups";
import { DashboardClient } from "./dashboard-client";
import { Suspense } from "react";

export default async function DashboardPage(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const searchParams = await props.searchParams;
  const [stats, lowStock, customerCount, lastBackupDate] = await Promise.all([
    getDashboardStats(searchParams?.from, searchParams?.to),
    getLowStockParts(),
    getCustomerCount(),
    getLastBackupDate(),
  ]);

  return (
    <>
      <Header title="Dashboard" />
      <div className="p-4 md:p-6 animate-in-page">
        <Suspense fallback={<div>Loading dashboard...</div>}>
          <DashboardClient
            stats={stats}
            lowStock={lowStock}
            customerCount={customerCount}
            lastBackupDate={lastBackupDate}
          />
        </Suspense>
      </div>
    </>
  );
}
