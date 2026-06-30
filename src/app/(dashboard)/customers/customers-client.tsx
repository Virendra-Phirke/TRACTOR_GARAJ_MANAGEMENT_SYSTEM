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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { createCustomer } from "@/lib/actions/customers";
import { toast } from "sonner";
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
      setOpen(false);
      setVehicleBrand("");
      setVehicleModel("");
      router.refresh();
    } catch {
      toast.error("Failed to create customer. Phone may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Customers</h2>

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

      <DataTable 
        columns={columns} 
        data={customers} 
        searchKey="name" 
        searchPlaceholder="Filter customers by name..." 
      />
    </div>
  );
}
