"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building, QrCode, Percent, Check, Palette, Eye, FileText, Settings2, Moon, Sun, ChevronDown } from "lucide-react";
import { updateGarageSettings, updateUpiSettings, setDefaultTax } from "@/lib/actions/settings";
import { toast } from "sonner";
import { LayoutEditor } from "./layout-editor";
import { useTheme, COLOR_SCHEMES } from "@/components/theme-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface GarageSettings { id: number; name: string; address: string | null; phone: string | null; email: string | null; gstNumber: string | null; tagline: string | null; invoiceTheme: string | null; invoiceFormat: string | null; }
interface UpiSettings { id: number; vpa: string; payeeName: string; merchantCode: string | null; isEnabled: boolean | null; }
interface TaxSetting { id: number; name: string; rate: number; isDefault: boolean | null; isActive: boolean | null; }

// Mini invoice preview components for each format
function ClassicBoxedPreview({ theme }: { theme: string }) {
  const colors = getPreviewColors(theme);
  return (
    <div className="w-full aspect-[1/1.35] bg-white rounded-md border shadow-sm overflow-hidden flex flex-col text-[5px] leading-[7px] text-gray-800 p-2">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-[7px]" style={{ color: colors.primary }}>GARAGE NAME</div>
          <div className="text-gray-400 text-[4px]">Address | Contact</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-[7px]" style={{ color: colors.primary }}>TAX INVOICE</div>
          <div className="text-[4px] text-gray-500">INV-001 | 01 Jul</div>
        </div>
      </div>
      <div className="flex gap-1 mb-2">
        <div className="flex-1 border rounded p-1" style={{ borderColor: colors.primary }}>
          <div className="font-bold text-[4.5px] -mt-1.5 bg-white w-fit px-0.5" style={{ color: colors.primary }}>BILL TO</div>
          <div className="text-[4px]">Customer Name</div>
        </div>
        <div className="flex-1 border rounded p-1" style={{ borderColor: colors.primary }}>
          <div className="font-bold text-[4.5px] -mt-1.5 bg-white w-fit px-0.5" style={{ color: colors.primary }}>VEHICLE</div>
          <div className="text-[4px]">Tractor Model</div>
        </div>
      </div>
      <div className="flex-1">
        <div className="font-bold mb-0.5" style={{ color: colors.primary }}>LABOR CHARGES</div>
        <div className="flex text-gray-800 text-[4px] font-bold p-0.5 bg-gray-100">
          <span className="flex-1">Description</span><span className="w-10 text-right">Amount</span>
        </div>
        <div className="flex p-0.5 text-[4px]"><span className="flex-1">Service</span><span className="w-10 text-right">₹800</span></div>
        <div className="flex p-0.5 text-[4px] bg-gray-50"><span className="flex-1">Cleaning</span><span className="w-10 text-right">₹350</span></div>
      </div>
      <div className="flex justify-end mt-1">
        <div className="w-24 border p-1" style={{ borderColor: colors.primary }}>
          <div className="flex justify-between text-[4px]"><span>Subtotal</span><span>₹1,150</span></div>
          <div className="flex justify-between font-bold text-[5px] pt-0.5 mt-0.5 border-t" style={{ borderColor: colors.primary, color: colors.primary }}>
            <span>TOTAL</span><span>₹1,250</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CenteredProPreview({ theme }: { theme: string }) {
  const colors = getPreviewColors(theme);
  return (
    <div className="w-full aspect-[1/1.35] bg-white rounded-md border shadow-sm overflow-hidden flex flex-col text-[5px] leading-[7px] text-gray-800 p-0 relative">
      <div className="h-1 w-full absolute top-0 left-0" style={{ background: colors.primary }} />
      <div className="p-2 flex-1 flex flex-col pt-3">
        <div className="text-center mb-1">
          <div className="font-bold text-[7px]" style={{ color: colors.primary }}>GARAGE NAME</div>
          <div className="text-gray-400 text-[4px]">Address | Contact</div>
        </div>
        <div className="bg-gray-100 p-0.5 px-1 flex justify-between text-[4.5px] font-bold mb-2">
          <span>INV-001</span><span>01 Jul 2026</span>
        </div>
        <div className="flex gap-2 border p-1 mb-2">
          <div className="flex-1 border-r text-[4px]">
             <span className="font-bold">BILL TO</span><br/>Customer Name
          </div>
          <div className="flex-1 text-[4px]">
             <span className="font-bold">VEHICLE</span><br/>Tractor Model
          </div>
        </div>
        <div className="flex-1">
          <div className="flex text-white text-[4px] font-bold p-0.5" style={{ background: '#222' }}>
            <span className="flex-1">Description</span><span className="w-10 text-right">Total</span>
          </div>
          <div className="font-bold text-[4px] p-0.5" style={{ color: colors.primary }}>LABOR</div>
          <div className="flex px-0.5 pb-0.5 text-[4px] border-b"><span className="flex-1">Service</span><span className="w-10 text-right">₹800</span></div>
        </div>
        <div className="text-right pt-1">
          <div className="text-[4px]">Subtotal: ₹800</div>
          <div className="font-bold text-[6px]" style={{ color: colors.primary }}>TOTAL: ₹800</div>
        </div>
      </div>
    </div>
  );
}

function GridStructuredPreview({ theme }: { theme: string }) {
  const colors = getPreviewColors(theme);
  return (
    <div className="w-full aspect-[1/1.35] bg-white rounded-md border shadow-sm overflow-hidden flex flex-col text-[5px] leading-[7px] text-gray-800 p-2">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-[7px]" style={{ color: colors.primary }}>GARAGE NAME</div>
          <div className="text-gray-400 text-[4px]">Contact Info</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-[6px]" style={{ color: colors.primary }}>TAX INVOICE</div>
          <div className="text-[4px]">INV-001</div>
        </div>
      </div>
      <div className="flex gap-1 mb-2">
        <div className="flex-1 border p-1" style={{ borderColor: colors.primary }}>
          <div className="font-bold text-[4px]">BILL TO: Customer</div>
        </div>
        <div className="flex-1 border p-1" style={{ borderColor: colors.primary }}>
          <div className="font-bold text-[4px]">VEHICLE: Tractor</div>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex font-bold bg-gray-100 border text-[4px]">
          <span className="flex-1 p-0.5 border-r">DESC</span><span className="w-10 p-0.5 text-right">TOTAL</span>
        </div>
        <div className="border border-t-0 p-0.5 font-bold text-[4.5px]">LABOR</div>
        <div className="flex border border-t-0 text-[4px]">
          <span className="flex-1 p-0.5 border-r">Service</span><span className="w-10 p-0.5 text-right">₹800</span>
        </div>
        <div className="flex border border-t-0 text-[4px] font-bold">
          <span className="flex-1 p-0.5 border-r">Total Labor</span><span className="w-10 p-0.5 text-right">₹800</span>
        </div>
      </div>
      <div className="flex justify-end mt-1">
        <div className="w-24">
          <div className="flex border text-[4px]"><span className="flex-1 p-0.5 border-r">Subtotal</span><span className="w-10 p-0.5 text-right">₹800</span></div>
          <div className="flex border border-t-0 font-bold text-[5px] bg-red-50" style={{ color: colors.primary }}>
            <span className="flex-1 p-0.5 border-r">TOTAL</span><span className="w-10 p-0.5 text-right">₹800</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModernAccentPreview({ theme }: { theme: string }) {
  const colors = getPreviewColors(theme);
  return (
    <div className="w-full aspect-[1/1.35] bg-white rounded-md border shadow-sm overflow-hidden flex flex-col text-[5px] leading-[7px] text-gray-800 p-2 relative">
      <div className="absolute top-12 left-6 text-green-500 opacity-20 font-bold text-2xl -rotate-12">PAID</div>
      <div className="flex justify-between mb-2">
        <div><div className="font-bold text-[7px]" style={{ color: colors.primary }}>GARAGE NAME</div><div className="text-[4px]">Contact</div></div>
        <div className="text-right font-bold text-[6px]" style={{ color: colors.primary }}>INVOICE</div>
      </div>
      <div className="flex gap-1 mb-2">
        <div className="flex-1 border p-1" style={{ borderColor: colors.primary }}>
          <div className="font-bold text-[4px]">BILL TO: Name</div>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex bg-gray-100 p-0.5 text-[4px] font-bold mb-1">
          <span className="flex-1">DESCRIPTION</span><span className="w-8 text-right">TOTAL</span>
        </div>
        <div className="flex text-[4px]">
          <div className="w-16 bg-gray-100 p-0.5">Service</div>
          <div className="flex-1 p-0.5 text-right">₹800</div>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="w-20">
          <div className="flex justify-between text-[4px]"><span>Subtotal</span><span>₹800</span></div>
          <div className="flex justify-between font-bold text-[5px] bg-red-50 p-0.5 mt-0.5 border-t" style={{ borderColor: colors.primary, color: colors.primary }}>
            <span>TOTAL</span><span>₹800</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StandardInvoicePreview({ theme }: { theme: string }) {
  const colors = getPreviewColors(theme);
  return (
    <div className="w-full aspect-[1/1.35] bg-white rounded-md border shadow-sm overflow-hidden flex flex-col text-[5px] leading-[7px] text-gray-800 p-2">
      <div className="flex justify-between items-start mb-1.5">
        <div>
          <div className="font-bold text-[7px]" style={{ color: colors.primary }}>GARAGE NAME</div>
          <div className="text-gray-400 text-[4px]">Address & Contact</div>
          <div className="text-gray-400 text-[4px]">GSTIN: 22AAAAA0000A1Z5</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-[6px]" style={{ color: colors.primary }}>TAX INVOICE</div>
          <div className="text-[4px] text-gray-500">INV-001 | 01 Jul</div>
        </div>
      </div>
      <div className="h-[1px] mb-1.5" style={{ background: colors.primary }} />
      <div className="grid grid-cols-2 gap-1 p-1 rounded text-[4px] mb-1.5" style={{ background: '#f5f5f5' }}>
        <div><span className="font-bold" style={{ color: colors.primary }}>BILL TO</span><br/>Customer Name<br/>Phone: 9876543210</div>
        <div><span className="font-bold" style={{ color: colors.primary }}>VEHICLE</span><br/>Mahindra 575 DI<br/>Reg: MH-XX-1234</div>
      </div>
      <div className="flex-1">
        <div className="flex text-white text-[4px] font-bold p-0.5 rounded-sm" style={{ background: colors.primary }}>
          <span className="flex-1">Description</span><span className="w-8 text-right">Qty</span><span className="w-10 text-right">Amount</span>
        </div>
        <div className="flex p-0.5 text-[4px] bg-gray-50"><span className="flex-1">Engine Oil</span><span className="w-8 text-right">2</span><span className="w-10 text-right">₹1,200</span></div>
        <div className="flex p-0.5 text-[4px]"><span className="flex-1">Oil Filter</span><span className="w-8 text-right">1</span><span className="w-10 text-right">₹350</span></div>
        <div className="flex p-0.5 text-[4px] bg-gray-50"><span className="flex-1">Labor</span><span className="w-8 text-right">-</span><span className="w-10 text-right">₹800</span></div>
      </div>
      <div className="text-right mt-auto pt-1 flex justify-end">
        <div className="w-24 bg-gray-100 p-1 border">
          <div className="flex justify-between text-[4px]"><span>Subtotal</span><span>₹2,350</span></div>
          <div className="flex justify-between font-bold text-[5px] pt-0.5 mt-0.5 border-t" style={{ color: colors.primary }}>
             <span>TOTAL</span><span>₹2,350</span>
          </div>
        </div>
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
  const [isLayoutEditorOpen, setIsLayoutEditorOpen] = useState(false);
  const { theme: appTheme, toggleTheme: toggleAppTheme, accentColor, setAccentColor } = useTheme();
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const activeScheme = COLOR_SCHEMES.find(s => s.primary === accentColor);

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
      case "centered_pro": return <CenteredProPreview theme={selectedTheme} />;
      case "grid_structured": return <GridStructuredPreview theme={selectedTheme} />;
      case "modern_accent": return <ModernAccentPreview theme={selectedTheme} />;
      case "original_standard": return <StandardInvoicePreview theme={selectedTheme} />;
      case "custom_layout": return <div className="w-full aspect-[1/1.35] bg-gray-50 rounded border flex flex-col items-center justify-center text-gray-500"><Settings2 className="w-8 h-8 mb-2 opacity-50"/><span className="text-xs">Custom Layout Active</span></div>;
      case "classic_boxed":
      default: return <ClassicBoxedPreview theme={selectedTheme} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══ TOP ROW: Garage Info + UPI/Tax side by side ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Garage Info (left) */}
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

        {/* Right column: UPI + Tax stacked */}
        <div className="space-y-6">
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
      </div>

      {/* ═══ INVOICE LAYOUT & THEME — full width ═══ */}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { id: "original_standard", label: "Original Standard", desc: "Classic layout with light gray data boxes." },
                  { id: "classic_boxed", label: "Classic Boxed", desc: "Rounded outline boxes, alternating rows." },
                  { id: "centered_pro", label: "Centered Pro", desc: "Centered header, solid dark table headers." },
                  { id: "grid_structured", label: "Grid Structured", desc: "Full rigid grid, traditional accounting." },
                  { id: "modern_accent", label: "Modern Accent", desc: "Accent columns and PAID watermark." },
                  { id: "custom_layout", label: "Custom Builder", desc: "Build your own drag-and-drop layout." },
                ].map((fmt) => (
                  <label key={fmt.id} className="cursor-pointer group">
                    <input
                      type="radio"
                      name="invoiceFormat"
                      value={fmt.id}
                      checked={selectedFormat === fmt.id}
                      onChange={() => setSelectedFormat(fmt.id)}
                      className="peer sr-only"
                    />
                    <div className="rounded-xl border-2 border-border/50 bg-card hover:border-border peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/20 transition-all overflow-hidden">
                      <div className="p-2 pb-1">
                        <PreviewForFormat format={fmt.id} />
                      </div>
                      <div className="px-2 pb-2 pt-1">
                        <div className="font-semibold text-[11px] flex items-center gap-1">
                          {fmt.label}
                          {selectedFormat === fmt.id && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-primary/10 text-primary border-primary/20">Active</Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{fmt.desc}</div>
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
                      checked={selectedTheme === theme.id}
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
              
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger render={<Button type="button" variant="outline" className="cursor-pointer gap-1.5"><Eye className="w-3.5 h-3.5" />Preview Full PDF</Button>} />
                <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col p-4">
                  <DialogHeader>
                    <DialogTitle>Invoice Design Preview</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 w-full bg-muted rounded-md overflow-hidden relative">
                    {isPreviewOpen && (
                      <iframe 
                        src={`/api/preview-invoice?theme=${selectedTheme}&format=${selectedFormat}`} 
                        className="w-full h-full border-0 absolute inset-0"
                        title="PDF Preview"
                      />
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {selectedFormat === "custom_layout" && (
              <div className="mt-4 p-4 border border-primary/20 rounded-lg bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-foreground">Custom Layout Editor</h4>
                  <p className="text-sm text-muted-foreground">Drag and drop elements to build your perfect invoice layout.</p>
                </div>
                <Button type="button" onClick={() => setIsLayoutEditorOpen(true)} className="gap-2">
                  <Settings2 className="w-4 h-4"/> Open Visual Editor
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* ═══ SITE APPEARANCE — full width ═══ */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Palette className="w-4 h-4" />Site Appearance</CardTitle>
          <CardDescription>Customize the look and feel of this application. Changes apply instantly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dark / Light toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-muted/20">
            <div className="flex items-center gap-3">
              {appTheme === "dark" ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
              <div>
                <p className="text-sm font-medium">Theme Mode</p>
                <p className="text-xs text-muted-foreground">Currently using <span className="font-semibold text-foreground">{appTheme === "dark" ? "Dark" : "Light"}</span> mode</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" onClick={toggleAppTheme}>
              {appTheme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              Switch to {appTheme === "dark" ? "Light" : "Dark"}
            </Button>
          </div>

          {/* Accent Color Scheme — collapsible dropdown */}
          <div>
            <Label className="text-sm font-semibold">Accent Color Scheme</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">Choose a primary accent color for buttons, links, and highlights</p>

            {/* Dropdown trigger — shows current color */}
            <button
              type="button"
              onClick={() => setShowAccentPicker(!showAccentPicker)}
              className="flex items-center gap-2.5 w-full p-2.5 rounded-lg border border-border/50 hover:border-border bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer"
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-foreground/20 shrink-0"
                style={{ backgroundColor: activeScheme?.hex || "#10b981" }}
              />
              <span className="text-sm font-medium flex-1 text-left">{activeScheme?.name || "Emerald"}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showAccentPicker ? "rotate-180" : ""}`} />
            </button>

            {/* Collapsible grid */}
            {showAccentPicker && (
              <div className="mt-2 p-3 rounded-lg border border-border/40 bg-muted/10 animate-in-page">
              <div className="flex flex-wrap gap-1.5">
                  {COLOR_SCHEMES.map((scheme) => {
                    const isActive = accentColor === scheme.primary;
                    return (
                      <button
                        key={scheme.name}
                        type="button"
                        onClick={() => { setAccentColor(scheme.primary); }}
                        title={scheme.name}
                        className={`group relative w-6 h-6 rounded-full border-2 transition-all duration-150 cursor-pointer hover:scale-125 hover:z-10 ${
                          isActive
                            ? "border-foreground scale-125 z-10 ring-2 ring-primary/30"
                            : "border-transparent hover:border-foreground/40"
                        }`}
                        style={{ backgroundColor: scheme.hex }}
                      >
                        {isActive && (
                          <Check className="w-3 h-3 text-white absolute inset-0 m-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLayoutEditorOpen && (
        <LayoutEditor 
          initialConfig={(garage as any).customLayoutConfig || {}}
          onClose={() => setIsLayoutEditorOpen(false)}
        />
      )}
    </div>
  );
}
