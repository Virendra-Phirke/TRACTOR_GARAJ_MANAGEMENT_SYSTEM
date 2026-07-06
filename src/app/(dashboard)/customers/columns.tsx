"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

// Define the shape of our data based on what getCustomers() returns
export type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  totalSpent: number | null;
  outstandingBalance: number | null;
  visitCount: number | null;
};

export const columns: ColumnDef<Customer>[] = [
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
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent -ml-4"
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div>
          <div className="font-medium">{customer.name}</div>
          <div className="text-xs text-muted-foreground">{customer.phone}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "address",
    header: "Location",
    cell: ({ row }) => {
      const address = row.getValue("address") as string;
      return (
        <div className="text-sm max-w-[200px] break-words whitespace-normal">
          {address || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "visitCount",
    header: "Visits",
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {row.getValue("visitCount")} <span className="text-muted-foreground text-xs">visits</span>
        </div>
      );
    },
  },
  {
    accessorKey: "totalSpent",
    header: "Total Spent",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalSpent") as string) || 0;
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);
      return <div className="font-medium text-primary">{formatted}</div>;
    },
  },
  {
    accessorKey: "outstandingBalance",
    header: "Balance",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("outstandingBalance") as string) || 0;
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);
      
      return (
        <div className={`font-medium ${amount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {amount > 0 ? formatted : 'No dues'}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const customer = row.original;
      const onEditRow = (table.options.meta as any)?.onEditRow;
      return (
        <div className="flex items-center gap-1">
          {onEditRow && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => onEditRow(customer)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          <Link href={`/customers/${customer.id}`}>
            <Button variant="ghost" size="sm" className="cursor-pointer">
              View <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        </div>
      );
    },
  },
];
