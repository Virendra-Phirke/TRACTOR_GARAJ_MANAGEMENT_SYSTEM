"use client";

import { useState } from "react";
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
import { Edit } from "lucide-react";
import { updateVehicle } from "@/lib/actions/vehicles";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/combobox";
import tractorBrands from "../../../00 services/tractor_brands.json";
import tractorModelsMap from "../../../00 services/tractor_models.json";

export function EditVehicleDialog({
  vehicle,
}: {
  vehicle: {
    id: number;
    registrationNumber: string;
    brand: string;
    model: string | null;
    year: number | null;
    engineNumber: string | null;
    chassisNumber: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState(vehicle.brand);
  const [model, setModel] = useState(vehicle.model || "");

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await updateVehicle(vehicle.id, {
        registrationNumber: form.get("registrationNumber") as string,
        brand,
        model,
        year: form.get("year") ? Number(form.get("year")) : undefined,
        engineNumber: (form.get("engineNumber") as string) || "",
        chassisNumber: (form.get("chassisNumber") as string) || "",
      });
      toast.success("Vehicle updated successfully");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to update vehicle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="sm" className="cursor-pointer text-muted-foreground hover:text-foreground">
          <Edit className="w-4 h-4 mr-1" /> Edit
        </Button>
      } />
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Registration Number</Label>
            <Input name="registrationNumber" defaultValue={vehicle.registrationNumber} required />
          </div>
          <div className="space-y-2">
            <Label>Brand</Label>
            <Combobox
              options={tractorBrands.map((b) => ({ value: b, label: b }))}
              value={brand}
              onChange={(v) => { setBrand(v); setModel(""); }}
              placeholder="Select Brand"
              searchPlaceholder="Search brand..."
              emptyText="No brand found."
              allowCustomValue
            />
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Combobox
              options={(tractorModelsMap as Record<string, string[]>)[brand]?.map((m) => ({ value: m, label: m })) || []}
              value={model}
              onChange={setModel}
              placeholder="Select Model"
              searchPlaceholder="Search model..."
              emptyText={brand ? "No model found." : "Select brand first"}
              disabled={!brand}
              allowCustomValue
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Year</Label>
              <Input name="year" type="number" defaultValue={vehicle.year || ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Engine Number</Label>
            <Input name="engineNumber" defaultValue={vehicle.engineNumber || ""} />
          </div>
          <div className="space-y-2">
            <Label>Chassis Number</Label>
            <Input name="chassisNumber" defaultValue={vehicle.chassisNumber || ""} />
          </div>

          <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
