"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, Truck, Wrench, Package, Calculator, Plus, Trash2, Check, Minus } from "lucide-react";
import { createCustomer } from "@/lib/actions/customers";
import { createVehicle, getVehiclesByCustomer } from "@/lib/actions/vehicles";
import { createEstimate, type LaborItem, type PartItem } from "@/lib/actions/estimates";
import { toast } from "sonner";
import tractorServices from "../../../../../00 services/tractor_services.json";
import partsData from "../../../../../00 services/tractor_spare_parts_seed.json";
import tractorBrands from "../../../../../00 services/tractor_brands.json";
import tractorModelsMap from "../../../../../00 services/tractor_models.json";

interface Customer { id: number; name: string; phone: string; }
interface SparePart { id: number; name: string; unit: string | null; categoryName: string | null; sellingPrice: number | null; }
interface TaxRate { id: number; name: string; rate: number; isDefault: boolean | null; }
interface Vehicle { id: number; registrationNumber: string; brand: string; model: string | null; }

const sections = [
  { id: "customer", label: "Customer", icon: Users },
  { id: "vehicle", label: "Vehicle", icon: Truck },
  { id: "labor", label: "Labor", icon: Wrench },
  { id: "parts", label: "Parts", icon: Package },
  { id: "summary", label: "Summary", icon: Calculator },
];

export function EstimateWizard({ customers, spareParts, taxRates }: { customers: Customer[]; spareParts: SparePart[]; taxRates: TaxRate[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("customer");

  // Refs for scroll-to-section
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // ── Customer state ──────────────────────────────────────────────────
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [showNewCust, setShowNewCust] = useState(false);

  // ── Vehicle state ───────────────────────────────────────────────────
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newVehReg, setNewVehReg] = useState("");
  const [newVehBrand, setNewVehBrand] = useState("");
  const [newVehModel, setNewVehModel] = useState("");

  // ── Labor state ─────────────────────────────────────────────────────
  const [laborItems, setLaborItems] = useState<(LaborItem & { id: string })[]>([]);
  const [labDesc, setLabDesc] = useState("");
  const [labRate, setLabRate] = useState("");

  // ── Parts state ─────────────────────────────────────────────────────
  const combinedParts = Array.from(
    new Set([...spareParts.map((p) => p.name), ...partsData.map((p) => p.name)])
  ).sort();
  const [partItems, setPartItems] = useState<(PartItem & { id: string; partName: string })[]>([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partPrice, setPartPrice] = useState("");

  // ── Items tab (Labor vs Parts) ──────────────────────────────────────
  const [itemsTab, setItemsTab] = useState<"labor" | "parts">("labor");

  // ── Tax & Discount ──────────────────────────────────────────────────
  const defaultTax = taxRates.find((t) => t.isDefault);
  const [selectedTaxRate, setSelectedTaxRate] = useState(defaultTax?.rate?.toString() || "0");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState("0");
  const [notes, setNotes] = useState("");

  // ── Calculations ────────────────────────────────────────────────────
  const laborTotal = laborItems.reduce((s, i) => s + i.hours * i.rate, 0);
  const partsTotal = partItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const subtotal = laborTotal + partsTotal;
  const taxAmount = subtotal * (Number(selectedTaxRate) / 100);
  const discountAmount = discountType === "percent" ? subtotal * (Number(discountValue) / 100) : Number(discountValue);
  const grandTotal = subtotal + taxAmount - discountAmount;

  // ── IntersectionObserver for progress rail ──────────────────────────
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(s.id);
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = useCallback((id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Handlers (unchanged business logic) ─────────────────────────────
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
    const dbPart = spareParts.find((p) => p.name === name);
    if (dbPart && dbPart.sellingPrice != null) {
      setPartPrice(dbPart.sellingPrice.toString());
    }
  };

  const addPartItemManual = () => {
    if (!selectedPartId || !partPrice) return;
    const dbPart = spareParts.find((p) => p.name === selectedPartId);
    const existing = partItems.find((p) => p.partName === selectedPartId);
    if (existing) {
      setPartItems((prev) => prev.map((p) => p.partName === selectedPartId ? { ...p, quantity: p.quantity + 1, unitPrice: Number(partPrice) } : p));
    } else {
      setPartItems((prev) => [...prev, {
        id: crypto.randomUUID(),
        sparePartId: dbPart?.id,
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
      const estimateId = await createEstimate({
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle?.id,
        laborItems: laborItems.map(item => ({ description: item.description, hours: item.hours, rate: item.rate })),
        partItems: partItems.map(item => ({ sparePartId: item.sparePartId, partName: item.partName, quantity: item.quantity, unitPrice: item.unitPrice })),
        taxRate: Number(selectedTaxRate),
        discountType,
        discountValue: Number(discountValue),
        notes,
      });
      toast.success("Estimate created!");
      router.push(`/estimates/${estimateId}`);
    } catch {
      toast.error("Failed to create estimate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto scroll-smooth-section">
      {/* ── Progress Rail (sticky) ─────────────────────────────────── */}
      <div className="sticky top-16 z-20 -mx-6 px-6 py-3 mb-6" style={{ background: "oklch(0.12 0.008 260 / 92%)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-1 overflow-x-auto">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeSection === s.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
              {/* Completion indicators */}
              {s.id === "customer" && selectedCustomer && <Check className="w-3 h-3 text-emerald-400 ml-1" />}
              {s.id === "vehicle" && selectedVehicle && <Check className="w-3 h-3 text-emerald-400 ml-1" />}
              {s.id === "labor" && laborItems.length > 0 && <span className="text-[10px] text-emerald-400 ml-1">{laborItems.length}</span>}
              {s.id === "parts" && partItems.length > 0 && <span className="text-[10px] text-emerald-400 ml-1">{partItems.length}</span>}
            </button>
          ))}
          {/* Inline mini total */}
          {grandTotal > 0 && (
            <span className="ml-auto text-xs font-bold text-primary whitespace-nowrap">
              ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6 block-stagger pb-24">
        {/* ═══════════════════════════════════════════════════════════
            SECTION 1: CUSTOMER
        ═══════════════════════════════════════════════════════════ */}
        <div ref={(el) => { sectionRefs.current.customer = el; }} id="customer" className="block-section">
          <div className="block-label">Customer</div>

          {!showNewCust ? (
            <div className="space-y-3">
              <Combobox
                options={customers.map((c) => ({ value: c.id.toString(), label: `${c.name} — ${c.phone}` }))}
                value={selectedCustomer?.id?.toString() || ""}
                onChange={handleSelectCustomer}
                placeholder="Search or select customer..."
                searchPlaceholder="Search by name or phone..."
                emptyText="No customer found."
              />
              {selectedCustomer && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-500/5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{selectedCustomer.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowNewCust(true)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />New Customer
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Name *</Label>
                  <Input placeholder="Customer name" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Phone *</Label>
                  <Input placeholder="Mobile number" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="cursor-pointer" onClick={handleCreateCustomer} disabled={!newCustName || !newCustPhone}>Create</Button>
                <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => setShowNewCust(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 2: VEHICLE
        ═══════════════════════════════════════════════════════════ */}
        <div ref={(el) => { sectionRefs.current.vehicle = el; }} id="vehicle" className="block-section">
          <div className="block-label">Vehicle</div>

          {!showNewVehicle ? (
            <div className="space-y-3">
              {customerVehicles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {customerVehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVehicle(v)}
                      className={`px-3 py-2 rounded-lg text-left transition-all cursor-pointer text-sm ${
                        selectedVehicle?.id === v.id
                          ? "bg-primary/10 ring-1 ring-primary/20"
                          : "bg-accent/20 hover:bg-accent/40"
                      }`}
                    >
                      <span className="font-mono font-semibold text-xs">{v.registrationNumber}</span>
                      <span className="text-xs text-muted-foreground ml-2">{v.brand} {v.model || ""}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {selectedCustomer ? "No vehicles for this customer." : "Select a customer first."}
                </p>
              )}
              <button
                onClick={() => setShowNewVehicle(true)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />New Vehicle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Registration Number *</Label>
                <Input placeholder="MH 12 AB 1234" value={newVehReg} onChange={(e) => setNewVehReg(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Brand *</Label>
                  <Select
                    value={newVehBrand}
                    onValueChange={(v) => { setNewVehBrand(v || ""); setNewVehModel(""); }}
                  >
                    <SelectTrigger className="w-full bg-transparent border-border/40">
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {tractorBrands.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Model</Label>
                  <Select
                    value={newVehModel}
                    onValueChange={(v) => setNewVehModel(v || "")}
                    disabled={!newVehBrand}
                  >
                    <SelectTrigger className="w-full bg-transparent border-border/40">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {((tractorModelsMap as Record<string, string[]>)[newVehBrand] || []).map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="cursor-pointer" onClick={handleCreateVehicle} disabled={!newVehReg || !newVehBrand}>Add Vehicle</Button>
                <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => setShowNewVehicle(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 3 & 4: INVOICE ITEMS (Labor + Parts tabs)
        ═══════════════════════════════════════════════════════════ */}
        <div className="block-section">
          <div className="flex items-center justify-between mb-4">
            <div className="block-label !mb-0">Estimate Items</div>
            {/* Inline tabs */}
            <div className="flex gap-1">
              <button
                ref={(el) => { sectionRefs.current.labor = el; }}
                onClick={() => setItemsTab("labor")}
                className={`inline-tab ${itemsTab === "labor" ? "inline-tab-active" : ""}`}
              >
                <Wrench className="w-3 h-3 inline mr-1" />Labor
                {laborItems.length > 0 && <span className="ml-1 text-emerald-400">({laborItems.length})</span>}
              </button>
              <button
                ref={(el) => { sectionRefs.current.parts = el; }}
                onClick={() => setItemsTab("parts")}
                className={`inline-tab ${itemsTab === "parts" ? "inline-tab-active" : ""}`}
              >
                <Package className="w-3 h-3 inline mr-1" />Parts
                {partItems.length > 0 && <span className="ml-1 text-emerald-400">({partItems.length})</span>}
              </button>
            </div>
          </div>

          {/* ── Labor Tab ──────────────────────────────────────────── */}
          {itemsTab === "labor" && (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-7 sm:col-span-8 space-y-1">
                  <Label className="text-xs text-muted-foreground">Service</Label>
                  <Combobox
                    options={tractorServices.map((s) => ({ value: s.name, label: s.name }))}
                    value={labDesc}
                    onChange={setLabDesc}
                    placeholder="Select or type service..."
                    searchPlaceholder="Search services..."
                    emptyText="No service found."
                    allowCustomValue
                  />
                </div>
                <div className="col-span-3 sm:col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Charge (₹)</Label>
                  <Input type="number" placeholder="500" value={labRate} onChange={(e) => setLabRate(e.target.value)} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Button size="sm" className="w-full cursor-pointer h-8" onClick={addLaborItem} disabled={!labDesc || !labRate}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {laborItems.length > 0 && (
                <div className="space-y-1 mt-2">
                  {laborItems.map((item) => (
                    <div key={item.id} className="item-row flex items-center justify-between">
                      <span className="text-sm">{item.description}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium tabular-nums">₹{item.rate.toLocaleString("en-IN")}</span>
                        <button
                          onClick={() => setLaborItems((p) => p.filter((i) => i.id !== item.id))}
                          className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="block-divider" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Labor Total</span>
                    <span className="font-semibold">₹{laborTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Parts Tab ──────────────────────────────────────────── */}
          {itemsTab === "parts" && (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-7 sm:col-span-8 space-y-1">
                  <Label className="text-xs text-muted-foreground">Part</Label>
                  <Combobox
                    options={combinedParts.map((p) => ({ value: p, label: p }))}
                    value={selectedPartId}
                    onChange={(val) => handlePartSearch(val)}
                    placeholder="Select or type part..."
                    searchPlaceholder="Search parts..."
                    emptyText="No part found."
                    allowCustomValue
                  />
                </div>
                <div className="col-span-3 sm:col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Price (₹)</Label>
                  <Input type="number" placeholder="150" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Button size="sm" className="w-full cursor-pointer h-8" onClick={addPartItemManual} disabled={!selectedPartId || !partPrice}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {partItems.length > 0 && (
                <div className="space-y-1 mt-2">
                  {partItems.map((item) => (
                    <div key={item.id} className="item-row flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm">{item.partName}</span>
                        <span className="text-xs text-muted-foreground ml-2">₹{item.unitPrice} × {item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Quantity stepper */}
                        <div className="flex items-center gap-0.5">
                          <button
                            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
                            onClick={() => setPartItems((p) => p.map((i) => i.id === item.id && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i))}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-medium tabular-nums">{item.quantity}</span>
                          <button
                            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
                            onClick={() => setPartItems((p) => p.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-medium tabular-nums w-16 text-right">₹{(item.quantity * item.unitPrice).toLocaleString("en-IN")}</span>
                        <button
                          onClick={() => setPartItems((p) => p.filter((i) => i.id !== item.id))}
                          className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="block-divider" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Parts Total</span>
                    <span className="font-semibold">₹{partsTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 5: TAX & DISCOUNT
        ═══════════════════════════════════════════════════════════ */}
        <div className="block-section">
          <div className="block-label">Tax & Discount</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tax Rate</Label>
              <Select value={selectedTaxRate} onValueChange={(v) => setSelectedTaxRate(v || "")}>
                <SelectTrigger className="bg-transparent border-border/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {taxRates.map((t) => (<SelectItem key={t.id} value={t.rate.toString()}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Discount</Label>
              <div className="flex gap-2">
                <Select value={discountType} onValueChange={(v) => setDiscountType((v || "fixed") as "fixed" | "percent")}>
                  <SelectTrigger className="w-24 bg-transparent border-border/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">₹ Fixed</SelectItem>
                    <SelectItem value="percent">% Percent</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="flex-1 border-border/40" />
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes / Remarks</Label>
            <Textarea placeholder="Any additional details..." value={notes} onChange={(e) => setNotes(e.target.value)} className="border-border/40 min-h-[60px]" />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 6: PAYMENT SUMMARY
        ═══════════════════════════════════════════════════════════ */}
        <div ref={(el) => { sectionRefs.current.summary = el; }} id="summary" className="block-section-elevated">
          <div className="block-label">Payment Summary</div>

          <div className="space-y-0.5">
            {laborTotal > 0 && (
              <div className="summary-row">
                <span className="summary-row-label">Labor</span>
                <span>₹{laborTotal.toLocaleString("en-IN")}</span>
              </div>
            )}
            {partsTotal > 0 && (
              <div className="summary-row">
                <span className="summary-row-label">Parts</span>
                <span>₹{partsTotal.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="summary-row">
              <span className="summary-row-label">Subtotal</span>
              <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {Number(selectedTaxRate) > 0 && (
              <div className="summary-row">
                <span className="summary-row-label">Tax ({selectedTaxRate}%)</span>
                <span>₹{taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="summary-row">
                <span className="text-emerald-400">Discount</span>
                <span className="text-emerald-400">-₹{discountAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <div className="block-divider" />

          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">Grand Total</span>
            <span className="summary-total hero-total">
              ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            ACTION BAR
        ═══════════════════════════════════════════════════════════ */}
        <div className="sticky-action-bar md:relative md:bg-transparent md:backdrop-filter-none md:border-0 md:p-0 flex justify-end">
          <Button
            size="lg"
            className="gap-2 cursor-pointer px-8"
            onClick={handleSubmit}
            disabled={loading || !selectedCustomer || (!laborItems.length && !partItems.length)}
          >
            {loading ? "Creating..." : <><Check className="w-4 h-4" />Create Estimate</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
