import type { Role } from "@/lib/roles";

// master_admin is a developer-only role, invisible to everyone else — this
// already applies to the Users page (that row doesn't even appear); this
// helper extends the same rule to "who did this" attribution anywhere else
// in the app (last-updated-by, the activity feed), so a master_admin's
// actions show up as changes without naming who made them, to anyone but
// another master_admin.
export function visibleActorName(actorRole: Role | null, actorName: string | null, viewerRole: Role): string | null {
  if (actorRole === "master_admin" && viewerRole !== "master_admin") return null;
  return actorName;
}
