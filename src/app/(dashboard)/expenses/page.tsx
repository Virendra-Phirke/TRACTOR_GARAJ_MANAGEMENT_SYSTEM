import { Header } from "@/components/layout/header";
import { getExpenses } from "@/lib/actions/expenses";
import { getRecentInvoicesWithParts } from "@/lib/actions/invoices";
import { ExpensesClient } from "@/app/(dashboard)/expenses/expenses-client";

export default async function ExpensesPage() {
  const [expensesList, recentInvoices] = await Promise.all([
    getExpenses(),
    getRecentInvoicesWithParts(),
  ]);

  return (
    <>
      <Header title="Expenses" />
      <div className="p-4 md:p-6 animate-in-page">
        <ExpensesClient expenses={expensesList} recentInvoices={recentInvoices} />
      </div>
    </>
  );
}
