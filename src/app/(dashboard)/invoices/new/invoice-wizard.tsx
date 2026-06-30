"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Users, Truck, Wrench, Package, Calculator, Plus, Trash2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { createCustomer } from "@/lib/actions/customers";
import { createVehicle, getVehiclesByCustomer } from "@/lib/actions/vehicles";
import { createInvoice, type LaborItem, type PartItem } from "@/lib/actions/invoices";
import { toast } from "sonner";
import tractorServices from "../../../../../00 services/tractor_services.json";
import partsData from "../../../../../00 services/tractor_spare_parts_seed.json";
import tractorBrands from "../../../../../00 services/tractor_brands.json";
import tractorModelsMap from "../../../../../00 services/tractor_models.json";

// removed unused year options

interface Customer { id: number; name: string; phone: string; }
interface SparePart { id: number; name: string; unit: string | null; categoryName: string | null; sellingPrice: number | null; }
interface TaxRate { id: number; name: string; rate: number; isDefault: boolean | null; }
interface Vehicle { id: number; registrationNumber: string; brand: string; model: string | null; }

const steps = [
  { id: 1, label: "Customer", icon: Users },
  { id: 2, label: "Vehicle", icon: Truck },
  { id: 3, label: "Labor", icon: Wrench },
  { id: 4, label: "Parts", icon: Package },
  { id: 5, label: "Review", icon: Calculator },
];

export function InvoiceWizard({ customers, spareParts, taxRates }: { customers: Customer[]; spareParts: SparePart[]; taxRates: TaxRate[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Customer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");

  const combinedParts = Array.from(
    new Set([...spareParts.map((p) => p.name), ...partsData.map((p) => p.name)])
  ).sort();
  const [showNewCust, setShowNewCust] = useState(false);

  // Step 2: Vehicle
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newVehReg, setNewVehReg] = useState("");
  const [newVehBrand, setNewVehBrand] = useState("");
  const [newVehModel, setNewVehModel] = useState("");

  // Step 3: Labor
  const [laborItems, setLaborItems] = useState<(LaborItem & { id: string })[]>([]);
  const [labDesc, setLabDesc] = useState("");
  const [labRate, setLabRate] = useState("");

  // Step 4: Parts
  const [partItems, setPartItems] = useState<(PartItem & { id: string; partName: string })[]>([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partPrice, setPartPrice] = useState("");

  // Step 5: Review
  const defaultTax = taxRates.find((t) => t.isDefault);
  const [selectedTaxRate, setSelectedTaxRate] = useState(defaultTax?.rate?.toString() || "0");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState("0");
  const [notes, setNotes] = useState("");

  // Calculations
  const laborTotal = laborItems.reduce((s, i) => s + i.hours * i.rate, 0);
  const partsTotal = partItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const subtotal = laborTotal + partsTotal;
  const taxAmount = subtotal * (Number(selectedTaxRate) / 100);
  const discountAmount = discountType === "percent" ? subtotal * (Number(discountValue) / 100) : Number(discountValue);
  const grandTotal = subtotal + taxAmount - discountAmount;

  const handleSelectCustomer = async (custId: string) => {
    const cust = customers.find((c) => c.id === Number(custId));
    if (cust) {
      setSelectedCustomer(cust);
      const vehs = await getVehiclesByCustomer(cust.id);
      setCustomerVehicles(vehs as Vehicle[]);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustName || !newCustPhone) return;
    try {
      const cust = await createCustomer({ name: newCustName, phone: newCustPhone });
      setSelectedCustomer(cust);
      setCustomerVehicles([]);
      setShowNewCust(false);
      toast.success("Customer created");
    } catch {
      toast.error("Failed — phone may already exist");
    }
  };

  const handleCreateVehicle = async () => {
    if (!selectedCustomer || !newVehReg || !newVehBrand) return;
    try {
      const veh = await createVehicle({ customerId: selectedCustomer.id, registrationNumber: newVehReg, brand: newVehBrand, model: newVehModel });
      setSelectedVehicle(veh as Vehicle);
      setCustomerVehicles((prev) => [...prev, veh as Vehicle]);
      setShowNewVehicle(false);
      toast.success("Vehicle added");
    } catch {
      toast.error("Failed — reg may exist");
    }
  };

  const addLaborItem = () => {
    if (!labDesc || !labRate) return;
    setLaborItems((prev) => [...prev, { id: crypto.randomUUID(), description: labDesc, hours: 1, rate: Number(labRate) }]);
    setLabDesc(""); setLabRate("");
  };

  const handlePartSearch = (name: string) => {
    setSelectedPartId(name);
    // Do not autofill price from external JSON catalog
    // Find price from the DB parts (local inventory)
    const dbPart = spareParts.find((p) => p.name === name);
    if (dbPart && dbPart.sellingPrice != null) {
      setPartPrice(dbPart.sellingPrice.toString());
    }
  };

  const addPartItemManual = () => {
    if (!selectedPartId || !partPrice) return;
    
    // Look up in DB to get an ID if it exists, otherwise it'll just be a custom/JSON part (null ID)
    const dbPart = spareParts.find((p) => p.name === selectedPartId);
    
    // Check if this part is already in the list (by exact name)
    const existing = partItems.find((p) => p.partName === selectedPartId);
    if (existing) {
      setPartItems((prev) => prev.map((p) => p.partName === selectedPartId ? { ...p, quantity: p.quantity + 1, unitPrice: Number(partPrice) } : p));
    } else {
      setPartItems((prev) => [...prev, { 
        id: crypto.randomUUID(), 
        sparePartId: dbPart?.id, // Optional now
        partName: selectedPartId, 
        quantity: 1, 
        unitPrice: Number(partPrice) 
      }]);
    }
    setSelectedPartId("");
    setPartPrice("");
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      const invoice = await createInvoice({
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle?.id,
        laborItems: laborItems.map(item => ({ description: item.description, hours: item.hours, rate: item.rate })),
        partItems: partItems.map(item => ({ sparePartId: item.sparePartId, partName: item.partName, quantity: item.quantity, unitPrice: item.unitPrice })),
        taxRate: Number(selectedTaxRate),
        discountType,
        discountValue: Number(discountValue),
        paymentMethod: "cash",
        paymentStatus: "unpaid",
        amountPaid: 0,
        notes,
      });
      toast.success("Invoice created!");
      router.push(`/invoices/${invoice.id}`);
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button onClick={() => s.id <= step && setStep(s.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${step === s.id ? "bg-primary/10 text-primary border border-primary/20" : step > s.id ? "text-emerald-400" : "text-muted-foreground"}`}>
              {step > s.id ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step 1: Customer */}
      {step === 1 && (
        <Card className="bg-card/50">
          <CardHeader><CardTitle className="text-base">Select or Create Customer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!showNewCust ? (
              <>
                <Combobox
                  options={customers.map((c) => ({ value: c.id.toString(), label: `${c.name} — ${c.phone}` }))}
                  value={selectedCustomer?.id?.toString() || ""}
                  onChange={handleSelectCustomer}
                  placeholder="Select a customer..."
                  searchPlaceholder="Search customer..."
                  emptyText="No customer found."
                />
                {selectedCustomer && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="font-semibold">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                  </div>
                )}
                <Button variant="outline" className="gap-2 cursor-pointer" onClick={() => setShowNewCust(true)}><Plus className="w-4 h-4" />New Customer</Button>
              </>
            ) : (
              <div className="space-y-3">
                <Input placeholder="Name *" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} />
                <Input placeholder="Phone *" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} />
                <div className="flex gap-2">
                  <Button className="cursor-pointer" onClick={handleCreateCustomer} disabled={!newCustName || !newCustPhone}>Create</Button>
                  <Button variant="ghost" className="cursor-pointer" onClick={() => setShowNewCust(false)}>Cancel</Button>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button className="gap-2 cursor-pointer" disabled={!selectedCustomer} onClick={() => setStep(2)}>Next <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Vehicle */}
      {step === 2 && (
        <Card className="bg-card/50">
          <CardHeader><CardTitle className="text-base">Select or Add Vehicle</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!showNewVehicle ? (
              <>
                {customerVehicles.length > 0 ? (
                  <div className="space-y-2">
                    {customerVehicles.map((v) => (
                      <button key={v.id} onClick={() => setSelectedVehicle(v)} className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer ${selectedVehicle?.id === v.id ? "border-primary/30 bg-primary/5" : "border-border/30 hover:bg-accent/30"}`}>
                        <p className="font-mono font-semibold text-sm">{v.registrationNumber}</p>
                        <p className="text-xs text-muted-foreground">{v.brand} {v.model || ""}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No vehicles for this customer.</p>
                )}
                <Button variant="outline" className="gap-2 cursor-pointer" onClick={() => setShowNewVehicle(true)}><Plus className="w-4 h-4" />New Vehicle</Button>
              </>
            ) : (
              <div className="space-y-3">
                <Input placeholder="Reg Number *" value={newVehReg} onChange={(e) => setNewVehReg(e.target.value)} />
                <Combobox
                  options={tractorBrands.map((b) => ({ value: b, label: b }))}
                  value={newVehBrand}
                  onChange={(v) => { setNewVehBrand(v); setNewVehModel(""); }}
                  placeholder="Select Brand *"
                  searchPlaceholder="Search brand..."
                  emptyText="No brand found."
                  allowCustomValue
                />
                <Combobox
                  options={(tractorModelsMap as Record<string, string[]>)[newVehBrand]?.map((m) => ({ value: m, label: m })) || []}
                  value={newVehModel}
                  onChange={setNewVehModel}
                  placeholder="Select Model"
                  searchPlaceholder="Search model..."
                  emptyText={newVehBrand ? "No model found." : "Select brand first"}
                  disabled={!newVehBrand}
                  allowCustomValue
                />
                <div className="flex gap-2">
                  <Button className="cursor-pointer" onClick={handleCreateVehicle} disabled={!newVehReg || !newVehBrand}>Add</Button>
                  <Button variant="ghost" className="cursor-pointer" onClick={() => setShowNewVehicle(false)}>Cancel</Button>
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" className="gap-2 cursor-pointer" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4" />Back</Button>
              <Button className="gap-2 cursor-pointer" onClick={() => setStep(3)}>Next <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Labor */}
      {step === 3 && (
        <Card className="bg-card/50">
          <CardHeader><CardTitle className="text-base">Labor Charges</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-7 space-y-1">
                <Label className="text-xs">Description</Label>
                <Combobox
                  options={tractorServices.map((s) => ({ value: s.name, label: s.name }))}
                  value={labDesc}
                  onChange={setLabDesc}
                  placeholder="Select service..."
                  searchPlaceholder="Search services..."
                  emptyText="No service found."
                  allowCustomValue
                />
              </div>
              <div className="col-span-3 space-y-1"><Label className="text-xs">Labour Charge (₹)</Label><Input type="number" placeholder="500" value={labRate} onChange={(e) => setLabRate(e.target.value)} /></div>
              <div className="col-span-2"><Button className="w-full cursor-pointer" onClick={addLaborItem} disabled={!labDesc || !labRate}><Plus className="w-4 h-4" /></Button></div>
            </div>
            {laborItems.length > 0 && (
              <div className="space-y-2">
                {laborItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/20 border border-border/20">
                    <div>
                      <p className="text-sm font-medium">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">₹{(item.rate).toLocaleString("en-IN")}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive cursor-pointer" onClick={() => setLaborItems((p) => p.filter((i) => i.id !== item.id))}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                <p className="text-right text-sm font-semibold">Labor Total: ₹{laborTotal.toLocaleString("en-IN")}</p>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" className="gap-2 cursor-pointer" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4" />Back</Button>
              <Button className="gap-2 cursor-pointer" onClick={() => setStep(4)}>Next <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Parts */}
      {step === 4 && (
        <Card className="bg-card/50">
          <CardHeader><CardTitle className="text-base">Spare Parts</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-7 space-y-1">
                <Label className="text-xs">Select Part</Label>
                <Combobox
                  options={combinedParts.map((p) => ({ value: p, label: p }))}
                  value={selectedPartId}
                  onChange={(val) => handlePartSearch(val)}
                  placeholder="Select part..."
                  searchPlaceholder="Search parts..."
                  emptyText="No part found."
                  allowCustomValue
                />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Price (₹)</Label>
                <Input type="number" placeholder="150" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} />
              </div>
              <div className="col-span-2">
                <Button className="w-full cursor-pointer" onClick={addPartItemManual} disabled={!selectedPartId || !partPrice}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {partItems.length > 0 && (
              <div className="space-y-2">
                {partItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/20 border border-border/20">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.partName}</p>
                      <p className="text-xs text-muted-foreground">₹{item.unitPrice} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => setPartItems((p) => p.map((i) => i.id === item.id && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i))}>-</Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => setPartItems((p) => p.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))}>+</Button>
                      </div>
                      <span className="font-semibold text-sm w-20 text-right">₹{(item.quantity * item.unitPrice).toLocaleString("en-IN")}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive cursor-pointer" onClick={() => setPartItems((p) => p.filter((i) => i.id !== item.id))}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                <p className="text-right text-sm font-semibold">Parts Total: ₹{partsTotal.toLocaleString("en-IN")}</p>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" className="gap-2 cursor-pointer" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4" />Back</Button>
              <Button className="gap-2 cursor-pointer" onClick={() => setStep(5)}>Review <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div className="space-y-4">
          <Card className="bg-card/50">
            <CardHeader><CardTitle className="text-base">Invoice Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Customer & Vehicle */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-accent/20">
                  <p className="text-xs text-muted-foreground uppercase">Customer</p>
                  <p className="font-semibold">{selectedCustomer?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer?.phone}</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/20">
                  <p className="text-xs text-muted-foreground uppercase">Vehicle</p>
                  <p className="font-semibold">{selectedVehicle?.registrationNumber || "Not selected"}</p>
                  <p className="text-sm text-muted-foreground">{selectedVehicle?.brand} {selectedVehicle?.model || ""}</p>
                </div>
              </div>

              <Separator />

              {/* Items summary */}
              {laborItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Labor ({laborItems.length})</p>
                  {laborItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span>{item.description}</span>
                      <span>₹{(item.rate).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              )}
              {partItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Parts ({partItems.length})</p>
                  {partItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span>{item.partName} × {item.quantity}</span>
                      <span>₹{(item.quantity * item.unitPrice).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Tax & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Tax Rate</Label>
                  <Select value={selectedTaxRate} onValueChange={(v) => setSelectedTaxRate(v || "")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {taxRates.map((t) => (<SelectItem key={t.id} value={t.rate.toString()}>{t.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Discount</Label>
                  <div className="flex gap-2">
                    <Select value={discountType} onValueChange={(v) => setDiscountType((v || "fixed") as "fixed" | "percent")}>
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">₹ Fixed</SelectItem>
                        <SelectItem value="percent">% Percent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Invoice Notes / Remarks</Label>
                <Textarea placeholder="Any additional details..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <Separator />

              {/* Grand Total */}
              <div className="space-y-2 text-right">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Labor</span><span>₹{laborTotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Parts</span><span>₹{partsTotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
                {Number(selectedTaxRate) > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({selectedTaxRate}%)</span><span>₹{taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>}
                {discountAmount > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>Discount</span><span>-₹{discountAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span className="text-primary">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" className="gap-2 cursor-pointer" onClick={() => setStep(4)}><ArrowLeft className="w-4 h-4" />Back</Button>
                <Button className="gap-2 cursor-pointer" size="lg" onClick={handleSubmit} disabled={loading || (!laborItems.length && !partItems.length)}>
                  {loading ? "Creating..." : <><Check className="w-4 h-4" />Create Invoice</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
