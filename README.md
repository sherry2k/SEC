# SEC Dashboard — Setup

This is Phase 1: login, signup with admin approval, role-aware dashboard
shell, and the design system. Projects and Accounts are placeholders —
next phase.

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

Without `JWT_SECRET` the build itself will fail on purpose (see
`lib/session.ts` — no fallback secret is allowed). Without `DATABASE_URL`
the build fails collecting page data for the auth routes — this is
expected and not a bug; add the variable and redeploy.

## 5. Deploy, then create your own account

Once deployed: open the site, go to `/signup`, and register your own
account. Then back in the Neon SQL Editor, run:

```sql
UPDATE users SET role = 'master_admin', status = 'approved', approved_at = now()
WHERE username = 'your-username';
```

Sign in — you now have full access.

## 6. Point the subdomain (whenever you're ready to go live)

In Vercel: Project → Settings → Domains → add `dashboard.solideng.ae`.
Vercel will show a CNAME record to add in your DNS panel for
`solideng.ae` (wherever that domain is managed). Until this is done, the
`*.vercel.app` URL works fine for testing.

## What's in this repo

- `/app/login`, `/app/signup` — the design system: split panel, logo blue
  `#095098`, Source Serif 4 for headings + Inter for UI text.
- `/app/(dashboard)` — the shell. `layout.tsx` guards every dashboard page
  behind a valid session; `dashboard/page.tsx` is a placeholder home.
- `/components/Sidebar.tsx` — nav items are filtered server-side by role
  (`master_admin` / `admin` / `finance` / `staff`) before the page reaches
  the browser.
- `/lib/roles.ts`, `/lib/permissions.ts` — the one place role rules live.
  `finance_can_edit_projects` in `app_settings` controls whether Finance
  can edit/create projects — off by default, flip it in Neon or (once
  built) the Settings page.
- `/lib/auth.ts` — `requireRole()` for pages, `authorizeApi()` for API
  routes. Both re-check the database on every request, so disabling a
  user or changing their role takes effect immediately, not after their
  7-day token expires.
- `/app/pending`, `/app/unauthorized` — shown to not-yet-approved and
  wrong-role users respectively.

## Next phase

Projects: the category/checklist tree (BOC, CBC, Permit, Work Permit,
Contractor) from the framework document, the projects list, and the
project detail page. Finance comes after Projects is complete, per your
build order.
