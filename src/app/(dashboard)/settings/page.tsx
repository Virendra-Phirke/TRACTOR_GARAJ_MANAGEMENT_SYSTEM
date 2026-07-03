import { Header } from "@/components/layout/header";
import { getGarageSettings, getUpiSettings, getTaxSettings } from "@/lib/actions/settings";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const [garage, upi, taxes] = await Promise.all([
    getGarageSettings(),
    getUpiSettings(),
    getTaxSettings(),
  ]);

  return (
    <>
      <Header title="Settings" />
      <div className="p-4 md:p-6 animate-in-page">
        <SettingsClient garage={garage} upi={upi} taxes={taxes} />
      </div>
    </>
  );
}
