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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
import { format } from "date-fns";
import tractorBrands from "../../../../00 services/tractor_brands.json";
import tractorModelsMap from "../../../../00 services/tractor_models.json";
import { PaginationFooter } from "@/components/ui/pagination-footer";

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
}: {
  vehicles: Vehicle[];
  customers: Customer[];
  searchQuery: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const paginatedVehicles = vehicles.slice(
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
      setNewBrand("");
      setNewModel("");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to add vehicle. Registration may already exist.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteVehicle(id);
      toast.success("Vehicle deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete vehicle");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input placeholder="Search by reg number, brand, or owner..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card/50" />
          <Button variant="secondary" size="icon" onClick={handleSearch} className="cursor-pointer shrink-0">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Add Vehicle</Button>} />
          <DialogContent className="sm:max-w-[30vw] w-full">
            <DialogHeader><DialogTitle>Add Vehicle</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Owner *</Label>
                <Select value={selectedCustomer} onValueChange={(v) => setSelectedCustomer(v || "")}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name} ({c.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Reg Number *</Label>
                  <Input id="registrationNumber" name="registrationNumber" required placeholder="MH-01-AB-1234" />
                </div>
                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <Select value={newBrand} onValueChange={(v) => { setNewBrand(v || ""); setNewModel(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger>
                    <SelectContent>
                      {tractorBrands.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={newModel} onValueChange={(v) => setNewModel(v || "")} disabled={!newBrand}>
                    <SelectTrigger><SelectValue placeholder="Select Model" /></SelectTrigger>
                    <SelectContent>
                      {((tractorModelsMap as Record<string, string[]>)[newBrand] || []).map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Reg Number</TableHead>
                <TableHead>Brand / Model</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVehicles.length === 0 ? (
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
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer">
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
                            <AlertDialogAction onClick={() => handleDelete(v.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
