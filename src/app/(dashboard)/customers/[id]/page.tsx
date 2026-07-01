import { Header } from "@/components/layout/header";
import { getCustomerById } from "@/lib/actions/customers";
import { getVehiclesByCustomer } from "@/lib/actions/vehicles";
import { getInvoicesByCustomer } from "@/lib/actions/invoices";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Truck, FileText } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog";
import { EditVehicleDialog } from "@/components/vehicles/edit-vehicle-dialog";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(Number(id));
  if (!customer) notFound();

  const [vehicles, invoicesList] = await Promise.all([
    getVehiclesByCustomer(customer.id),
    getInvoicesByCustomer(customer.id),
  ]);

  return (
    <>
      <Header title={customer.name} />
      <div className="p-6 animate-in-page space-y-6">
        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 relative">
            <div className="absolute top-3 right-3">
              <EditCustomerDialog customer={customer} />
            </div>
            <CardContent className="p-5 space-y-3 pt-8">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {customer.phone}
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {customer.email}
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {customer.address}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase">Total Spent</p>
              <p className="text-2xl font-bold mt-1">
                ₹{(customer.totalSpent || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {customer.visitCount || 0} visits
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase">Outstanding</p>
              <p className="text-2xl font-bold mt-1 text-amber-400">
                ₹{(customer.outstandingBalance || 0).toLocaleString("en-IN")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Vehicles */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Vehicles ({vehicles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vehicles.map((v) => (
                  <div key={v.id} className="p-3 rounded-lg bg-accent/30 border border-border/30 relative">
                    <div className="absolute top-2 right-2">
                      <EditVehicleDialog vehicle={v} />
                    </div>
                    <p className="font-semibold text-sm">{v.registrationNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.brand} {v.model} {v.year ? `(${v.year})` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No vehicles registered.</p>
            )}
          </CardContent>
        </Card>

        {/* Invoice History */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoices ({invoicesList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesList.length > 0 ? (
              <div className="space-y-2">
                {invoicesList.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.vehicleReg || "No vehicle"} •{" "}
                        {format(new Date(inv.createdAt), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        ₹{(inv.grandTotal || 0).toLocaleString("en-IN")}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          inv.paymentStatus === "paid"
                            ? "border-emerald-400/30 text-emerald-400"
                            : "border-amber-400/30 text-amber-400"
                        }
                      >
                        {inv.paymentStatus}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
