import "server-only";
import { and, eq, ne, asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// Approved users only, master_admin excluded — that role stays out of any
// picker in the app, consistent with it being invisible everywhere else.
export async function getAssignableUsers() {
  return db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(and(eq(users.status, "approved"), ne(users.role, "master_admin")))
    .orderBy(asc(users.name));
}
