"use server";

import { db } from "@/db";
import { garageSettings, upiSettings, taxSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Garage Settings ─────────────────────────────────────────────────
export async function getGarageSettings() {
  const result = await db.select().from(garageSettings).limit(1);
  if (result.length === 0) {
    // Create default settings
    const [settings] = await db
      .insert(garageSettings)
      .values({ name: "My Tractor Garage" })
      .returning();
    return settings;
  }
  return result[0];
}

export async function updateGarageSettings(data: {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  tagline?: string;
  invoiceTheme?: string;
  invoiceFormat?: string;
}) {
  const existing = await getGarageSettings();
  const result = await db
    .update(garageSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(garageSettings.id, existing.id))
    .returning();
  revalidatePath("/settings");
  return result[0];
}

// ─── UPI Settings ────────────────────────────────────────────────────
export async function getUpiSettings() {
  const result = await db.select().from(upiSettings).limit(1);
  if (result.length === 0) {
    const [settings] = await db
      .insert(upiSettings)
      .values({ vpa: "", payeeName: "" })
      .returning();
    return settings;
  }
  return result[0];
}

export async function updateUpiSettings(data: {
  vpa?: string;
  payeeName?: string;
  merchantCode?: string;
  isEnabled?: boolean;
}) {
  const existing = await getUpiSettings();
  const result = await db
    .update(upiSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(upiSettings.id, existing.id))
    .returning();
  revalidatePath("/settings");
  return result[0];
}

// ─── Tax Settings ────────────────────────────────────────────────────
export async function getTaxSettings() {
  const result = await db.select().from(taxSettings).orderBy(taxSettings.name);
  if (result.length === 0) {
    // Create default tax settings
    await db.insert(taxSettings).values([
      { name: "No Tax", rate: 0, isDefault: true, isActive: true },
      { name: "GST 5%", rate: 5, isDefault: false, isActive: true },
      { name: "GST 12%", rate: 12, isDefault: false, isActive: true },
      { name: "GST 18%", rate: 18, isDefault: false, isActive: true },
      { name: "GST 28%", rate: 28, isDefault: false, isActive: true },
    ]);
    return db.select().from(taxSettings).orderBy(taxSettings.name);
  }
  return result;
}

export async function getDefaultTaxRate(): Promise<number> {
  const result = await db
    .select()
    .from(taxSettings)
    .where(eq(taxSettings.isDefault, true))
    .limit(1);
  return result[0]?.rate || 0;
}

export async function setDefaultTax(id: number) {
  // Unset all defaults
  await db.update(taxSettings).set({ isDefault: false });
  // Set the new default
  await db
    .update(taxSettings)
    .set({ isDefault: true })
    .where(eq(taxSettings.id, id));
  revalidatePath("/settings");
}
