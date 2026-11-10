import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pettyCashEntries } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: pettyCashEntries.id, type: pettyCashEntries.type }).from(pettyCashEntries).where(eq(pettyCashEntries.id, id)).limit(1);
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
  if (existing.type === "expense" && !category) {
    return NextResponse.json({ error: "Category is required." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }

  await db
    .update(pettyCashEntries)
    .set({
      date: new Date(dateStr),
      category: category || null,
      description: str(body?.description) || null,
      amount: String(amount),
    })
    .where(eq(pettyCashEntries.id, id));

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: pettyCashEntries.id }).from(pettyCashEntries).where(eq(pettyCashEntries.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  await db.delete(pettyCashEntries).where(eq(pettyCashEntries.id, id));
  return NextResponse.json({ success: true });
}
