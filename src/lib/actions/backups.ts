import { db } from "@/db";
import { backups } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function getLastBackupDate(): Promise<Date | null> {
  const [lastBackup] = await db
    .select({ createdAt: backups.createdAt })
    .from(backups)
    .orderBy(desc(backups.createdAt))
    .limit(1);

  return lastBackup?.createdAt || null;
}
