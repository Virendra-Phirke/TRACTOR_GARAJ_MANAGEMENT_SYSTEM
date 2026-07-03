import { Header } from "@/components/layout/header";
import { getReportStats } from "@/lib/actions/invoices";
import { getExpenseStats } from "@/lib/actions/expenses";
import { ReportsClient } from "./reports-client";
import { Suspense } from "react";
import { getISTDayBounds } from "@/lib/utils";

export default async function ReportsPage(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const searchParams = await props.searchParams;

  // Calculate the expense date range to match the report range
  let expenseFrom: Date;
  let expenseTo: Date;
  if (searchParams?.from && searchParams?.to) {
    const { start } = getISTDayBounds(searchParams.from);
    const { end } = getISTDayBounds(searchParams.to);
    expenseFrom = start;
    expenseTo = end;
  } else {
    // Default to today
    const { start, end } = getISTDayBounds();
    expenseFrom = start;
    expenseTo = end;
  }

  const [stats, expenses] = await Promise.all([
    getReportStats(searchParams?.from, searchParams?.to),
    getExpenseStats(expenseFrom, expenseTo),
  ]);

  return (
    <>
      <Header title="Reports" />
      <div className="p-4 md:p-6 animate-in-page">
        <Suspense fallback={<div>Loading reports...</div>}>
          <ReportsClient stats={stats} expenses={expenses} />
        </Suspense>
      </div>
    </>
  );
}
