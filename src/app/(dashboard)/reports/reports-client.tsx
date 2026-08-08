"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Clock,
  Banknote,
  Smartphone,
  Wrench,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";

interface ReportStats {
  totalRevenue: number;
  totalCollected: number;
  totalCash: number;
  totalUpi: number;
  totalDiscount: number;
  totalTax: number;
  invoiceCount: number;
  avgInvoice: number;
  maxInvoice: number;
  minInvoice: number;
  statusBreakdown: Record<string, { count: number; total: number }>;
  paymentMethodBreakdown: Record<string, { count: number; total: number }>;
  laborTotal: number;
  partsTotal: number;
  pendingAmount: number;
  pendingCount: number;
  dailyData: { date: string; revenue: number; bills: number }[];
}

function fmt(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtDecimal(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ReportsClient({
  stats,
  expenses,
}: {
  stats: ReportStats;
  expenses: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFrom = searchParams.get("from");
  const initialTo = searchParams.get("to");

  const isToday = !initialFrom && !initialTo;
  const rangeLabel = isToday ? "Today" : "Selected Range";

  const [date, setDate] = useState<DateRange | undefined>({
    from: initialFrom ? new Date(initialFrom) : undefined,
    to: initialTo ? new Date(initialTo) : undefined,
  });

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(initialFrom ? new Date(initialFrom).getMonth() : now.getMonth());
  const [filterYear, setFilterYear] = useState(initialFrom ? new Date(initialFrom).getFullYear() : now.getFullYear());
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const availableYears = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  const handleMonthYearChange = (m: number, y: number) => {
    setFilterMonth(m);
    setFilterYear(y);
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    setDate({ from: start, to: end });
    const params = new URLSearchParams();
    params.set("from", start.toISOString());
    params.set("to", end.toISOString());
    router.push(`/reports?${params.toString()}`);
  };

  const handleDateChange = (d: DateRange | undefined) => {
    setDate(d);
    const params = new URLSearchParams();
    if (d?.from) params.set("from", d.from.toISOString());
    if (d?.to) params.set("to", d.to.toISOString());
    router.push(`/reports?${params.toString()}`);
  };

  const handleClear = () => {
    setDate(undefined);
    setFilterMonth(now.getMonth());
    setFilterYear(now.getFullYear());
    router.push("/reports");
  };

  const profit = stats.totalRevenue - expenses;
  const paidCount = stats.statusBreakdown["paid"]?.count || 0;
  const unpaidCount = stats.statusBreakdown["unpaid"]?.count || 0;
  const partialCount = stats.statusBreakdown["partial"]?.count || 0;
  const paidTotal = stats.statusBreakdown["paid"]?.total || 0;
  const unpaidTotal = stats.statusBreakdown["unpaid"]?.total || 0;
  const partialTotal = stats.statusBreakdown["partial"]?.total || 0;

  const cashMethodTotal = stats.paymentMethodBreakdown["cash"]?.total || 0;
  const upiMethodTotal = stats.paymentMethodBreakdown["upi"]?.total || 0;
  const splitMethodTotal = stats.paymentMethodBreakdown["split"]?.total || 0;

  const revenueTotal = stats.laborTotal + stats.partsTotal;
  const laborPercent = revenueTotal > 0 ? (stats.laborTotal / revenueTotal) * 100 : 0;
  const partsPercent = revenueTotal > 0 ? (stats.partsTotal / revenueTotal) * 100 : 0;

  return (
    <div className="space-y-6 block-stagger">
      {/* ── Header with Date Picker ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {rangeLabel} — {stats.invoiceCount} invoice{stats.invoiceCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterMonth.toString()} onValueChange={(v) => handleMonthYearChange(Number(v), filterYear)}>
            <SelectTrigger className="w-[120px] h-9 text-xs">
              {monthNames[filterMonth]}
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear.toString()} onValueChange={(v) => handleMonthYearChange(filterMonth, Number(v))}>
            <SelectTrigger className="w-[90px] h-9 text-xs">
              {filterYear}
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DatePickerWithRange date={date} setDate={handleDateChange} onClear={handleClear} />
        </div>
      </div>

      {/* ── Top Row: 4 Key Metric Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="bg-card/50 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue</p>
                <p className="text-2xl font-bold mt-2">{fmt(stats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.invoiceCount} invoices
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collected */}
        <Card className="bg-card/50 border-blue-400/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Collected</p>
                <p className="text-2xl font-bold mt-2">{fmt(stats.totalCollected)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {paidCount} paid invoices
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="bg-card/50 border-red-400/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Expenses</p>
                <p className="text-2xl font-bold mt-2">{fmt(expenses)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="bg-card/50 border-purple-400/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Est. Profit</p>
                <p className={`text-2xl font-bold mt-2 ${profit >= 0 ? "text-primary" : "text-destructive"}`}>
                  {fmt(profit)}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {profit >= 0 ? <ArrowUpRight className="w-3 h-3 text-primary" /> : <ArrowDownRight className="w-3 h-3 text-destructive" />}
                  Revenue − Expenses
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue Chart ──────────────────────────────────────────── */}
      {stats.dailyData.length > 1 && (
        <div className="block-section">
          <div className="block-label">Daily Revenue</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyData}>
                <defs>
                  <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => { try { return format(new Date(v), "dd MMM"); } catch { return v; } }}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px", color: "var(--foreground)" }}
                  formatter={(value: any) => [fmt(Number(value)), "Revenue"]}
                  labelFormatter={(label) => { try { return format(new Date(label), "dd MMM yyyy"); } catch { return label; } }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#reportGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Invoice Stats Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="block-section">
          <div className="block-label">Average Invoice</div>
          <p className="text-xl font-bold">{fmtDecimal(stats.avgInvoice)}</p>
        </div>
        <div className="block-section">
          <div className="block-label">Highest Invoice</div>
          <p className="text-xl font-bold">{fmtDecimal(stats.maxInvoice)}</p>
        </div>
        <div className="block-section">
          <div className="block-label">Lowest Invoice</div>
          <p className="text-xl font-bold">{fmtDecimal(stats.minInvoice)}</p>
        </div>
      </div>

      {/* ── Payment Status + Method ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Status Breakdown */}
        <div className="block-section">
          <div className="block-label">Payment Status</div>
          <div className="space-y-3">
            {/* Paid */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-sm">Paid</span>
                <span className="text-xs text-muted-foreground">({paidCount})</span>
              </div>
              <span className="text-sm font-medium">{fmt(paidTotal)}</span>
            </div>
            {/* Partial */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                <span className="text-sm">Partial</span>
                <span className="text-xs text-muted-foreground">({partialCount})</span>
              </div>
              <span className="text-sm font-medium">{fmt(partialTotal)}</span>
            </div>
            {/* Unpaid */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
                <span className="text-sm">Unpaid</span>
                <span className="text-xs text-muted-foreground">({unpaidCount})</span>
              </div>
              <span className="text-sm font-medium">{fmt(unpaidTotal)}</span>
            </div>
          </div>
          {/* Visual bar */}
          {stats.invoiceCount > 0 && (
            <div className="mt-4 h-2 rounded-full overflow-hidden flex bg-accent/20">
              {paidCount > 0 && <div className="bg-primary" style={{ width: `${(paidCount / stats.invoiceCount) * 100}%` }} />}
              {partialCount > 0 && <div className="bg-primary/60" style={{ width: `${(partialCount / stats.invoiceCount) * 100}%` }} />}
              {unpaidCount > 0 && <div className="bg-muted-foreground" style={{ width: `${(unpaidCount / stats.invoiceCount) * 100}%` }} />}
            </div>
          )}
        </div>

        {/* Payment Method Breakdown */}
        <div className="block-section">
          <div className="block-label">Collection Method</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-primary" />
                <span className="text-sm">Cash</span>
              </div>
              <span className="text-sm font-medium">{fmt(stats.totalCash)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary/70" />
                <span className="text-sm">UPI</span>
              </div>
              <span className="text-sm font-medium">{fmt(stats.totalUpi)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Labor vs Parts Breakdown ───────────────────────────────── */}
      <div className="block-section">
        <div className="block-label">Revenue Breakdown</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Labor</p>
              <p className="text-lg font-bold">{fmt(stats.laborTotal)}</p>
              <p className="text-xs text-muted-foreground">{laborPercent.toFixed(0)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Parts</p>
              <p className="text-lg font-bold">{fmt(stats.partsTotal)}</p>
              <p className="text-xs text-muted-foreground">{partsPercent.toFixed(0)}%</p>
            </div>
          </div>
        </div>
        {/* Visual bar */}
        {revenueTotal > 0 && (
          <div className="mt-4 h-2 rounded-full overflow-hidden flex bg-accent/20">
            <div className="bg-primary" style={{ width: `${laborPercent}%` }} />
            <div className="bg-primary/40" style={{ width: `${partsPercent}%` }} />
          </div>
        )}
      </div>

      {/* ── Tax & Discount Summary ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="block-section">
          <div className="block-label">Tax Collected</div>
          <p className="text-xl font-bold">{fmtDecimal(stats.totalTax)}</p>
        </div>
        <div className="block-section">
          <div className="block-label">Total Discounts Given</div>
          <p className="text-xl font-bold text-primary">{fmtDecimal(stats.totalDiscount)}</p>
        </div>
      </div>

      {/* ── Pending Payments (Global) ──────────────────────────────── */}
      <div className="block-section-elevated">
        <div className="flex items-center justify-between">
          <div>
            <div className="block-label">Outstanding Payments</div>
            <p className="text-xs text-muted-foreground">All unpaid + partial invoices (not date-filtered)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-muted-foreground/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-3">
          <p className="text-3xl font-bold text-muted-foreground">{fmt(stats.pendingAmount)}</p>
          <p className="text-sm text-muted-foreground">{stats.pendingCount} invoices</p>
        </div>
      </div>
    </div>
  );
}
