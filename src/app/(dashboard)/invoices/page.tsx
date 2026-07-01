import { Header } from "@/components/layout/header";
import { getInvoices } from "@/lib/actions/invoices";
import { InvoicesClient } from "@/app/(dashboard)/invoices/invoices-client";
import { Suspense } from "react";

export default async function InvoicesPage(props: {
  searchParams: Promise<{ from?: string; to?: string; limit?: string; sort?: string }>;
}) {
  const searchParams = await props.searchParams;
  const from = searchParams?.from ? new Date(searchParams.from) : undefined;
  const to = searchParams?.to ? new Date(searchParams.to) : undefined;
  const sortDir = searchParams?.sort === "asc" ? "asc" : "desc";

  const invoicesList = await getInvoices({
    from,
    to,
    sortDir,
    limit: 1000, // Fetch enough to let DataTable paginate client-side
  });

  return (
    <>
      <Header title="Invoices" />
      <div className="p-6 animate-in-page">
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
          <InvoicesClient invoices={invoicesList} />
        </Suspense>
      </div>
    </>
  );
}
