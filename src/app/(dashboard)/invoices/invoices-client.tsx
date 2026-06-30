"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Invoice {
  id: number;
  invoiceNumber: string;
  grandTotal: number | null;
  paymentStatus: string;
  paymentMethod: string | null;
  createdAt: Date;
  customerName: string | null;
  customerPhone: string | null;
  vehicleReg: string | null;
  vehicleBrand: string | null;
}

export function InvoicesClient({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFrom = searchParams.get("from");
  const initialTo = searchParams.get("to");
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: initialFrom ? new Date(initialFrom) : undefined,
    to: initialTo ? new Date(initialTo) : undefined,
  });
  const [limit, setLimit] = useState(searchParams.get("limit") || "100");
  const [sortDir, setSortDir] = useState(searchParams.get("sort") || "desc");

  const applyFilters = (newDate: DateRange | undefined, newLimit: string, newSort: string) => {
    const params = new URLSearchParams();
    if (newDate?.from) params.set("from", newDate.from.toISOString());
    if (newDate?.to) params.set("to", newDate.to.toISOString());
    if (newLimit !== "100") params.set("limit", newLimit);
    if (newSort !== "desc") params.set("sort", newSort);
    router.push(`/invoices?${params.toString()}`);
  };

  const handleDateChange = (d: DateRange | undefined) => {
    setDate(d);
    applyFilters(d, limit, sortDir);
  };

  const handleLimitChange = (l: string) => {
    setLimit(l);
    applyFilters(date, l, sortDir);
  };

  const handleSortChange = (s: string) => {
    setSortDir(s);
    applyFilters(date, limit, s);
  };

  const handleClearFilters = () => {
    setDate(undefined);
    setLimit("100");
    setSortDir("desc");
    router.push("/invoices");
  };

  const statusColor = (s: string) => {
    if (s === "paid") return "border-emerald-400/30 text-emerald-400";
    if (s === "partial") return "border-blue-400/30 text-blue-400";
    return "border-amber-400/30 text-amber-400";
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-primary">
          {row.getValue("invoiceNumber")}
        </span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.getValue("customerName")}</p>
          <p className="text-xs text-muted-foreground">{row.original.customerPhone}</p>
        </div>
      ),
    },
    {
      accessorKey: "vehicleReg",
      header: "Vehicle",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.getValue("vehicleReg") || "—"}
          {row.original.vehicleBrand && (
            <span className="text-xs ml-1">({row.original.vehicleBrand})</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "grandTotal",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("grandTotal") as string) || 0;
        return (
          <div className="text-right font-semibold">
            ₹{amount.toLocaleString("en-IN")}
          </div>
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={statusColor(row.getValue("paymentStatus"))}>
          {row.getValue("paymentStatus")}
        </Badge>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm capitalize">
          {(row.getValue("paymentMethod") as string) || "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {format(new Date(row.getValue("createdAt")), "dd MMM yy")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={() => router.push(`/invoices/${row.original.id}`)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your invoices and payments
          </p>
        </div>
        
        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <DatePickerWithRange date={date} setDate={handleDateChange} onClear={handleClearFilters} />
            <Select value={sortDir} onValueChange={(v) => handleSortChange(v || "desc")}>
              <SelectTrigger className="w-[140px] h-9 bg-card/50">
                <SelectValue placeholder="Sort by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
            <Select value={limit} onValueChange={(v) => handleLimitChange(v || "100")}>
              <SelectTrigger className="w-[100px] h-9 bg-card/50">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 items</SelectItem>
                <SelectItem value="50">50 items</SelectItem>
                <SelectItem value="100">100 items</SelectItem>
                <SelectItem value="200">200 items</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Link href="/invoices/new">
            <Button className="gap-2 cursor-pointer h-9">
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      <Card className="bg-card/50">
        <CardContent className="p-4 sm:p-6">
          <DataTable 
            columns={columns} 
            data={invoices} 
            searchKey="customerName"
            searchPlaceholder="Search customer..."
            filterKey="paymentStatus"
            filterPlaceholder="Payment Status"
            filterOptions={[
              { label: "Paid", value: "paid" },
              { label: "Unpaid", value: "unpaid" },
              { label: "Partial", value: "partial" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
