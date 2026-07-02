import { getAnalyticsData } from "@/lib/actions/analytics";
import { AnalyticsClient } from "./analytics-client";
import { Header } from "@/components/layout/header";

export const metadata = {
  title: "Analytics | Tractor Garage",
};

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <>
      <Header title="Analytics" />
      <div className="p-6 animate-in-page">
        <AnalyticsClient data={data} />
      </div>
    </>
  );
}
