import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function ProfilePage() {
  const user = await requireRole();

  return (
    <div>
      <h1 className="font-bold text-2xl text-[var(--sec-ink)]">Your profile</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">
        {user.name} · @{user.username} · {ROLE_LABELS[user.role]}
      </p>
      {user.designation && <p className="mt-1 text-sm text-[var(--sec-ink)]">{user.designation}</p>}

      <div className="mt-8 border-t border-[var(--sec-line)] pt-8">
        <h2 className="font-bold text-lg text-[var(--sec-ink)]">Change password</h2>
        <p className="mt-1 text-sm text-[var(--sec-muted)]">
          You'll need your current password to set a new one.
        </p>
        <div className="mt-5">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
