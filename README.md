# SEC Dashboard — Setup

Phase 1: login, signup with admin approval, role-aware dashboard shell,
self-service password change, and User Management. Projects and Accounts
are still placeholders — next phase.

## 1. Create the GitHub repo

Unzip `sec-dashboard.zip`, create a new empty repo on GitHub, then push
this folder's contents to it (via GitHub's web UI "upload files", or `git`
if you have it).

## 2. Create the Neon database

In your Neon project's SQL Editor, run:

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

Copy the connection string from Neon's dashboard (the "pooled connection"
one) — you'll need it in step 4.

## 3. Create the Vercel project

Import the GitHub repo into a new Vercel project. Framework preset:
Next.js (auto-detected).

## 4. Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Value |
|---|---|
| `DATABASE_URL` | The Neon connection string from step 2 |
| `JWT_SECRET` | A random string, 32+ characters — generate one at https://generate-secret.vercel.app/32 |

Without `JWT_SECRET` the build itself fails on purpose (see
`lib/session.ts` — no fallback secret is allowed). Without `DATABASE_URL`
the build fails collecting page data for the auth routes — expected, not
a bug; add the variable and redeploy.

## 5. Deploy, then create your own account

Once deployed: open the site, go to `/signup`, and register your own
account. Then in the Neon SQL Editor, run:

```sql
UPDATE users SET role = 'master_admin', status = 'approved', approved_at = now()
WHERE username = 'your-username';
```

Sign in — you now have full access, and can approve everyone else from
the User Management page instead of going back into Neon.

## 6. Point the subdomain (whenever you're ready to go live)

In Vercel: Project → Settings → Domains → add `dashboard.solideng.ae`.
Vercel will show a CNAME record to add in your DNS panel for
`solideng.ae`. Until this is done, the `*.vercel.app` URL works fine for
testing.

## What's in this repo

**Design system** — `/app/login`, `/app/signup`: split panel, logo blue
`#095098`, Source Serif 4 for headings + Inter for UI text. Tokens live in
`app/globals.css`.

**Dashboard shell** — `/app/(dashboard)/layout.tsx` guards every dashboard
page behind a valid session. `components/Sidebar.tsx` filters nav items
server-side by role before the page reaches the browser.

**User Management** (`/app/(dashboard)/users`, admin/master_admin only) —
`components/UsersTable.tsx`. Pending signups sort to the top with
Approve/Reject buttons. Approved users get a role dropdown (Admin /
Finance / Staff — `master_admin` is never offered here, it's set by hand
in Neon only) and a Disable/Re-enable button. Two guards live in
`app/api/users/[id]/route.ts`: nobody can change their own role or status
from this screen (lock-out protection), and a `master_admin` row can't be
edited by anyone through the UI.

**Change password** (`/app/(dashboard)/profile`) — any signed-in,
approved user, reachable by clicking their name at the bottom of the
sidebar. Requires the current password; new one must be 8+ characters and
different from the old one. `app/api/auth/change-password/route.ts`.

**Role rules** — `/lib/roles.ts`, `/lib/permissions.ts`, the one place
role logic lives. `finance_can_edit_projects` in `app_settings` controls
whether Finance can edit/create projects — off by default.

**Fresh-per-request auth** — `/lib/auth.ts`: `requireRole()` for pages,
`authorizeApi()` for API routes. Both re-check the database on every
request, so disabling a user or changing their role takes effect
immediately, not after their 7-day token expires.

`/app/pending`, `/app/unauthorized` — shown to not-yet-approved and
wrong-role users respectively.

## Verified

This repo has been through a real `next build` with the actual npm
packages (not just a type-check) — confirms it will build cleanly on
Vercel once the two environment variables are set.

## Next phase

Projects: the category/checklist tree (BOC, CBC, Permit, Work Permit,
Contractor) from the framework document, the projects list, and the
project detail page. Finance comes after Projects, per your build order.
