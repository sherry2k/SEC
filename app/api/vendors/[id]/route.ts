import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const name = str(body?.name);
  if (!name) {
    return NextResponse.json({ error: "Vendor name is required." }, { status: 400 });
  }

  await db
    .update(vendors)
    .set({
      name,
      category: str(body?.category) || null,
      contactInfo: str(body?.contactInfo) || null,
      notes: str(body?.notes) || null,
    })
    .where(eq(vendors.id, id));

  await logActivity({
    userId: auth.user.id,
    action: "vendor_updated",
    targetName: name,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [vendor] = await db.select({ name: vendors.name }).from(vendors).where(eq(vendors.id, id)).limit(1);
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  }

  await logActivity({
    userId: auth.user.id,
    action: "vendor_deleted",
    targetName: vendor.name,
  });

  // Vendor Payments cascade-delete with the vendor (onDelete: "cascade" on
  // vendor_payments.vendor_id).
  await db.delete(vendors).where(eq(vendors.id, id));

  return NextResponse.json({ success: true });
}
