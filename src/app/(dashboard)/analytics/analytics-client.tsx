"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { format, subDays, startOfYear, isAfter, parseISO } from "date-fns";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Banknote,
  ScrollText,
  IndianRupee,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Invoice = any;
type Customer = any;
type Vehicle = any;
type Expense = any;

interface AnalyticsClientProps {
  data: {
    invoices: Invoice[];
    customers: Customer[];
    vehicles: Vehicle[];
    expenses: Expense[];
  };
}

const TIME_RANGES = [
  { value: "all", label: "All Time" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "this_year", label: "This Year" },
];

// Vibrant colors that are clearly visible on dark backgrounds
const CHART_COLORS = ["#22d3ee", "#a78bfa", "#fb923c", "#34d399", "#f472b6"];
const EXPENSE_COLORS = ["#f87171", "#fb923c", "#fbbf24", "#4ade80", "#60a5fa", "#c084fc", "#f472b6"];

function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function AnalyticsClient({ data }: AnalyticsClientProps) {
  const [timeRange, setTimeRange] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");

  const customerOptions = useMemo(() => {
    return data.customers.map((c) => ({
      value: c.id.toString(),
      label: c.name,
    }));
  }, [data.customers]);

  const vehicleOptions = useMemo(() => {
    let vehicles = data.vehicles;
    if (selectedCustomer) {
      vehicles = vehicles.filter((v) => v.customerId?.toString() === selectedCustomer);
    }
    return vehicles.map((v) => ({
      value: v.id.toString(),
      label: `${v.registrationNumber} (${v.brand})`,
    }));
  }, [data.vehicles, selectedCustomer]);

  const handleCustomerChange = useCallback((customerId: string) => {
    setSelectedCustomer(customerId);
    if (customerId) {
      const customerVehicles = data.vehicles.filter((v) => v.customerId?.toString() === customerId);
      if (customerVehicles.length === 1) {
        setSelectedVehicle(customerVehicles[0].id.toString());
      } else if (!customerVehicles.find(v => v.id.toString() === selectedVehicle)) {
        setSelectedVehicle(""); // Clear vehicle if it doesn't belong to the new customer
      }
    }
  }, [data.vehicles, selectedVehicle]);

  const hasFilters = timeRange !== "all" || selectedCustomer || selectedVehicle;

  const resetFilters = useCallback(() => {
    setTimeRange("all");
    setSelectedCustomer("");
    setSelectedVehicle("");
  }, []);

  // Filtering Logic
  const getThresholdDate = useCallback((range: string) => {
    const now = new Date();
    if (range === "7d") return subDays(now, 7);
    if (range === "30d") return subDays(now, 30);
    if (range === "90d") return subDays(now, 90);
    if (range === "this_year") return startOfYear(now);
    return new Date(0);
  }, []);

  const filteredInvoices = useMemo(() => {
    let filtered = data.invoices;
    if (timeRange !== "all") {
      const thresholdDate = getThresholdDate(timeRange);
      filtered = filtered.filter((inv) => isAfter(new Date(inv.createdAt), thresholdDate));
    }
    if (selectedCustomer) filtered = filtered.filter((inv) => inv.customerId?.toString() === selectedCustomer);
    if (selectedVehicle) filtered = filtered.filter((inv) => inv.vehicleId?.toString() === selectedVehicle);
    return filtered;
  }, [data.invoices, timeRange, selectedCustomer, selectedVehicle, getThresholdDate]);

  const filteredExpenses = useMemo(() => {
    if (selectedCustomer || selectedVehicle) return []; // Expenses are global, don't show when filtering by customer/vehicle
    let filtered = data.expenses;
    if (timeRange !== "all") {
      const thresholdDate = getThresholdDate(timeRange);
      filtered = filtered.filter((exp) => isAfter(new Date(exp.date), thresholdDate));
    }
    return filtered;
  }, [data.expenses, timeRange, selectedCustomer, selectedVehicle, getThresholdDate]);

  // KPIs - calculated with proper types
  const totalRevenue = useMemo(() => 
    filteredInvoices.reduce((sum, inv) => sum + Number(inv.amountPaid || 0), 0), 
    [filteredInvoices]
  );
  const totalBilled = useMemo(() =>
    filteredInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0),
    [filteredInvoices]
  );
  const outstanding = Math.max(0, totalBilled - totalRevenue);
  const totalExpenses = useMemo(() =>
    filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0),
    [filteredExpenses]
  );
  const netProfit = totalRevenue - totalExpenses;
  const paidInvoiceCount = useMemo(() => 
    filteredInvoices.filter((i) => i.paymentStatus === "paid" || i.paymentStatus === "partial").length,
    [filteredInvoices]
  );
  const unpaidInvoiceCount = useMemo(() =>
    filteredInvoices.filter((i) => i.paymentStatus === "unpaid").length,
    [filteredInvoices]
  );

  // Revenue Over Time – proper date sorting
  const revenueChartData = useMemo(() => {
    const grouped: Record<string, { revenue: number; timestamp: number }> = {};
    filteredInvoices.forEach((inv) => {
      const date = new Date(inv.createdAt);
      const dateStr = format(date, "dd MMM");
      if (!grouped[dateStr]) {
        grouped[dateStr] = { revenue: 0, timestamp: date.getTime() };
      }
      grouped[dateStr].revenue += Number(inv.grandTotal || 0);
    });
    return Object.entries(grouped)
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .map(([date, val]) => ({ date, revenue: Math.round(val.revenue) }));
  }, [filteredInvoices]);

  // Top 5 Customers
  const topCustomersData = useMemo(() => {
    const customerMap = new Map<number, string>();
    data.customers.forEach((c) => customerMap.set(c.id, c.name));
    
    const customerTotals: Record<string, number> = {};
    filteredInvoices.forEach((inv) => {
      const name = customerMap.get(inv.customerId) || "Unknown";
      customerTotals[name] = (customerTotals[name] || 0) + Number(inv.grandTotal || 0);
    });
    return Object.entries(customerTotals)
      .map(([name, amount]) => ({ name: name.length > 14 ? name.slice(0, 12) + "…" : name, amount: Math.round(amount), fullName: name }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredInvoices, data.customers]);

  // Expenses by Category
  const expensesByCategoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      const cat = exp.category || "Uncategorized";
      categories[cat] = (categories[cat] || 0) + Number(exp.amount || 0);
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Monthly Revenue vs Expenses
  const monthlyComparisonData = useMemo(() => {
    const months: Record<string, { revenue: number; expenses: number; timestamp: number }> = {};
    filteredInvoices.forEach((inv) => {
      const date = new Date(inv.createdAt);
      const key = format(date, "MMM yy");
      if (!months[key]) months[key] = { revenue: 0, expenses: 0, timestamp: date.getTime() };
      months[key].revenue += Number(inv.grandTotal || 0);
    });
    filteredExpenses.forEach((exp) => {
      const date = new Date(exp.date);
      const key = format(date, "MMM yy");
      if (!months[key]) months[key] = { revenue: 0, expenses: 0, timestamp: date.getTime() };
      months[key].expenses += Number(exp.amount || 0);
    });
    return Object.entries(months)
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .map(([month, val]) => ({
        month,
        revenue: Math.round(val.revenue),
        expenses: Math.round(val.expenses),
      }));
  }, [filteredInvoices, filteredExpenses]);

  // Invoice status breakdown
  const invoiceStatusData = useMemo(() => {
    const statuses: Record<string, number> = {};
    filteredInvoices.forEach((inv) => {
      const status = inv.paymentStatus || "unknown";
      statuses[status] = (statuses[status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [filteredInvoices]);

  const STATUS_COLORS: Record<string, string> = {
    Paid: "#4ade80",
    Partial: "#fbbf24",
    Unpaid: "#f87171",
    Unknown: "#94a3b8",
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-2xl text-sm">
          <p className="font-semibold text-foreground mb-1.5">{label || payload[0]?.payload?.fullName || payload[0].name}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="flex items-center gap-2 text-foreground/90">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
              <span className="text-muted-foreground capitalize">{p.name}:</span>
              <span className="font-semibold ml-auto">₹{Number(p.value).toLocaleString("en-IN")}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-2xl text-sm">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-muted-foreground">
            {payload[0].payload?.value !== undefined && typeof payload[0].value === "number" && payload[0].value > 100
              ? `₹${Number(payload[0].value).toLocaleString("en-IN")}`
              : `${payload[0].value} invoices`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card/80 p-4 rounded-xl border border-border/40 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground ml-1">Time Range</label>
          <Combobox options={TIME_RANGES} value={timeRange} onChange={setTimeRange} placeholder="Select time range..." />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground ml-1">Customer</label>
          <Combobox options={customerOptions} value={selectedCustomer} onChange={handleCustomerChange} placeholder="All Customers..." searchPlaceholder="Search customer..." emptyText="No customer found." />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground ml-1">Vehicle</label>
          <Combobox options={vehicleOptions} value={selectedVehicle} onChange={setSelectedVehicle} placeholder="All Vehicles..." searchPlaceholder="Search vehicle..." emptyText="No vehicle found." />
        </div>
        <div className="flex items-end">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-foreground cursor-pointer gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <Card className="bg-card border-border/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Banknote className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-primary tracking-tight">₹{totalRevenue.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {paidInvoiceCount} paid invoice{paidInvoiceCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Total Billed */}
        <Card className="bg-card border-border/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <ScrollText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-primary tracking-tight">₹{totalBilled.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {filteredInvoices.length} total invoice{filteredInvoices.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="bg-card border-border/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${netProfit >= 0 ? "from-primary/5" : "from-destructive/5"} to-transparent`} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            <div className={`h-8 w-8 rounded-lg ${netProfit >= 0 ? "bg-primary/15" : "bg-destructive/15"} flex items-center justify-center`}>
              {netProfit >= 0 ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className={`text-2xl font-bold tracking-tight ${netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
              {netProfit < 0 && "-"}₹{Math.abs(netProfit).toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              {netProfit >= 0 ? <ArrowUpRight className="w-3 h-3 text-primary" /> : <ArrowDownRight className="w-3 h-3 text-destructive" />}
              Revenue − ₹{totalExpenses.toLocaleString("en-IN")} expenses
            </p>
          </CardContent>
        </Card>

        {/* Outstanding */}
        <Card className="bg-card border-border/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-muted-foreground/15 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-muted-foreground tracking-tight">₹{outstanding.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {unpaidInvoiceCount} unpaid invoice{unpaidInvoiceCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Over Time + Top Customers */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 bg-card border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Revenue Over Time</CardTitle>
            <CardDescription>{revenueChartData.length} data point{revenueChartData.length !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[320px]">
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData} margin={{ top: 10, right: 25, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(0 0% 25%)" />
                    <XAxis dataKey="date" stroke="hsl(0 0% 55%)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(0 0% 55%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatINR} width={55} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#22d3ee" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGradient)" dot={revenueChartData.length <= 15 ? { r: 3, fill: "#22d3ee", strokeWidth: 0 } : false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <ScrollText className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No invoice data for selected period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-card border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Top 5 Customers</CardTitle>
            <CardDescription>By total revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              {topCustomersData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomersData} layout="vertical" margin={{ top: 0, right: 25, left: 5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(0 0% 25%)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={85} stroke="hsl(0 0% 65%)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(0 0% 20%)" }} />
                    <Bar dataKey="amount" name="Revenue" radius={[0, 6, 6, 0]} barSize={24}>
                      {topCustomersData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Users className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No customer data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison + Expenses by Category + Invoice Status */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Monthly Revenue vs Expenses */}
        <Card className="bg-card border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Monthly Comparison</CardTitle>
            <CardDescription>Revenue vs Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {monthlyComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(0 0% 25%)" />
                    <XAxis dataKey="month" stroke="hsl(0 0% 55%)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(0 0% 55%)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatINR} width={50} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(0 0% 20%)" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", color: "hsl(0 0% 65%)" }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <IndianRupee className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card className="bg-card border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Expenses by Category</CardTitle>
            <CardDescription>Total: ₹{totalExpenses.toLocaleString("en-IN")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {expensesByCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expensesByCategoryData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {expensesByCategoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend verticalAlign="bottom" height={40} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "hsl(0 0% 70%)" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Wallet className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No expense data found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card className="bg-card border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Invoice Status</CardTitle>
            <CardDescription>{filteredInvoices.length} total invoice{filteredInvoices.length !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {invoiceStatusData.length > 0 ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={invoiceStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {invoiceStatusData.map((entry) => (
                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {invoiceStatusData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[entry.name] || "#94a3b8" }} />
                        <span className="text-muted-foreground">{entry.name}</span>
                        <span className="font-semibold text-foreground">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <FileText className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No invoices</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
