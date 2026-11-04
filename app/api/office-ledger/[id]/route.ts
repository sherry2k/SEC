import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { officeLedgerEntries } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: officeLedgerEntries.id }).from(officeLedgerEntries).where(eq(officeLedgerEntries.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const dateStr = str(body?.date);
  const category = str(body?.category);
  const amount = Number(body?.amount);

  if (!dateStr || Number.isNaN(new Date(dateStr).getTime())) {
    return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ error: "Category is required." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }

  await db
    .update(officeLedgerEntries)
    .set({
      date: new Date(dateStr),
      category,
      description: str(body?.description) || null,
      amount: String(amount),
    })
    .where(eq(officeLedgerEntries.id, id));

  return NextResponse.json({ success: true });
}

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
