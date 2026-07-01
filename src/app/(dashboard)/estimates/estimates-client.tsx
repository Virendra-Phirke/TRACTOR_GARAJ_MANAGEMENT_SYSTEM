"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Search, Trash2, FileSignature, ArrowRight } from "lucide-react";
import { deleteEstimate } from "@/lib/actions/estimates";
import { toast } from "sonner";
import { PaginationFooter } from "@/components/ui/pagination-footer";

interface Estimate {
  id: number;
  estimateNumber: string;
  grandTotal: number | null;
  status: string;
  createdAt: Date;
  customerName: string | null;
  customerPhone: string | null;
  vehicleReg: string | null;
}

export function EstimatesClient({ estimates }: { estimates: Estimate[] }) {
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const filtered = estimates.filter((est) => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      est.estimateNumber.toLowerCase().includes(lower) ||
      (est.customerName && est.customerName.toLowerCase().includes(lower)) ||
      (est.customerPhone && est.customerPhone.toLowerCase().includes(lower)) ||
      (est.vehicleReg && est.vehicleReg.toLowerCase().includes(lower))
    );
  });

  const paginated = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const handleDelete = async (id: number) => {
    try {
      await deleteEstimate(id);
      toast.success("Estimate deleted");
    } catch {
      toast.error("Failed to delete estimate");
    }
  };

  const statusColor = (s: string) => {
    if (s === "accepted") return "border-emerald-400/30 text-emerald-400 bg-emerald-400/10";
    if (s === "invoiced") return "border-blue-400/30 text-blue-400 bg-blue-400/10";
    if (s === "rejected") return "border-red-400/30 text-red-400 bg-red-400/10";
    return "border-amber-400/30 text-amber-400 bg-amber-400/10";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 max-w-sm w-full">
          <Input 
            placeholder="Search estimates..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }} 
            className="bg-card/50" 
          />
          <Button variant="secondary" size="icon" className="shrink-0">
            <Search className="w-4 h-4" />
          </Button>
        </div>
        <Link href="/estimates/new">
          <Button className="gap-2 w-full sm:w-auto shadow-md">
            <Plus className="w-4 h-4" />
            New Estimate
          </Button>
        </Link>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Estimate #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileSignature className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No estimates found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((est) => (
                  <TableRow key={est.id} className="border-border/30 hover:bg-accent/30 group">
                    <TableCell className="font-mono text-sm font-medium">
                      {est.estimateNumber}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{est.customerName}</p>
                      <p className="text-xs text-muted-foreground">{est.customerPhone}</p>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {est.vehicleReg || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(est.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{(est.grandTotal || 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(est.status)}>
                        {est.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/estimates/${est.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          } />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Estimate</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete Estimate #{est.estimateNumber}?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(est.id)} 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <PaginationFooter
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalRows={filtered.length}
            setPageIndex={setPageIndex}
            setPageSize={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
