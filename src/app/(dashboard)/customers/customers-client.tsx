"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { createCustomer, bulkDeleteCustomers } from "@/lib/actions/customers";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { RowSelectionState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { columns, Customer } from "./columns";
import { Combobox } from "@/components/ui/combobox";
import tractorBrands from "../../../../00 services/tractor_brands.json";
import tractorModelsMap from "../../../../00 services/tractor_models.json";
import { Separator } from "@/components/ui/separator";

export function CustomersClient({
  customers,
  searchQuery,
}: {
  customers: Customer[];
  searchQuery?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const { playSound } = useTheme();

  const displayedCustomers = customers.filter((c) => !hiddenIds.has(c.id));

  const selectedCount = Object.keys(rowSelection).length;
  
  const selectedCustomers = Object.keys(rowSelection).map(
    (i) => displayedCustomers[parseInt(i)]
  );
  
  const customersWithDues = selectedCustomers.filter(
    (c) => (c.outstandingBalance || 0) > 0
  );
  const totalDues = customersWithDues.reduce(
    (sum, c) => sum + (c.outstandingBalance || 0),
    0
  );

  const handleBulkDelete = () => {
    const ids = selectedCustomers.map((c) => c.id);
    if (ids.length === 0) return;

    setHiddenIds((prev) => new Set([...prev, ...ids]));
    setRowSelection({});
    setDeleteDialogOpen(false);

    const timeoutId = setTimeout(async () => {
      try {
        await bulkDeleteCustomers(ids);
        router.refresh();
      } catch {
        toast.error("Failed to delete customers");
        setHiddenIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      }
    }, 5000);

    toast.success(`${ids.length} customer(s) deleted.`, {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(timeoutId);
          setHiddenIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.delete(id));
            return next;
          });
          toast.success("Action undone");
        }
      }
    });
    playSound("delete");
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createCustomer({
        name: form.get("name") as string,
        phone: form.get("phone") as string,
        email: (form.get("email") as string) || "",
        address: (form.get("address") as string) || "",
        vehicleReg: (form.get("vehicleReg") as string) || "",
        vehicleBrand,
        vehicleModel,
      });
      toast.success("Customer created successfully");
      playSound("create");
      setOpen(false);
      setVehicleBrand("");
      setVehicleModel("");
      router.refresh();
    } catch {
      toast.error("Failed to create customer. Phone may already exist.");
      playSound("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Customers</h2>

        <div className="flex gap-2">
          {selectedCount > 0 && (
            <>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleting}
                className="gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : `Delete (${selectedCount})`}
              </Button>
              
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. You are about to permanently delete <strong>{selectedCount}</strong> customer(s) from the system.
                    </AlertDialogDescription>
                    {customersWithDues.length > 0 && (
                      <div className="p-3 mt-4 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20 font-medium">
                        ⚠️ Warning: The selected customers have a total of {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalDues)} in outstanding due payments. Deleting them may cause data loss for those dues.
                      </div>
                    )}
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Add Customer</Button>} />
            <DialogContent className="sm:max-w-[30vw] w-full">
            <DialogHeader>
              <DialogTitle>New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required placeholder="Customer name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" name="phone" required placeholder="10-digit mobile" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" placeholder="Optional" rows={2} />
              </div>

              <Separator className="my-2" />
              <div className="space-y-3">
                <Label>Vehicle Details (Optional)</Label>
                <Input name="vehicleReg" placeholder="Registration Number" />
                <Combobox
                  options={tractorBrands.map((b) => ({ value: b, label: b }))}
                  value={vehicleBrand}
                  onChange={(v) => { setVehicleBrand(v); setVehicleModel(""); }}
                  placeholder="Select Brand"
                  searchPlaceholder="Search brand..."
                  emptyText="No brand found."
                  allowCustomValue
                />
                <Combobox
                  options={(tractorModelsMap as Record<string, string[]>)[vehicleBrand]?.map((m) => ({ value: m, label: m })) || []}
                  value={vehicleModel}
                  onChange={setVehicleModel}
                  placeholder="Select Model"
                  searchPlaceholder="Search model..."
                  emptyText={vehicleBrand ? "No model found." : "Select brand first"}
                  disabled={!vehicleBrand}
                  allowCustomValue
                />
              </div>

              <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                {loading ? "Creating..." : "Create Customer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={displayedCustomers} 
        searchKey="name" 
        searchPlaceholder="Filter customers by name..." 
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}
