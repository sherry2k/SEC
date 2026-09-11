// Token helpers only — no database, no next/headers.
// Safe to import from middleware.ts.
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/roles";

export const SESSION_COOKIE = "sec-auth-token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// The token only proves WHO the user is.
// Role and status are always re-checked from the database (see lib/auth.ts).
export interface SessionPayload {
  id: number;
  name: string;
  username: string;
  role: Role;
}

function getKey() {
  const secret = process.env.JWT_SECRET;
  // No fallback secret: if it's missing, logins fail instead of using a guessable key
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or shorter than 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getKey());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey());
    if (typeof payload.id !== "number") return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
