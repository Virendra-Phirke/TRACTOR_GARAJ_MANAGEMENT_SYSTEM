import { Header } from "@/components/layout/header";
import { getInvoiceById } from "@/lib/actions/invoices";
import { getGarageSettings, getUpiSettings } from "@/lib/actions/settings";
import { notFound } from "next/navigation";
import { InvoiceDetailClient } from "./invoice-detail-client";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, garage, upi] = await Promise.all([
    getInvoiceById(Number(id)),
    getGarageSettings(),
    getUpiSettings(),
  ]);

  if (!invoice) notFound();

  return (
    <>
      <Header title={`Invoice ${invoice.invoiceNumber}`} />
      <div className="p-6 animate-in-page">
        <InvoiceDetailClient
          invoice={invoice}
          garage={garage}
          upi={upi}
        />
      </div>
    </>
  );
}
