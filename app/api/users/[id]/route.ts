import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authorizeApi } from "@/lib/auth";
import { ASSIGNABLE_ROLES, USER_MANAGEMENT_ROLES, USER_STATUSES, type Role, type UserStatus } from "@/lib/roles";

// Statuses an admin can set from this route. "pending" is only ever the
// starting state at signup — nobody sets it manually.
const SETTABLE_STATUSES: readonly UserStatus[] = ["approved", "rejected", "disabled"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(USER_MANAGEMENT_ROLES);
  if (!auth.ok) return auth.response;

  const { id: idParam } = await params;
  const targetId = Number(idParam);
  if (!Number.isInteger(targetId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  // Lock-out guard: nobody edits their own role or status from this screen —
  // an admin can't accidentally demote or disable themselves.
  if (targetId === auth.user.id) {
    return NextResponse.json(
      { error: "You can't change your own role or status here." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const role = typeof body?.role === "string" ? (body.role as Role) : undefined;
  const status = typeof body?.status === "string" ? (body.status as UserStatus) : undefined;

  if (role === undefined && status === undefined) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  if (role !== undefined && !ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "That role can't be assigned here." }, { status: 400 });
  }

  if (status !== undefined && !SETTABLE_STATUSES.includes(status)) {
    return NextResponse.json({ error: "That status can't be set here." }, { status: 400 });
  }

  const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  // A master_admin row is never editable from this screen, by anyone.
  if (target.role === "master_admin") {
    return NextResponse.json({ error: "This account can't be changed here." }, { status: 403 });
  }

  const update: Partial<typeof users.$inferInsert> = {};
  if (role !== undefined) update.role = role;
  if (status !== undefined) {
    update.status = status;
    if (status === "approved") {
      update.approvedBy = auth.user.id;
      update.approvedAt = new Date();
    }
  }

  await db.update(users).set(update).where(eq(users.id, targetId));

  return NextResponse.json({ success: true });
}
