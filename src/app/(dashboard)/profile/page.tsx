import { Header } from "@/components/layout/header";
import { getGarageSettings, getUpiSettings } from "@/lib/actions/settings";
import { ProfileClient } from "@/app/(dashboard)/profile/profile-client";

export default async function ProfilePage() {
  const [garage, upi] = await Promise.all([
    getGarageSettings(),
    getUpiSettings(),
  ]);

  return (
    <>
      <Header title="Owner Profile" />
      <div className="p-4 md:p-6 animate-in-page">
        <ProfileClient garage={garage} upi={upi} />
      </div>
    </>
  );
}
