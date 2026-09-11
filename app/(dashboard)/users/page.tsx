import { requireRole } from "@/lib/auth";
import { USER_MANAGEMENT_ROLES } from "@/lib/roles";
import { db } from "@/db";
import { users } from "@/db/schema";
import UsersTable from "@/components/UsersTable";

export default async function UsersPage() {
  const currentUser = await requireRole(USER_MANAGEMENT_ROLES);

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users);

  // Pending requests first, then everyone else, newest first.
  const sorted = [...allUsers].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-[var(--sec-ink)]">User Management</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">
        Approve new requests, assign roles, and disable accounts that no longer need access.
      </p>

      <div className="mt-8">
        <UsersTable users={sorted} currentUserId={currentUser.id} />
      </div>
    </div>
  );
}
