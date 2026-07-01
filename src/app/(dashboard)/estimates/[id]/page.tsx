import { Header } from "@/components/layout/header";
import { getEstimateById } from "@/lib/actions/estimates";
import { getGarageSettings } from "@/lib/actions/settings";
import { notFound } from "next/navigation";
import { EstimateDetailClient } from "./estimate-detail-client";

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [estimate, garage] = await Promise.all([
    getEstimateById(Number(id)),
    getGarageSettings(),
  ]);

  if (!estimate) notFound();

  return (
    <>
      <Header title={`Estimate ${estimate.estimateNumber}`} />
      <div className="p-6 animate-in-page">
        <EstimateDetailClient
          estimate={estimate}
          garage={garage}
        />
      </div>
    </>
  );
}
