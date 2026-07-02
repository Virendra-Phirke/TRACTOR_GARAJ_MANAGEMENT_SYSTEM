"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building, QrCode, Percent, Check, Palette, Eye, FileText } from "lucide-react";
import { updateGarageSettings, updateUpiSettings, setDefaultTax } from "@/lib/actions/settings";
import { toast } from "sonner";

interface GarageSettings { id: number; name: string; address: string | null; phone: string | null; email: string | null; gstNumber: string | null; tagline: string | null; invoiceTheme: string | null; invoiceFormat: string | null; }
interface UpiSettings { id: number; vpa: string; payeeName: string; merchantCode: string | null; isEnabled: boolean | null; }
interface TaxSetting { id: number; name: string; rate: number; isDefault: boolean | null; isActive: boolean | null; }

// Mini invoice preview components for each format
function StandardInvoicePreview({ theme }: { theme: string }) {
  const colors = getPreviewColors(theme);
  return (
    <div className="w-full aspect-[1/1.35] bg-white rounded-md border shadow-sm overflow-hidden flex flex-col text-[5px] leading-[7px] text-gray-800 p-2">
      {/* Header */}
      <div className="flex justify-between items-start mb-1.5">
        <div>
          <div className="font-bold text-[7px]" style={{ color: colors.primary }}>GARAGE NAME</div>
          <div className="text-gray-400 text-[4px]">Address & Contact</div>
          <div className="text-gray-400 text-[4px]">GSTIN: 22AAAAA0000A1Z5</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-[6px]" style={{ color: colors.primary }}>TAX INVOICE</div>
          <div className="text-[4px] text-gray-500">INV-001 | 01 Jul 2026</div>
        </div>
      </div>
      <div className="h-[1px] mb-1.5" style={{ background: colors.primary }} />
      {/* Bill To / Vehicle */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded text-[4px] mb-1.5" style={{ background: colors.lightBg }}>
        <div><span className="font-bold" style={{ color: colors.primary }}>BILL TO</span><br/>Customer Name<br/>Phone: 9876543210</div>
        <div><span className="font-bold" style={{ color: colors.primary }}>VEHICLE</span><br/>Mahindra 575 DI<br/>Reg: MH-XX-1234</div>
      </div>
      {/* Table */}
      <div className="flex-1">
        <div className="flex text-white text-[4px] font-bold p-0.5 rounded-sm" style={{ background: colors.tableHeader }}>
          <span className="flex-1">Description</span><span className="w-8 text-right">Qty</span><span className="w-10 text-right">Amount</span>
        </div>
        <div className="flex p-0.5 text-[4px] bg-gray-50"><span className="flex-1">Engine Oil</span><span className="w-8 text-right">2</span><span className="w-10 text-right">₹1,200</span></div>
        <div className="flex p-0.5 text-[4px]"><span className="flex-1">Oil Filter</span><span className="w-8 text-right">1</span><span className="w-10 text-right">₹350</span></div>
        <div className="flex p-0.5 text-[4px] bg-gray-50"><span className="flex-1">Labor Charge</span><span className="w-8 text-right">-</span><span className="w-10 text-right">₹800</span></div>
      </div>
      {/* Totals */}
      <div className="text-right mt-auto space-y-0.5 pt-1 border-t border-gray-200">
        <div className="text-[4px]">Subtotal: ₹2,350</div>
        <div className="text-[4px]">CGST @9%: ₹211.50</div>
        <div className="text-[4px]">SGST @9%: ₹211.50</div>
        <div className="font-bold text-[6px] pt-0.5 border-t border-gray-300" style={{ color: colors.primary }}>Total: ₹2,773</div>
      </div>
    </div>
  );
}

function ModernInvoicePreview({ theme }: { theme: string }) {
  const colors = getPreviewColors(theme);
  return (
    <div className="w-full aspect-[1/1.35] bg-white rounded-md border shadow-sm overflow-hidden flex flex-col text-[5px] leading-[7px] text-gray-800">
      {/* Centered Header */}
      <div className="text-center py-2 px-2" style={{ background: `${colors.primary}10` }}>
        <div className="font-bold text-[8px]" style={{ color: colors.primary }}>GARAGE NAME</div>
        <div className="text-gray-400 text-[4px]">Trusted Tractor Service Center</div>
        <div className="text-gray-400 text-[4px]">GSTIN: 22AAAAA0000A1Z5</div>
      </div>
      <div className="px-2 flex-1 flex flex-col">
        {/* Invoice Title */}
        <div className="flex justify-between items-center my-1.5">
          <span className="font-bold text-[6px]" style={{ color: colors.primary }}>INVOICE</span>
          <span className="text-[4px] text-gray-500">#INV-001 | 01 Jul 2026</span>
        </div>
        {/* Info Row */}
        <div className="grid grid-cols-2 gap-1 text-[4px] mb-1.5">
          <div><span className="font-bold" style={{ color: colors.primary }}>Bill To:</span><br/>Customer Name</div>
          <div><span className="font-bold" style={{ color: colors.primary }}>Vehicle:</span><br/>Mahindra 575 DI</div>
        </div>
        {/* Table */}
        <div className="flex-1">
          <div className="flex text-[4px] font-bold p-0.5 border-b-2" style={{ borderColor: colors.primary, color: colors.primary }}>
            <span className="flex-1">Item</span><span className="w-10 text-right">Amount</span>
          </div>
          <div className="flex p-0.5 text-[4px] border-b border-gray-100"><span className="flex-1">Engine Oil (2x)</span><span className="w-10 text-right">₹1,200</span></div>
          <div className="flex p-0.5 text-[4px] border-b border-gray-100"><span className="flex-1">Oil Filter</span><span className="w-10 text-right">₹350</span></div>
          <div className="flex p-0.5 text-[4px] border-b border-gray-100"><span className="flex-1">Labor Charge</span><span className="w-10 text-right">₹800</span></div>
        </div>
        {/* Totals */}
        <div className="mt-auto pt-1">
          <div className="flex justify-between text-[4px] text-gray-500"><span>Subtotal</span><span>₹2,350</span></div>
          <div className="flex justify-between text-[4px] text-gray-500"><span>GST (18%)</span><span>₹423</span></div>
          <div className="flex justify-between font-bold text-[6px] pt-0.5 border-t mt-0.5" style={{ borderColor: colors.primary, color: colors.primary }}>
            <span>TOTAL</span><span>₹2,773</span>
          </div>
        </div>
      </div>
      <div className="text-center text-[3.5px] text-gray-400 py-1">Thank you for your business!</div>
    </div>
  );
}

function CompactInvoicePreview({ theme }: { theme: string }) {
  const colors = getPreviewColors(theme);
  return (
    <div className="w-full aspect-[1/1.35] bg-white rounded-md border shadow-sm overflow-hidden flex flex-col text-[5px] leading-[7px] text-gray-800 p-1.5">
      {/* Centered Header */}
      <div className="text-center mb-1">
        <div className="font-bold text-[6px]" style={{ color: colors.primary }}>GARAGE NAME</div>
        <div className="text-gray-400 text-[3.5px]">Address | Phone</div>
      </div>
      <div className="border-t border-dashed border-gray-300 mb-1" />
      {/* Invoice Info */}
      <div className="flex justify-between text-[4px] mb-1">
        <span className="font-bold">INV-001</span>
        <span className="text-gray-500">01 Jul 2026</span>
      </div>
      <div className="text-[4px] mb-0.5">Customer: <span className="font-bold">Customer Name</span></div>
      <div className="text-[4px] mb-1">Vehicle: <span className="font-bold">MH-XX-1234</span></div>
      <div className="border-t border-dashed border-gray-300 mb-1" />
      {/* Items */}
      <div className="flex-1 space-y-0.5">
        <div className="flex justify-between text-[4px]"><span>Engine Oil x2</span><span>₹1,200</span></div>
        <div className="flex justify-between text-[4px]"><span>Oil Filter x1</span><span>₹350</span></div>
        <div className="flex justify-between text-[4px]"><span>Labor</span><span>₹800</span></div>
      </div>
      <div className="border-t border-dashed border-gray-300 my-1" />
      <div className="flex justify-between text-[4px]"><span>Subtotal</span><span>₹2,350</span></div>
      <div className="flex justify-between text-[4px]"><span>GST (18%)</span><span>₹423</span></div>
      <div className="flex justify-between font-bold text-[6px] pt-0.5 border-t border-gray-300 mt-0.5" style={{ color: colors.primary }}>
        <span>TOTAL</span><span>₹2,773</span>
      </div>
    </div>
  );
}

function getPreviewColors(theme: string) {
  switch (theme) {
    case "modern": return { primary: "#2563eb", lightBg: "#eff6ff", tableHeader: "#2563eb" }; // Ocean Blue
    case "minimal": return { primary: "#1a1a1a", lightBg: "#f9fafb", tableHeader: "#1a1a1a" }; // Minimal Dark
    case "bold": return { primary: "#dc2626", lightBg: "#fef2f2", tableHeader: "#1a1a1a" }; // Bold Red
    case "sunset": return { primary: "#d97706", lightBg: "#fffbeb", tableHeader: "#d97706" }; // Sunset Orange
    case "purple": return { primary: "#9333ea", lightBg: "#faf5ff", tableHeader: "#9333ea" }; // Purple
    case "teal": return { primary: "#0d9488", lightBg: "#f0fdfa", tableHeader: "#0d9488" }; // Teal
    case "slate": return { primary: "#475569", lightBg: "#f8fafc", tableHeader: "#475569" }; // Slate
    default: return { primary: "#15803d", lightBg: "#f0fdf4", tableHeader: "#15803d" }; // Classic Green
  }
}

export function SettingsClient({ garage, upi, taxes }: { garage: GarageSettings; upi: UpiSettings; taxes: TaxSetting[] }) {
  const router = useRouter();
  const [gLoading, setGLoading] = useState(false);
  const [uLoading, setULoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(garage.invoiceTheme || "default");
  const [selectedFormat, setSelectedFormat] = useState(garage.invoiceFormat || "standard");

  const handleGarage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await updateGarageSettings({
        name: form.get("name") as string,
        address: (form.get("address") as string) || "",
        phone: (form.get("phone") as string) || "",
        email: (form.get("email") as string) || "",
        gstNumber: (form.get("gstNumber") as string) || "",
        tagline: (form.get("tagline") as string) || "",
        invoiceTheme: form.get("invoiceTheme") as string,
        invoiceFormat: form.get("invoiceFormat") as string,
      });
      toast.success("Settings saved successfully");
      router.refresh();
    } catch { toast.error("Failed to save"); }
    finally { setGLoading(false); }
  };

  const handleUpi = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setULoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await updateUpiSettings({
        vpa: form.get("vpa") as string,
        payeeName: form.get("payeeName") as string,
        merchantCode: (form.get("merchantCode") as string) || "",
      });
      toast.success("UPI settings saved");
      router.refresh();
    } catch { toast.error("Failed to save"); }
    finally { setULoading(false); }
  };

  const handleDefaultTax = async (id: number) => {
    await setDefaultTax(id);
    toast.success("Default tax updated");
    router.refresh();
  };

  const PreviewForFormat = ({ format }: { format: string }) => {
    switch (format) {
      case "modern": return <ModernInvoicePreview theme={selectedTheme} />;
      case "compact": return <CompactInvoicePreview theme={selectedTheme} />;
      default: return <StandardInvoicePreview theme={selectedTheme} />;
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Garage Info */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Building className="w-4 h-4" />Garage Information</CardTitle>
          <CardDescription>This info appears on your invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <form key={JSON.stringify(garage)} onSubmit={handleGarage} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="name">Garage Name *</Label><Input id="name" name="name" required defaultValue={garage.name} /></div>
              <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" defaultValue={garage.phone || ""} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="address">Address</Label><Textarea id="address" name="address" rows={2} defaultValue={garage.address || ""} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={garage.email || ""} /></div>
              <div className="space-y-2"><Label htmlFor="gstNumber">GST Number</Label><Input id="gstNumber" name="gstNumber" defaultValue={garage.gstNumber || ""} placeholder="22AAAAA0000A1Z5" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="tagline">Tagline</Label><Input id="tagline" name="tagline" defaultValue={garage.tagline || ""} placeholder="Trusted Tractor Service Center" /></div>
            <Button type="submit" className="cursor-pointer" disabled={gLoading}>{gLoading ? "Saving..." : "Save Changes"}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Invoice Format & Theme */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><FileText className="w-4 h-4" />Invoice Layout & Theme</CardTitle>
          <CardDescription>Choose how your invoices look. Each format has a different structure, and each theme applies different colors.</CardDescription>
        </CardHeader>
        <CardContent>
          <form key={`${garage.invoiceFormat}-${garage.invoiceTheme}`} onSubmit={handleGarage} className="space-y-8">
            <input type="hidden" name="name" value={garage.name} />
            <input type="hidden" name="address" value={garage.address || ""} />
            <input type="hidden" name="phone" value={garage.phone || ""} />
            <input type="hidden" name="email" value={garage.email || ""} />
            <input type="hidden" name="gstNumber" value={garage.gstNumber || ""} />
            <input type="hidden" name="tagline" value={garage.tagline || ""} />

            {/* Format Selection with Live Preview */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Invoice Layout Format</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Select the structural layout for your invoices</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { id: "standard", label: "Standard", desc: "Classic two-column layout with bordered sections. Company info on left, invoice details on right." },
                  { id: "modern", label: "Modern", desc: "Centered company header with clean lines and a professional look." },
                  { id: "compact", label: "Compact", desc: "Space-saving receipt style layout, ideal for quick prints." },
                ].map((fmt) => (
                  <label key={fmt.id} className="cursor-pointer group">
                    <input
                      type="radio"
                      name="invoiceFormat"
                      value={fmt.id}
                      defaultChecked={(garage.invoiceFormat || "standard") === fmt.id}
                      onChange={() => setSelectedFormat(fmt.id)}
                      className="peer sr-only"
                    />
                    <div className="rounded-xl border-2 border-border/50 bg-card hover:border-border peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/20 transition-all overflow-hidden">
                      {/* Invoice Preview */}
                      <div className="p-3 pb-2">
                        <PreviewForFormat format={fmt.id} />
                      </div>
                      {/* Label */}
                      <div className="px-3 pb-3 pt-1">
                        <div className="font-semibold text-sm flex items-center gap-1.5">
                          {fmt.label}
                          {(garage.invoiceFormat || "standard") === fmt.id && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">Active</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{fmt.desc}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Theme Selection */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Color Theme</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Choose the color scheme applied to headers, borders, and accents</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: "default", label: "Green", color: "#15803d" },
                  { id: "modern", label: "Blue", color: "#2563eb" },
                  { id: "minimal", label: "Dark", color: "#1a1a1a" },
                  { id: "bold", label: "Red", color: "#dc2626" },
                  { id: "sunset", label: "Orange", color: "#d97706" },
                  { id: "purple", label: "Purple", color: "#9333ea" },
                  { id: "teal", label: "Teal", color: "#0d9488" },
                  { id: "slate", label: "Slate", color: "#475569" },
                ].map((theme) => (
                  <label key={theme.id} className="cursor-pointer group flex flex-col items-center gap-1.5" title={theme.label}>
                    <input
                      type="radio"
                      name="invoiceTheme"
                      value={theme.id}
                      defaultChecked={(garage.invoiceTheme || "default") === theme.id}
                      onChange={() => setSelectedTheme(theme.id)}
                      className="peer sr-only"
                    />
                    <div className="w-9 h-9 rounded-full shadow-sm hover:scale-110 transition-transform peer-checked:ring-2 peer-checked:ring-primary peer-checked:ring-offset-2 peer-checked:ring-offset-background flex items-center justify-center" style={{ backgroundColor: theme.color }}>
                      {selectedTheme === theme.id && (
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">{theme.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border/30">
              <Button type="submit" className="cursor-pointer" disabled={gLoading}>{gLoading ? "Saving..." : "Save Layout & Theme"}</Button>
              <Button type="button" variant="outline" className="cursor-pointer gap-1.5" onClick={() => {
                window.open(`/api/preview-invoice?theme=${selectedTheme}&format=${selectedFormat}`, '_blank');
              }}>
                <Eye className="w-3.5 h-3.5" />
                Preview Full PDF
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* UPI Settings */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><QrCode className="w-4 h-4" />UPI Payment Settings</CardTitle>
          <CardDescription>Configure UPI QR code for invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <form key={JSON.stringify(upi)} onSubmit={handleUpi} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="vpa">UPI VPA / ID *</Label><Input id="vpa" name="vpa" required defaultValue={upi.vpa} placeholder="yourname@upi" /></div>
              <div className="space-y-2"><Label htmlFor="payeeName">Payee Name *</Label><Input id="payeeName" name="payeeName" required defaultValue={upi.payeeName} placeholder="Garage Name" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="merchantCode">Merchant Code (optional)</Label><Input id="merchantCode" name="merchantCode" defaultValue={upi.merchantCode || ""} /></div>
            <Button type="submit" className="cursor-pointer" disabled={uLoading}>{uLoading ? "Saving..." : "Save UPI Settings"}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Tax Rates */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Percent className="w-4 h-4" />Tax Rates</CardTitle>
          <CardDescription>Select the default tax rate for new invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {taxes.map((tax) => (
              <div key={tax.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:bg-accent/20 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{tax.name}</span>
                  <Badge variant="outline">{tax.rate}%</Badge>
                </div>
                {tax.isDefault ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20"><Check className="w-3 h-3 mr-1" />Default</Badge>
                ) : (
                  <Button variant="ghost" size="sm" className="text-xs cursor-pointer" onClick={() => handleDefaultTax(tax.id)}>Set Default</Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
