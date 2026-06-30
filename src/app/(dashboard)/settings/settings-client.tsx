"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building, QrCode, Percent, Check } from "lucide-react";
import { updateGarageSettings, updateUpiSettings, setDefaultTax } from "@/lib/actions/settings";
import { toast } from "sonner";

interface GarageSettings { id: number; name: string; address: string | null; phone: string | null; email: string | null; gstNumber: string | null; tagline: string | null; }
interface UpiSettings { id: number; vpa: string; payeeName: string; merchantCode: string | null; isEnabled: boolean | null; }
interface TaxSetting { id: number; name: string; rate: number; isDefault: boolean | null; isActive: boolean | null; }

export function SettingsClient({ garage, upi, taxes }: { garage: GarageSettings; upi: UpiSettings; taxes: TaxSetting[] }) {
  const router = useRouter();
  const [gLoading, setGLoading] = useState(false);
  const [uLoading, setULoading] = useState(false);

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
      });
      toast.success("Garage settings saved");
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

  return (
    <div className="max-w-3xl space-y-6">
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
