# SEC Dashboard — Setup

Phase 1 (auth, roles, User Management, change password) is done. This
update adds Phase 2: Projects — the category/checklist tree, project
creation, and the project detail page. Finance is still a placeholder,
per your build order.

## If you already have this deployed

1. Pull/replace the repo with this zip's contents and push to GitHub —
   Vercel redeploys automatically.
2. Run `seed-projects-schema.sql` once in the Neon SQL Editor. It creates
   the new tables and seeds the checklist tree (BOC / CBC / Permit / Work
   Permit / Contractor and all their items, including Contractor →
   Inspection's 8 sub-items). Safe to run once; running it twice will
   error on the second attempt because the tables already exist.
3. That's it — no new environment variables needed for this phase.

## Starting from scratch

Same as before, plus the new script:

1. Create the GitHub repo from this zip.
2. In Neon's SQL Editor, run `neon-schema.sql` for users/auth (see below),
   then `seed-projects-schema.sql` for Projects.
3. Import into Vercel, set `DATABASE_URL` and `JWT_SECRET`, deploy.
4. Sign up, then promote yourself to `master_admin` in Neon:
   ```sql
   UPDATE users SET role = 'master_admin', status = 'approved', approved_at = now()
   WHERE username = 'your-username';
   ```

### neon-schema.sql (users/auth — run first if starting fresh)

```sql
CREATE TYPE user_role AS ENUM ('master_admin', 'admin', 'finance', 'staff');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'disabled');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username VARCHAR(30) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  status user_status NOT NULL DEFAULT 'pending',
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO app_settings (key, value) VALUES ('finance_can_edit_projects', 'false');
```

## What's new in this phase

**Projects list** (`/projects`) — every project, its category badges,
location, status. "Add project" button only shows for roles that can
create (Admin, Staff, Master admin — Finance only if the
`finance_can_edit_projects` setting is turned on).

**New project** (`/projects/new`) — name, client, building/unit/location,
area, notes, and category checkboxes. A project can have more than one
category from the start.

**Project detail** (`/projects/[id]`) — shows the project's info, then one
card per linked category with its full checklist, correctly nested
(Contractor → Inspection shows its 8 inspection types indented
underneath). Each item's status is an inline dropdown that saves
immediately — no separate save button, optimistic update with rollback
if the save fails. A "Link another category" control at the top lets you
add BOC, CBC, Permit, Work Permit or Contractor to a project after the
fact, which copies in that category's checklist without touching what's
already there.

**Project codes** — auto-numbered `SEC/PRJ/2026/0001`, assigned
atomically via the new `document_sequences` table so two people creating
projects at the same moment never collide. The same table and helper
(`lib/sequences.ts`) will generate quotation and invoice numbers in the
Finance phase.

**Permission changes worth knowing** — `lib/auth.ts` got two new guards,
`requirePermission()` and `authorizePermissionApi()`, used everywhere in
Projects instead of the older role-list guards. These check the
`finance_can_edit_projects` setting live on every request, which is what
makes that toggle actually work rather than being cosmetic.

## Testing it

Sign in as `admin`, go to Projects → Add project, tick two or three
categories, and open the result — each category's full checklist should
appear as its own card, ready to click through statuses on.

## Next phase

Finance: quotations, invoices (shared `SEC/INV/…` sequence across all
three types), and the Statement of Account, per Section 4 of the
framework document. Waiting on your sample quotation/invoice formats
before that starts.
