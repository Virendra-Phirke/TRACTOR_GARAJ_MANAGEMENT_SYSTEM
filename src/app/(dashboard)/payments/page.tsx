import { Header } from "@/components/layout/header";
import { getPaymentHistory } from "@/lib/actions/payments";
import { PaymentsClient } from "./payments-client";
import { Suspense } from "react";

export const metadata = {
  title: "Payment History | GBMS",
  description:
    "Audit payment ledger, track Razorpay payment links, and inspect cash & online collections.",
};

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const data = await getPaymentHistory();

  return (
    <>
      <Header title="Payment History" />
      <div className="p-4 md:p-6 animate-in-page space-y-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <PaymentsClient initialData={data} />
        </Suspense>
      </div>
    </>
  );
}
