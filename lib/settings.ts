import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

export async function getAppSetting(key: string): Promise<string | null> {
  const [row] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return row?.value ?? null;
}

export async function financeCanEditProjects(): Promise<boolean> {
  const value = await getAppSetting("finance_can_edit_projects");
  return value === "true";
}
