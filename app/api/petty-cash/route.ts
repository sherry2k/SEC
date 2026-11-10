import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pettyCashEntries } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const type = str(body?.type);
  const dateStr = str(body?.date);
  const category = str(body?.category);
  const amount = Number(body?.amount);

  if (type !== "deposit" && type !== "expense") {
    return NextResponse.json({ error: "Invalid entry type." }, { status: 400 });
  }
  if (!dateStr || Number.isNaN(new Date(dateStr).getTime())) {
    return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
  }
  // Category is required for an expense (what was it spent on?) but
  // optional for a deposit (the source is just a helpful note).
  if (type === "expense" && !category) {
    return NextResponse.json({ error: "Category is required." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }

  const [entry] = await db
    .insert(pettyCashEntries)
    .values({
      type,
      date: new Date(dateStr),
      category: category || null,
      description: str(body?.description) || null,
      amount: String(amount),
      createdBy: auth.user.id,
    })
    .returning();

  return NextResponse.json({ success: true, entry }, { status: 201 });
}
