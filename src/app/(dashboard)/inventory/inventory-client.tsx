"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, Trash2, Package, AlertTriangle } from "lucide-react";
import { createSparePart, deleteSparePart, createCategory } from "@/lib/actions/inventory";
import { toast } from "sonner";

interface Part {
  id: number;
  name: string;
  categoryId: number | null;
  partNumber: string | null;
  unit: string | null;
  categoryName: string | null;
  stock: number | null;
  minStockAlert: number | null;
  purchasePrice: number | null;
  sellingPrice: number | null;
}

interface Category {
  id: number;
  name: string;
}

export function InventoryClient({ parts, categories, searchQuery }: { parts: Part[]; categories: Category[]; searchQuery: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleSearch = () => {
    router.push(`/inventory?search=${encodeURIComponent(search)}`);
  };

  const handleCreatePart = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createSparePart({
        name: form.get("name") as string,
        categoryId: selectedCategory ? Number(selectedCategory) : undefined,
        partNumber: (form.get("partNumber") as string) || "",
        unit: (form.get("unit") as string) || "piece",
        stock: Number(form.get("stock")) || 0,
        minStockAlert: Number(form.get("minStockAlert")) || 0,
        purchasePrice: Number(form.get("purchasePrice")) || 0,
        sellingPrice: Number(form.get("sellingPrice")) || 0,
      });
      toast.success("Part added successfully");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to add part");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createCategory(form.get("catName") as string);
      toast.success("Category created");
      setCatOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to create category");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSparePart(id);
      toast.success("Part deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete part");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input placeholder="Search parts..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card/50" />
          <Button variant="secondary" size="icon" onClick={handleSearch} className="cursor-pointer shrink-0"><Search className="w-4 h-4" /></Button>
        </div>
        <div className="flex gap-2">
          <Dialog open={catOpen} onOpenChange={setCatOpen}>
            <DialogTrigger render={<Button variant="outline" className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Category</Button>} />
            <DialogContent className="sm:max-w-[50vw] w-full">
              <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="catName">Name</Label><Input id="catName" name="catName" required placeholder="e.g. Filters, Engine Parts" /></div>
                <Button type="submit" className="w-full cursor-pointer">Create</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="gap-2 cursor-pointer"><Plus className="w-4 h-4" />Add Part</Button>} />
            <DialogContent className="sm:max-w-[30vw] w-full">
              <DialogHeader><DialogTitle>Add Spare Part</DialogTitle></DialogHeader>
              <form onSubmit={handleCreatePart} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="name">Part Name *</Label><Input id="name" name="name" required placeholder="Oil Filter, Clutch Plate..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v || "")}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label htmlFor="partNumber">Part No.</Label><Input id="partNumber" name="partNumber" placeholder="Optional" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label htmlFor="stock">Current Stock</Label><Input type="number" id="stock" name="stock" defaultValue="0" /></div>
                  <div className="space-y-2"><Label htmlFor="minStockAlert">Min Alert Level</Label><Input type="number" id="minStockAlert" name="minStockAlert" defaultValue="0" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label htmlFor="purchasePrice">Purchase Price (₹)</Label><Input type="number" id="purchasePrice" name="purchasePrice" defaultValue="0" /></div>
                  <div className="space-y-2"><Label htmlFor="sellingPrice">Selling Price (₹)</Label><Input type="number" id="sellingPrice" name="sellingPrice" defaultValue="0" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="unit">Unit</Label><Input id="unit" name="unit" defaultValue="piece" placeholder="e.g. piece, liter, set" /></div>
                <Button type="submit" className="w-full cursor-pointer" disabled={loading}>{loading ? "Adding..." : "Add Part"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-card/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Part Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No parts found.
                  </TableCell>
                </TableRow>
              ) : (
                parts.map((part) => (
                  <TableRow key={part.id} className="border-border/30 hover:bg-accent/30">
                    <TableCell className="font-medium">{part.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal bg-card">
                        {part.categoryName || "Uncategorized"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={part.stock !== null && part.minStockAlert !== null && part.stock <= part.minStockAlert ? "text-destructive font-semibold" : ""}>
                          {part.stock || 0} {part.unit}
                        </span>
                        {part.stock !== null && part.minStockAlert !== null && part.stock <= part.minStockAlert && (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>₹{part.sellingPrice || 0}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        } />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Part?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{part.name}&quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(part.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        </CardContent>
      </Card>
    </div>
  );
}
