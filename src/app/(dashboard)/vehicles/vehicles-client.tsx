"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
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
import { Plus, Search, Trash2 } from "lucide-react";
import { createVehicle, deleteVehicle } from "@/lib/actions/vehicles";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { format } from "date-fns";
import tractorBrands from "../../../../00 services/tractor_brands.json";
import tractorModelsMap from "../../../../00 services/tractor_models.json";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { EditVehicleDialog } from "@/components/vehicles/edit-vehicle-dialog";

interface Vehicle {
  id: number;
  customerId: number;
  registrationNumber: string;
  brand: string;
  model: string | null;
  year: number | null;
  engineNumber: string | null;
  chassisNumber: string | null;
  createdAt: Date;
  customerName: string | null;
  customerPhone: string | null;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

export function VehiclesClient({
  vehicles,
  customers,
  searchQuery,
  searchQuery: initialSearch,
}: {
  vehicles: Vehicle[];
  customers: Customer[];
  searchQuery: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch || "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  
  const { playSound } = useTheme();

  const displayedVehicles = vehicles.filter((v) => !hiddenIds.has(v.id));

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Reset pagination on search change (handled by server fetch via router, but good for local state reset too)
  const handleSearch = () => {
    setPageIndex(0);
    router.push(`/vehicles?search=${encodeURIComponent(search)}`);
  };

  const paginatedVehicles = displayedVehicles.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createVehicle({
        customerId: Number(selectedCustomer),
        registrationNumber: form.get("registrationNumber") as string,
        brand: newBrand,
        model: newModel || "",
        year: form.get("year") ? Number(form.get("year")) : undefined,
        engineNumber: (form.get("engineNumber") as string) || "",
        chassisNumber: (form.get("chassisNumber") as string) || "",
      });
      toast.success("Vehicle added successfully");
      playSound("create");
      setNewBrand("");
      setNewModel("");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to add vehicle. Registration may already exist.");
      playSound("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    setHiddenIds((prev) => new Set([...prev, id]));

    const timeoutId = setTimeout(async () => {
      try {
        await deleteVehicle(id);
        router.refresh();
      } catch {
        toast.error("Failed to delete vehicle");
        setHiddenIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }, 5000);

    toast.success("Vehicle deleted", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(timeoutId);
          setHiddenIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          toast.success("Action undone");
        }
      }
    });
    playSound("delete");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input placeholder="Search vehicles..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card/50" />
          <Button variant="secondary" size="icon" onClick={handleSearch} className="cursor-pointer shrink-0">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="gap-2 cursor-pointer w-full sm:w-auto"><Plus className="w-4 h-4" />Add Vehicle</Button>} />
          <DialogContent className="sm:max-w-[30vw] w-full">
            <DialogHeader><DialogTitle>Add Vehicle</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Owner *</Label>
                <Combobox
                  options={customers.map((c) => ({ value: c.id.toString(), label: `${c.name} (${c.phone})` }))}
                  value={selectedCustomer}
                  onChange={(v) => setSelectedCustomer(v || "")}
                  placeholder="Search customer..."
                  emptyText="No customer found."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Reg Number *</Label>
                  <Input id="registrationNumber" name="registrationNumber" required placeholder="MH-01-AB-1234" />
                </div>
                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <Combobox
                    options={tractorBrands.map((b) => ({ value: b, label: b }))}
                    value={newBrand}
                    onChange={(v) => { setNewBrand(v || ""); setNewModel(""); }}
                    placeholder="Search brand..."
                    emptyText="No brand found."
                    allowCustomValue
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Combobox
                    options={((tractorModelsMap as Record<string, string[]>)[newBrand] || []).map((m) => ({ value: m, label: m }))}
                    value={newModel}
                    onChange={(v) => setNewModel(v || "")}
                    placeholder="Search model..."
                    emptyText={newBrand ? "No model found." : "Select brand first"}
                    disabled={!newBrand}
                    allowCustomValue
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" name="year" type="number" placeholder="2022" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="engineNumber">Engine No.</Label>
                  <Input id="engineNumber" name="engineNumber" placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chassisNumber">Chassis No.</Label>
                  <Input id="chassisNumber" name="chassisNumber" placeholder="Optional" />
                </div>
              </div>
              <Button type="submit" className="w-full cursor-pointer" disabled={loading || !selectedCustomer || !newBrand}>
                {loading ? "Adding..." : "Add Vehicle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Reg Number</TableHead>
                <TableHead>Brand / Model</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[100px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No vehicles found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVehicles.map((v) => (
                  <TableRow key={v.id} className="border-border/30 hover:bg-accent/30">
                    <TableCell className="font-mono font-semibold">{v.registrationNumber}</TableCell>
                    <TableCell>{v.brand} {v.model || ""}</TableCell>
                    <TableCell className="text-muted-foreground">{v.customerName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{v.year || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(v.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-1">
                      <EditVehicleDialog vehicle={v} />
                      <AlertDialog>
                        <AlertDialogTrigger render={
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        } />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete vehicle &quot;{v.registrationNumber}&quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(v.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <PaginationFooter
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalRows={vehicles.length}
            setPageIndex={setPageIndex}
            setPageSize={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
