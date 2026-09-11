import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authorizeApi } from "@/lib/auth";

// Any signed-in, approved user can change their own password — no role check.
export async function POST(request: NextRequest) {
  const auth = await authorizeApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Enter your current password and a new password." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    if (newPassword.length > 72) {
      return NextResponse.json({ error: "New password must be 72 characters or fewer." }, { status: 400 });
    }

    const [row] = await db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, auth.user.id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }

    const currentMatches = await bcrypt.compare(currentPassword, row.password);
    if (!currentMatches) {
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 401 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from your current password." },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ password: newHash }).where(eq(users.id, auth.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Something went wrong on the server. Try again." },
      { status: 500 }
    );
  }
}
