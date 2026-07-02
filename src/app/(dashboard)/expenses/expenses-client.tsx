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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Receipt } from "lucide-react";
import { createExpense, deleteExpense } from "@/lib/actions/expenses";
import { toast } from "sonner";
import { format, isWithinInterval } from "date-fns";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
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
import { PaginationFooter } from "@/components/ui/pagination-footer";

const EXPENSE_CATEGORIES = ["Rent", "Electricity", "Salary", "Tools", "Transport", "Materials", "Maintenance", "Other"];

interface Expense {
  id: number;
  category: string;
  description: string | null;
  amount: number;
  date: Date;
  paymentMethod: string | null;
}

interface InvoicePart {
  id: number;
  partName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface RecentInvoice {
  id: number;
  invoiceNumber: string;
  customerName: string | null;
  createdAt: Date;
  parts: InvoicePart[];
}

export function ExpensesClient({ 
  expenses, 
  recentInvoices = [] 
}: { 
  expenses: Expense[];
  recentInvoices?: RecentInvoice[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [invoicePageIndex, setInvoicePageIndex] = useState(0);
  const [invoicePageSize, setInvoicePageSize] = useState(20);

  // ── Monthly filter for expense list ────────────────────────────────
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth()); // 0-indexed
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const filteredExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  });

  const paginatedExpenses = filteredExpenses.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const availableYears = Array.from(new Set(expenses.map((e) => new Date(e.date).getFullYear()))).sort((a, b) => b - a);
  if (!availableYears.includes(now.getFullYear())) availableYears.unshift(now.getFullYear());

  // Filter invoices by selected date range
  const filteredInvoices = recentInvoices.filter(inv => {
    if (!date?.from || !date?.to) return true;
    const invDate = new Date(inv.createdAt);
    return isWithinInterval(invDate, { start: date.from, end: date.to });
  });

  const paginatedInvoices = filteredInvoices.slice(invoicePageIndex * invoicePageSize, (invoicePageIndex + 1) * invoicePageSize);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const expensesByCategory = filteredExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(expensesByCategory).map((key) => ({
    name: key,
    value: expensesByCategory[key],
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b', '#ec4899'];

  // Automatically select all filtered invoices when date range changes
  const handleDateChange = (d: DateRange | undefined) => {
    setDate(d);
    setInvoicePageIndex(0);
    if (d?.from && d?.to) {
      const ids = recentInvoices
        .filter(inv => {
          if (!d.from || !d.to) return false;
          const invDate = new Date(inv.createdAt);
          return isWithinInterval(invDate, { start: d.from, end: d.to });
        })
        .map(inv => inv.id);
      setSelectedInvoiceIds(ids);
    } else {
      setSelectedInvoiceIds([]);
    }
  };

  const selectedInvoicesData = recentInvoices.filter(inv => selectedInvoiceIds.includes(inv.id));
  const partnerPayoutTotal = selectedInvoicesData.reduce((sum, inv) => {
    return sum + inv.parts.reduce((partSum, p) => partSum + p.total, 0);
  }, 0);

  const [customPayoutAmount, setCustomPayoutAmount] = useState<string>("");

  // Sync custom payout amount when total changes (if user hasn't typed anything yet)
  // Actually, better to just let it default or auto-update if empty, but we can just use an effect or calculate it.
  const finalPayoutAmount = customPayoutAmount !== "" ? Number(customPayoutAmount) : partnerPayoutTotal;

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createExpense({
        category,
        description: (form.get("description") as string) || "",
        amount: Number(form.get("amount")),
        paymentMethod: (form.get("paymentMethod") as string) || "cash",
      });
      toast.success("Expense recorded");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerPayout = async () => {
    if (selectedInvoiceIds.length === 0) {
      toast.error("Please select at least one invoice");
      return;
    }
    
    setLoading(true);
    try {
      const invoiceNumbers = selectedInvoicesData.map(i => `#${i.invoiceNumber}`).join(", ");
      await createExpense({
        category: "Materials", // Using Materials category for spare parts payout
        description: `Paid partner for parts used in Invoices: ${invoiceNumbers}`,
        amount: finalPayoutAmount,
        paymentMethod: "cash",
      });
      toast.success("Partner payment recorded");
      setPartnerOpen(false);
      setSelectedInvoiceIds([]);
      setCustomPayoutAmount("");
      router.refresh();
    } catch {
      toast.error("Failed to record partner payment");
    } finally {
      setLoading(false);
    }
  };

  const toggleInvoiceSelection = (id: number) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      toast.success("Expense deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterMonth.toString()} onValueChange={(v) => { setFilterMonth(Number(v)); setPageIndex(0); }}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-transparent border-border/40">
              {monthNames[filterMonth]}
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear.toString()} onValueChange={(v) => { setFilterYear(Number(v)); setPageIndex(0); }}>
            <SelectTrigger className="w-[90px] h-8 text-xs bg-transparent border-border/40">
              {filterYear}
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{filteredExpenses.length} expenses • Total: ₹{totalExpenses.toLocaleString("en-IN")}</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={partnerOpen} onOpenChange={setPartnerOpen}>
            <DialogTrigger render={
              <Button variant="secondary" className="gap-2 cursor-pointer">
                <Receipt className="w-4 h-4" />
                Pay Partner (Parts)
              </Button>
            } />
            <DialogContent className="sm:max-w-[80vw] w-full max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Partner Payout</DialogTitle>
                <p className="text-sm text-muted-foreground">Select invoices and calculate partner commissions.</p>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-2 max-h-[80vh] overflow-y-auto pr-2">
                
                {/* LEFT COLUMN: SELECTION */}
                <div className="space-y-4 flex flex-col h-full">
                  <div className="bg-card border rounded-lg p-4 shadow-sm space-y-4 flex-1">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                      Select Invoices
                    </h3>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Auto-Select by Date Range</Label>
                      <DatePickerWithRange date={date} setDate={handleDateChange} onClear={() => handleDateChange(undefined)} className="w-full" />
                    </div>
                    
                    <div className="space-y-2 flex-1 flex flex-col min-h-[200px]">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Or Select Manually ({filteredInvoices.length} recent invoices)
                      </Label>
                      <div className="border rounded-md overflow-hidden bg-background flex-1 flex flex-col max-h-[350px]">
                        <div className="overflow-y-auto flex-1">
                          <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                              <TableRow>
                                <TableHead className="w-[40px] text-center"></TableHead>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead className="text-right">Parts</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredInvoices.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No invoices found.
                                  </TableCell>
                                </TableRow>
                              ) : paginatedInvoices.map(inv => (
                                <TableRow key={inv.id} className={selectedInvoiceIds.includes(inv.id) ? "bg-primary/5" : ""}>
                                  <TableCell className="text-center">
                                    <Checkbox 
                                      checked={selectedInvoiceIds.includes(inv.id)}
                                      onCheckedChange={() => toggleInvoiceSelection(inv.id)}
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">#{inv.invoiceNumber}</TableCell>
                                  <TableCell className="text-sm">{inv.customerName || 'Unknown'}</TableCell>
                                  <TableCell className="text-right font-semibold">
                                    <Badge variant="secondary">{inv.parts.length}</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <PaginationFooter
                          pageIndex={invoicePageIndex}
                          pageSize={invoicePageSize}
                          totalRows={filteredInvoices.length}
                          setPageIndex={setInvoicePageIndex}
                          setPageSize={setInvoicePageSize}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* RIGHT COLUMN: SUMMARY & PAYMENT */}
                <div className="space-y-4 flex flex-col h-full">
                  <div className="bg-card border rounded-lg p-4 shadow-sm space-y-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                      Review & Pay
                    </h3>
                    
                    {selectedInvoicesData.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-8 text-center bg-muted/10">
                        <Receipt className="w-12 h-12 mb-3 opacity-20" />
                        <p>Select at least one invoice from the left<br/>to calculate the partner payout.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 flex flex-col border rounded-md overflow-hidden max-h-[250px]">
                          <div className="bg-muted/50 p-2 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider flex justify-between px-4">
                            <span>Consolidated Parts ({selectedInvoicesData.reduce((sum, i) => sum + i.parts.length, 0)})</span>
                          </div>
                          <div className="overflow-y-auto flex-1 bg-background">
                            <Table>
                              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                <TableRow>
                                  <TableHead>Part</TableHead>
                                  <TableHead className="text-right">Qty</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedInvoicesData.flatMap(inv => 
                                  inv.parts.map(part => (
                                    <TableRow key={`${inv.id}-${part.id}`}>
                                      <TableCell>
                                        <div className="font-medium">{part.partName}</div>
                                        <div className="text-[10px] text-muted-foreground">Inv #{inv.invoiceNumber}</div>
                                      </TableCell>
                                      <TableCell className="text-right">{part.quantity}</TableCell>
                                      <TableCell className="text-right font-medium">₹{part.total.toLocaleString()}</TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                        
                        <div className="space-y-4 mt-auto pt-4">
                          <div className="flex justify-between items-center p-3 rounded bg-muted/30 border">
                            <span className="text-sm font-medium text-muted-foreground">Total Parts Value:</span>
                            <span className="text-lg font-bold line-through text-muted-foreground/60">₹{partnerPayoutTotal.toLocaleString("en-IN")}</span>
                          </div>

                          <div className="space-y-2 p-4 border rounded-lg bg-primary/5 border-primary/20 relative">
                            <Label htmlFor="customPayout" className="text-primary font-semibold">Final Payout Amount</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                              <Input 
                                id="customPayout"
                                type="number" 
                                placeholder={`${partnerPayoutTotal}`}
                                value={customPayoutAmount}
                                onChange={(e) => setCustomPayoutAmount(e.target.value)}
                                className="text-xl font-bold pl-8 py-6 bg-background border-primary/30 focus-visible:ring-primary"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Deduct your commission. Leave blank to pay the full value.
                            </p>
                          </div>

                          <Button onClick={handlePartnerPayout} disabled={loading} size="lg" className="w-full text-base font-semibold shadow-md">
                            {loading ? "Recording Payment..." : `Record Payment of ₹${finalPayoutAmount.toLocaleString("en-IN")}`}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button className="gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            } />
          <DialogContent className="sm:max-w-[30vw] w-full">
            <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={(v) => setCategory(v || "")}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{EXPENSE_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="amount">Amount (₹) *</Label><Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" /></div>
              <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" rows={2} placeholder="Optional details" /></div>
              <div className="space-y-2">
                <Label>Payment</Label>
                <Select name="paymentMethod" defaultValue="cash">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full cursor-pointer" disabled={loading || !category}>{loading ? "Recording..." : "Record Expense"}</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card/50 lg:col-span-1">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Expense Breakdown</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => `₹${Number(value).toLocaleString("en-IN")}`}
                    contentStyle={{
                      backgroundColor: "rgba(40, 45, 55, 0.85)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#fff"
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                No expenses to show.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 lg:col-span-2">
          <CardContent className="p-0">
            <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />No expenses for {monthNames[filterMonth]} {filterYear}.
                  </TableCell>
                </TableRow>
              ) : paginatedExpenses.map((exp) => (
                <TableRow key={exp.id} className="border-border/30">
                  <TableCell><Badge variant="outline">{exp.category}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{exp.description || "—"}</TableCell>
                  <TableCell className="text-right font-semibold">₹{exp.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-muted-foreground text-sm capitalize">{exp.paymentMethod || "cash"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(exp.date), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      } />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this expense? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(exp.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationFooter
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalRows={filteredExpenses.length}
            setPageIndex={setPageIndex}
            setPageSize={setPageSize}
          />
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
