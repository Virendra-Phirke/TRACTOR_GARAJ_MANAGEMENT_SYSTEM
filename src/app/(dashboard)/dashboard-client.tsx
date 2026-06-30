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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
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
    router.push("/");
  };
  const statCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      subtitle: `${stats.todayBills} bill${stats.todayBills !== 1 ? "s" : ""} today`,
      icon: IndianRupee,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/20",
    },
    {
      title: "Pending Payments",
      value: formatCurrency(stats.pendingAmount),
      subtitle: `${stats.pendingCount} unpaid`,
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/20",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      subtitle: "All time",
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/20",
    },
    {
      title: "Customers",
      value: customerCount.toString(),
      subtitle: "Registered",
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, Owner
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here&apos;s your garage at a glance
          </p>
        </div>
        
        {/* Actions & Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <DatePickerWithRange date={date} setDate={setDate} onClear={handleClearFilters} />
            <Button size="sm" variant="secondary" onClick={handleApplyFilters} className="h-9 cursor-pointer">
              Apply
            </Button>
          </div>
          <a href="/api/export/csv" download>
            <Button variant="outline" className="gap-2 cursor-pointer border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </a>
          <a href="/api/backup" download>
            <Button variant="outline" className="gap-2 cursor-pointer border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
              <DatabaseBackup className="w-4 h-4" />
              Backup Data
            </Button>
          </a>
          <Link href="/invoices/new">
            <Button className="gap-2 cursor-pointer">
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {needsBackup && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-500 text-sm">Backup Reminder</p>
              <p className="text-xs text-amber-500/80">
                You haven&apos;t backed up your data in the last 7 days. Please create a backup to prevent data loss.
              </p>
            </div>
          </div>
          <a href="/api/backup" download onClick={() => setTimeout(() => window.location.reload(), 2000)}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black cursor-pointer">
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
        <Card className="lg:col-span-2 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue — Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={stats.weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d333b" vertical={false} />
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
                      backgroundColor: "rgba(40, 45, 55, 0.85)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#fff"
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
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#blueGradient)"
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#1a1d23", fill: "#3b82f6" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bills"
                    stroke="#8b949e"
                    strokeWidth={2.5}
                    fill="none"
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#1a1d23", fill: "#8b949e" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
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
                          ? "border-emerald-400/30 text-emerald-400"
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
