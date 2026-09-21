// Server-side auth helpers. Use in server components, layouts and API routes only.
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { Role, UserStatus } from "@/lib/roles";
import { can, type Permission } from "@/lib/permissions";
import { financeCanEditProjects } from "@/lib/settings";
import { SESSION_COOKIE, SESSION_MAX_AGE, verifyToken, type SessionPayload } from "@/lib/session";

export type CurrentUser = {
  id: number;
  name: string;
  username: string;
  role: Role;
  status: UserStatus;
  designation: string | null;
};

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Token contents only (may be up to 7 days old). Don't use this for access decisions.
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

// Fresh from the database, so role changes and disabling apply immediately.
// cache() makes it run once per request even when called from several places.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      status: users.status,
      designation: users.designation,
    })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  return user ?? null;
});

// For pages and layouts. Leave `allowed` empty to allow any approved user.
// Example (accounts/layout.tsx): await requireRole(FINANCE_ROLES);
export async function requireRole(allowed?: readonly Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.status !== "approved") redirect("/login");
  if (allowed && !allowed.includes(user.role)) redirect("/unauthorized");
  return user;
}

// For API routes. Returns a JSON error response instead of redirecting.
type ApiAuthResult =
  | { ok: true; user: CurrentUser }
  | { ok: false; response: NextResponse };

export async function authorizeApi(allowed?: readonly Role[]): Promise<ApiAuthResult> {
  const user = await getCurrentUser();
  if (!user || user.status !== "approved") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Please sign in again." }, { status: 401 }),
    };
  }
  if (allowed && !allowed.includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "You don't have access to this." }, { status: 403 }),
    };
  }
  return { ok: true, user };
}

// Permission-aware guards — use these instead of requireRole/authorizeApi
// wherever the answer depends on more than a fixed role list, e.g. Projects
// edit access, where Finance's answer depends on the finance_can_edit_projects
// setting rather than their role alone.
export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.status !== "approved") redirect("/login");
  const allowFinanceEdit = await financeCanEditProjects();
  if (!can(user.role, permission, allowFinanceEdit)) redirect("/unauthorized");
  return user;
}

export async function authorizePermissionApi(permission: Permission): Promise<ApiAuthResult> {
  const user = await getCurrentUser();
  if (!user || user.status !== "approved") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Please sign in again." }, { status: 401 }),
    };
  }
  const allowFinanceEdit = await financeCanEditProjects();
  if (!can(user.role, permission, allowFinanceEdit)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "You don't have access to this." }, { status: 403 }),
    };
  }
  return { ok: true, user };
}
