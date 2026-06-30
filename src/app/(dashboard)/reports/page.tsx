import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/actions/invoices";
import { getExpenseStats } from "@/lib/actions/expenses";
import { IndianRupee, TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default async function ReportsPage() {
  const stats = await getDashboardStats();

  // This month's expenses
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const monthlyExpenses = await getExpenseStats(monthStart, monthEnd);
  const monthlyProfit = stats.totalRevenue - monthlyExpenses;

  return (
    <>
      <Header title="Reports" />
      <div className="p-6 animate-in-page space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-emerald-400/20">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Total Revenue</p>
                  <p className="text-2xl font-bold mt-2">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-blue-400/20">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Today&apos;s Revenue</p>
                  <p className="text-2xl font-bold mt-2">₹{stats.todayRevenue.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.todayBills} bills</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-red-400/20">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Monthly Expenses</p>
                  <p className="text-2xl font-bold mt-2">₹{monthlyExpenses.toLocaleString("en-IN")}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-purple-400/20">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Est. Profit</p>
                  <p className={`text-2xl font-bold mt-2 ${monthlyProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ₹{monthlyProfit.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50">
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Pending Payments</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-3xl font-bold text-amber-400">₹{stats.pendingAmount.toLocaleString("en-IN")}</p>
              <p className="text-sm text-muted-foreground mt-1">{stats.pendingCount} unpaid invoices</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
