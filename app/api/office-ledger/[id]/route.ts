import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { officeLedgerEntries } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: officeLedgerEntries.id }).from(officeLedgerEntries).where(eq(officeLedgerEntries.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  await db.delete(officeLedgerEntries).where(eq(officeLedgerEntries.id, id));
  return NextResponse.json({ success: true });
}
