"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Eye, Trash2 } from "lucide-react";
import { deleteInvoice } from "@/lib/actions/invoices";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [sortDir, setSortDir] = useState(searchParams.get("sort") || "desc");
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await deleteInvoice(invoiceToDelete);
      toast.success("Invoice deleted successfully");
    } catch {
      toast.error("Failed to delete invoice");
    } finally {
      setInvoiceToDelete(null);
    }
  };

  const applyFilters = (newDate: DateRange | undefined, newSort: string) => {
    const params = new URLSearchParams();
    if (newDate?.from) params.set("from", newDate.from.toISOString());
    if (newDate?.to) params.set("to", newDate.to.toISOString());
    if (newSort !== "desc") params.set("sort", newSort);
    router.push(`/invoices?${params.toString()}`);
  };

  const handleDateChange = (d: DateRange | undefined) => {
    setDate(d);
    applyFilters(d, sortDir);
  };

  const handleSortChange = (s: string) => {
    setSortDir(s);
    applyFilters(date, s);
  };

  const handleClearFilters = () => {
    setDate(undefined);
    setSortDir("desc");
    router.push("/invoices");
  };

  const statusColor = (s: string) => {
    if (s === "paid") return "border-emerald-400/30 text-emerald-400 bg-emerald-400/5";
    if (s === "partial") return "border-blue-400/30 text-blue-400 bg-blue-400/5";
    return "border-amber-400/30 text-amber-400 bg-amber-400/5";
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
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-8 w-8 cursor-pointer">
            <MoreVertical className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/invoices/${row.original.id}`)} className="cursor-pointer">
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setInvoiceToDelete(row.original.id)} className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-500/10">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your invoices and payments
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <DatePickerWithRange date={date} setDate={handleDateChange} onClear={handleClearFilters} />
          <Select value={sortDir} onValueChange={(v) => handleSortChange(v || "desc")}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-transparent border-border/40">
              {sortDir === "asc" ? "Oldest First" : "Newest First"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/invoices/new">
            <Button className="gap-2 cursor-pointer h-8 text-sm">
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Table Block */}
      <div className="block-section">
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
      </div>

      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone. Inventory stock and customer stats will be adjusted accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
