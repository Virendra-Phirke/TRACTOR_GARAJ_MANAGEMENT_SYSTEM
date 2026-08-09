"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  FileText,
  Clock,
  Users,
  AlertTriangle,
  Plus,
  ArrowRight,
  Download,
  DatabaseBackup,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface DashboardProps {
  stats: {
    todayRevenue: number;
    todayBills: number;
    pendingAmount: number;
    pendingCount: number;
    totalRevenue: number;
    weeklyData: { date: string; revenue: number; bills: number }[];
    recentInvoices: {
      id: number;
      invoiceNumber: string;
      grandTotal: number | null;
      paymentStatus: string;
      createdAt: Date;
      customerName: string | null;
    }[];
  };
  lowStock: {
    id: number;
    name: string;
    stock: number | null;
    minStock: number | null;
    unit: string | null;
  }[];
  customerCount: number;
  lastBackupDate?: Date | null;
}

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

export function DashboardClient({
  stats,
  lowStock,
  customerCount,
  lastBackupDate,
}: DashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFrom = searchParams.get("from");
  const initialTo = searchParams.get("to");

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
    router.push(`/?${params.toString()}`);
  };

  const needsBackup = !lastBackupDate || new Date().getTime() - new Date(lastBackupDate).getTime() > 7 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    // Check for out-of-stock items and alert the user once per load
    const outOfStockItems = lowStock.filter((item) => item.stock === 0);
    if (outOfStockItems.length > 0) {
      outOfStockItems.forEach((item) => {
        toast.error(`Alert: ${item.name} is Out of Stock!`, {
          duration: 5000,
        });
      });
    }
  }, [lowStock]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (date?.from) params.set("from", date.from.toISOString());
    if (date?.to) params.set("to", date.to.toISOString());
    router.push(`/?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setDate(undefined);
    setFilterMonth(now.getMonth());
    setFilterYear(now.getFullYear());
    router.push("/");
  };
  const statCards = useMemo(() => [
    {
      title: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      subtitle: `${stats.todayBills} bill${stats.todayBills !== 1 ? "s" : ""} today`,
      icon: IndianRupee,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Pending Payments",
      value: formatCurrency(stats.pendingAmount),
      subtitle: `${stats.pendingCount} unpaid`,
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-muted-foreground/10",
      borderColor: "border-muted-foreground/20",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      subtitle: "All time",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Customers",
      value: customerCount.toString(),
      subtitle: "Registered",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
  ], [stats.todayRevenue, stats.todayBills, stats.pendingAmount, stats.pendingCount, stats.totalRevenue, customerCount]);

  return (
    <div className="space-y-6">
      {/* Quick Action */}
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
        {/* Filters Row */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={filterMonth.toString()} onValueChange={(v) => handleMonthYearChange(Number(v), filterYear)}>
            <SelectTrigger className="w-[100px] sm:w-[120px] h-9 text-xs">
              {monthNames[filterMonth]}
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear.toString()} onValueChange={(v) => handleMonthYearChange(filterMonth, Number(v))}>
            <SelectTrigger className="w-[80px] sm:w-[90px] h-9 text-xs">
              {filterYear}
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DatePickerWithRange date={date} setDate={setDate} onClear={handleClearFilters} />
          <Button size="sm" variant="secondary" onClick={handleApplyFilters} className="h-9 cursor-pointer">
            Apply
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <a href="/api/export/csv" download className="flex-1 min-w-[120px] sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto gap-2 cursor-pointer border-primary/30 text-primary hover:bg-primary/10">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </a>
          <a href="/api/backup" download className="flex-1 min-w-[120px] sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto gap-2 cursor-pointer border-primary/30 text-primary hover:bg-primary/10">
              <DatabaseBackup className="w-4 h-4" />
              <span className="hidden sm:inline">Backup Data</span>
              <span className="sm:hidden">Backup</span>
            </Button>
          </a>
          <Link href="/invoices/new" className="flex-1 min-w-[120px] sm:flex-none">
            <Button className="w-full sm:w-auto gap-2 cursor-pointer">
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {needsBackup && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive text-sm">Backup Reminder</p>
              <p className="text-xs text-destructive/80">
                You haven&apos;t backed up your data in the last 7 days. Please create a backup to prevent data loss.
              </p>
            </div>
          </div>
          <a href="/api/backup" download onClick={() => setTimeout(() => window.location.reload(), 2000)}>
            <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer">
              Backup Now
            </Button>
          </a>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className={`border ${card.borderColor} bg-card/50 hover:bg-card/80 transition-colors`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold mt-2 tracking-tight">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.subtitle}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center`}
                >
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 bg-card/50 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue — {monthNames[new Date().getMonth()]} {new Date().getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.weeklyData.length > 0 ? (
              <div className="relative">
                {/* Subtle animated glow behind the chart */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at 50% 80%, rgba(59,130,246,0.06) 0%, transparent 70%)",
                  }}
                />
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={stats.weeklyData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                      {/* Glow filter for the active dot */}
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#2d333b"
                      vertical={false}
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => {
                        try {
                          return format(new Date(d), "dd MMM");
                        } catch {
                          return d;
                        }
                      }}
                      stroke="#a1a1aa"
                      fontSize={12}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#a1a1aa"
                      fontSize={12}
                      tickFormatter={(v) => formatCurrency(v)}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 18, 25, 0.9)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#fff",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.1)",
                        padding: "12px 16px",
                      }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(value: any, name: any) => [
                        name === "revenue" ? `₹${Number(value).toLocaleString("en-IN")}` : value,
                        name === "revenue" ? "Revenue" : "Bills"
                      ]}
                      labelFormatter={(d) => {
                        try {
                          return format(new Date(d), "dd MMM yyyy");
                        } catch {
                          return d;
                        }
                      }}
                      cursor={{
                        stroke: "rgba(59, 130, 246, 0.3)",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />
                    <Area
                      type="natural"
                      dataKey="revenue"
                      stroke="url(#lineGradient)"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#blueGradient)"
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                      activeDot={{
                        r: 7,
                        strokeWidth: 3,
                        stroke: "rgba(59, 130, 246, 0.4)",
                        fill: "#3b82f6",
                        filter: "url(#glow)",
                      }}
                      dot={{
                        r: 3,
                        fill: "#3b82f6",
                        strokeWidth: 0,
                        fillOpacity: 0.8,
                      }}
                    />
                    <Area
                      type="natural"
                      dataKey="bills"
                      stroke="#8b949e"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      fill="none"
                      isAnimationActive={true}
                      animationBegin={300}
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                      activeDot={{
                        r: 5,
                        strokeWidth: 2,
                        stroke: "rgba(139, 148, 158, 0.4)",
                        fill: "#8b949e",
                      }}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet. Create your first invoice!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Low Stock Alerts
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            {lowStock.length > 0 ? (
              <div className="space-y-3">
                {lowStock.map((part) => (
                  <div
                    key={part.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-amber-400/5 border border-amber-400/10"
                  >
                    <div>
                      <p className="text-sm font-medium">{part.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Min: {part.minStock} {part.unit}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-amber-400/30 text-amber-400"
                    >
                      {part.stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                All stock levels are healthy ✓
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Invoices
            </CardTitle>
            <Link href="/invoices">
              <Button variant="ghost" size="sm" className="text-xs gap-1 cursor-pointer">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentInvoices.length > 0 ? (
            <div className="space-y-2">
              {stats.recentInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.customerName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ₹{(inv.grandTotal || 0).toLocaleString("en-IN")}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        inv.paymentStatus === "paid"
                          ? "border-primary/30 text-primary"
                          : "border-amber-400/30 text-amber-400"
                      }
                    >
                      {inv.paymentStatus}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No invoices yet. Click &quot;New Invoice&quot; to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
