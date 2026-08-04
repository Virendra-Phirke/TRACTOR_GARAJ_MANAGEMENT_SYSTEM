"use client";

import { useState, useOptimistic } from "react";
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
import { createCustomer, bulkDeleteCustomers, updateCustomer } from "@/lib/actions/customers";
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
  const [editOpen, setEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const { playSound } = useTheme();

  const [optimisticCustomers, addOptimisticCustomer] = useOptimistic(
    customers,
    (state: Customer[], action: { type: "add" | "update" | "delete"; payload: any }) => {
      switch (action.type) {
        case "add":
          return [action.payload, ...state];
        case "update":
          return state.map((c) => (c.id === action.payload.id ? { ...c, ...action.payload } : c));
        case "delete":
          return state.filter((c) => !action.payload.includes(c.id));
        default:
          return state;
      }
    }
  );

  const selectedCount = Object.keys(rowSelection).length;
  
  const selectedCustomers = Object.keys(rowSelection).map(
    (i) => optimisticCustomers[parseInt(i)]
  );
  
  const customersWithDues = selectedCustomers.filter(
    (c) => (c.outstandingBalance || 0) > 0
  );
  const totalDues = customersWithDues.reduce(
    (sum, c) => sum + (c.outstandingBalance || 0),
    0
  );

  const handleBulkDelete = async () => {
    const ids = Object.keys(rowSelection).map((idx) => optimisticCustomers[Number(idx)].id);
    if (ids.length === 0) return;

    addOptimisticCustomer({ type: "delete", payload: ids });
    setRowSelection({});
    setDeleteDialogOpen(false);

    try {
      await bulkDeleteCustomers(ids);
      router.refresh();
    } catch {
      toast.error("Failed to delete customers");
      router.refresh();
    }

    toast.success(`${ids.length} customer(s) deleted.`);
    playSound("delete");
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    
    const newCustomerData = {
      name: form.get("name") as string,
      phone: form.get("phone") as string,
      email: (form.get("email") as string) || "",
      address: (form.get("address") as string) || "",
      vehicleReg: (form.get("vehicleReg") as string) || "",
      vehicleBrand,
      vehicleModel,
    };
    
    // Optimistic UI Update
    addOptimisticCustomer({
      type: "add",
      payload: { ...newCustomerData, id: Math.random(), createdAt: new Date() },
    });
    setOpen(false);

    try {
      await createCustomer(newCustomerData);
      toast.success("Customer created successfully");
      playSound("create");
      setVehicleBrand("");
      setVehicleModel("");
      router.refresh();
    } catch {
      toast.error("Failed to create customer. Phone may already exist.");
      playSound("error");
      router.refresh(); // Revert on failure
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditOpen(true);
  };

  const handleEditCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setEditLoading(true);
    const form = new FormData(e.currentTarget);
    
    const updatedData = {
      name: form.get("editName") as string,
      phone: form.get("editPhone") as string,
      email: (form.get("editEmail") as string) || "",
      address: (form.get("editAddress") as string) || "",
    };

    // Optimistic UI Update
    addOptimisticCustomer({
      type: "update",
      payload: { id: editingCustomer.id, ...updatedData },
    });
    setEditOpen(false);
    
    try {
      await updateCustomer(editingCustomer.id, updatedData);
      toast.success("Customer updated successfully");
      playSound("create");
      setEditingCustomer(null);
      router.refresh();
    } catch {
      toast.error("Failed to update customer. Phone may already exist.");
      playSound("error");
      router.refresh(); // Revert on failure
    } finally {
      setEditLoading(false);
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
        data={optimisticCustomers} 
        searchKey="name" 
        searchPlaceholder="Filter customers by name..." 
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onEditRow={openEditDialog}
      />

      {/* Edit Customer Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[30vw] w-full">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <form onSubmit={handleEditCustomer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Name *</Label>
                <Input id="editName" name="editName" required defaultValue={editingCustomer.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone *</Label>
                <Input id="editPhone" name="editPhone" required defaultValue={editingCustomer.phone} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input id="editEmail" name="editEmail" type="email" defaultValue={editingCustomer.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAddress">Address</Label>
                <Textarea id="editAddress" name="editAddress" rows={2} defaultValue={editingCustomer.address || ""} />
              </div>
              <Button type="submit" className="w-full cursor-pointer" disabled={editLoading}>
                {editLoading ? "Updating..." : "Update Customer"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
