"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useOptimistic, startTransition } from "react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Eye, Trash2 } from "lucide-react";
import { deleteInvoice, bulkDeleteInvoices } from "@/lib/actions/invoices";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { RowSelectionState } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deleting, setDeleting] = useState(false);
  const { playSound } = useTheme();

  const [optimisticInvoices, addOptimisticInvoice] = useOptimistic(
    invoices,
    (state: Invoice[], action: { type: "delete"; payload: any }) => {
      switch (action.type) {
        case "delete":
          return state.filter((i) => !action.payload.includes(i.id));
        default:
          return state;
      }
    }
  );

  const selectedCount = Object.keys(rowSelection).length;

  const handleBulkDelete = async () => {
    const ids = Object.keys(rowSelection).map((i) => optimisticInvoices[parseInt(i)].id);
    if (ids.length === 0) return;
    
    startTransition(() => {
      addOptimisticInvoice({ type: "delete", payload: ids });
    });
    setRowSelection({});

    try {
      await bulkDeleteInvoices(ids);
      router.refresh();
    } catch {
      toast.error("Failed to delete invoices");
      router.refresh();
    }

    toast.success(`${ids.length} invoices deleted`);

    playSound("delete");
  };

  const handleDelete = async (id: number) => {
    startTransition(() => {
      addOptimisticInvoice({ type: "delete", payload: [id] });
    });

    try {
      await deleteInvoice(id);
      toast.success("Invoice deleted successfully");
      playSound("delete");
      router.refresh();
    } catch (err) {
      console.error("Failed to delete invoice:", err);
      const msg = err instanceof Error ? err.message : "Failed to delete invoice";
      toast.error(msg);
      router.refresh();
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
    if (s === "paid") return "border-primary/30 text-primary bg-primary/5";
    if (s === "partial") return "border-primary/50 text-primary/80 bg-primary/10";
    return "border-muted-foreground/30 text-muted-foreground bg-muted-foreground/10";
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/invoices/${row.original.id}`)}
            title="View Details"
            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={
              <Button
                variant="ghost"
                size="icon"
                title="Delete Invoice"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            } />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this invoice? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(row.original.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-end justify-between gap-4">
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

          {selectedCount > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={deleting}
              className="gap-2 cursor-pointer h-8 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Deleting..." : `Delete (${selectedCount})`}
            </Button>
          )}
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
          data={optimisticInvoices} 
          searchKey="customerName"
          searchPlaceholder="Search customer..."
          filterKey="paymentStatus"
          filterPlaceholder="Payment Status"
          filterOptions={[
            { label: "Paid", value: "paid" },
            { label: "Unpaid", value: "unpaid" },
            { label: "Partial", value: "partial" },
          ]}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
      </div>
    </div>
  );
}
