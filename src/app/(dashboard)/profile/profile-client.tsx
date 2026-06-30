"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateUpiQrDataUrl } from "@/lib/qr/upi-qr";
import { QrCode, Phone, MapPin, Building2, UserCircle2, Settings } from "lucide-react";
import Link from "next/link";

interface GarageSettings {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  tagline: string | null;
}

interface UpiSettings {
  vpa: string;
  payeeName: string;
  merchantCode: string | null;
  isEnabled: boolean | null;
}

export function ProfileClient({
  garage,
  upi,
}: {
  garage: GarageSettings;
  upi: UpiSettings;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    // Generate a default amount-less QR code for the profile page
    if (upi.isEnabled && upi.vpa) {
      generateUpiQrDataUrl({
        vpa: upi.vpa,
        payeeName: upi.payeeName,
        merchantCode: upi.merchantCode || undefined,
      }).then(setQrDataUrl);
    }
  }, [upi]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border shadow-sm">
        {/* Abstract Background Element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-8 relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          {/* Avatar / QR Code Section */}
          <div className="shrink-0">
            {qrDataUrl ? (
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-border flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Owner UPI QR" className="w-32 h-32 object-contain" />
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan to Pay</span>
                </div>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-accent flex items-center justify-center border border-border shadow-sm">
                <UserCircle2 className="w-16 h-16 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {upi.payeeName || "Garage Owner"}
              </h1>
              <p className="text-lg text-primary font-medium flex items-center gap-2 mt-1">
                <Building2 className="w-5 h-5" />
                {garage.name}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <span className="font-medium text-foreground">{garage.phone || "No phone added"}</span>
              </div>
              
              {garage.address && (
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-sm leading-snug">{garage.address}</span>
                </div>
              )}
            </div>

            {upi.vpa && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-sm font-medium">
                UPI: {upi.vpa}
              </div>
            )}
          </div>

          <div className="absolute top-6 right-6">
            <Link href="/settings">
              <Button variant="outline" size="icon" className="rounded-full shadow-sm cursor-pointer">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card/50 shadow-sm border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Garage Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Business Name</p>
                <p className="font-medium">{garage.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tagline</p>
                <p className="text-sm">{garage.tagline || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm">{garage.email || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 shadow-sm border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" />
              Payment Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Payee Name</p>
                <p className="font-medium">{upi.payeeName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">UPI ID (VPA)</p>
                <p className="font-mono text-sm">{upi.vpa || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${upi.isEnabled ? "bg-emerald-500" : "bg-destructive"}`} />
                  <span className="text-sm">{upi.isEnabled ? "Active & Accepting Payments" : "Disabled"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Need to update this information?{" "}
          <Link href="/settings" className="text-primary hover:underline font-medium">
            Go to Settings
          </Link>
        </p>
      </div>
    </div>
  );
}
