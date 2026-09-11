import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createToken } from "@/lib/session";
import { setSessionCookie } from "@/lib/auth";

const BLOCKED_STATUS_MESSAGES = {
  pending: "Your account is waiting for admin approval.",
  rejected: "Your account request was not approved. Contact your admin.",
  disabled: "This account has been disabled. Contact your admin.",
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordMatches) {
      return NextResponse.json({ error: "Username or password is incorrect." }, { status: 401 });
    }

    // Status is only revealed after the password is confirmed.
    if (user.status !== "approved") {
      return NextResponse.json(
        { error: BLOCKED_STATUS_MESSAGES[user.status], code: user.status.toUpperCase() },
        { status: 403 }
      );
    }

    try {
      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    } catch (err) {
      console.error("Could not update last login time:", err);
    }

    const token = await createToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Something went wrong on the server. Try again." },
      { status: 500 }
    );
  }
}
