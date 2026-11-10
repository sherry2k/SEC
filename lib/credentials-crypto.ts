import "server-only";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

// A portal password is the one piece of data in this whole app that's a
// live login secret, not just business data — so it's encrypted at rest
// instead of sitting in the database as plain text like everything else in
// db/schema.ts. The key never lives in the database or the repo: it's an
// environment variable only, generated once with:
//   openssl rand -base64 32
// and set as CREDENTIALS_ENCRYPTION_KEY in Vercel's project settings.
// Losing/rotating this key makes every previously-saved password
// undecryptable — lib/portal-credentials.ts shows a clear per-row warning
// instead of crashing the page if that happens.
function getKey(): Buffer {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` and add it as an environment variable."
    );
  }
  const key = Buffer.from(secret, "base64");
  if (key.length !== 32) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY must decode to exactly 32 bytes — generate it with `openssl rand -base64 32`.");
  }
  return key;
}

// Stored as "<iv>.<authTag>.<ciphertext>", each base64 — a fresh random IV
// per call, so two identical passwords never produce the same stored value.
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${authTag.toString("base64")}.${ciphertext.toString("base64")}`;
}

export function decryptSecret(stored: string): string {
  const key = getKey();
  const parts = stored.split(".");
  if (parts.length !== 3) {
    throw new Error("Stored credential is not in the expected encrypted format.");
  }
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
