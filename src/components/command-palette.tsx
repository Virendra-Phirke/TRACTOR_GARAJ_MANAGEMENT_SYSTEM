"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Calculator,
  LayoutDashboard,
  Users,
  Settings,
  Car,
  FileText,
  Package,
  Plus,
} from "lucide-react";

export function CommandPalette({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const router = useRouter();

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/invoices/new"))}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create New Invoice</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/"))}
            className="cursor-pointer"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/invoices"))}
            className="cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Invoices</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/customers"))}
            className="cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Customers</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/vehicles"))}
            className="cursor-pointer"
          >
            <Car className="mr-2 h-4 w-4" />
            <span>Vehicles</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/inventory"))}
            className="cursor-pointer"
          >
            <Package className="mr-2 h-4 w-4" />
            <span>Spare Parts / Inventory</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/expenses"))}
            className="cursor-pointer"
          >
            <Calculator className="mr-2 h-4 w-4" />
            <span>Expenses / Partner Payouts</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/settings"))}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
