import { requirePermission } from "@/lib/auth";
import { financeCanEditProjects } from "@/lib/settings";
import { COMPANY, BANK_DETAILS } from "@/lib/company";
import SettingToggle from "@/components/SettingToggle";

export default async function SettingsPage() {
  await requirePermission("settings.manage");

  const allowFinanceEdit = await financeCanEditProjects();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Settings</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Controls for how the dashboard behaves.</p>

      <div className="mt-8 max-w-2xl space-y-8">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--sec-muted)]">Permissions</h2>
          <div className="mt-3">
            <SettingToggle
              settingKey="finance_can_edit_projects"
              initialValue={allowFinanceEdit}
              label="Finance can edit projects"
              description="When on, the Finance role can also create and edit projects, not just view them — useful if your accountant sometimes handles project admin too."
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--sec-muted)]">
            Letterhead (used on Quotations &amp; Performa Invoices)
          </h2>
          <div className="mt-3 rounded-lg border border-[var(--sec-line)] bg-white p-4 text-sm">
            <p className="text-[var(--sec-muted)]">
              This is fixed company information, not editable from here yet — it's the same on every
              printed document. Tell me if any of it needs to change.
            </p>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Company</dt>
                <dd className="text-[var(--sec-ink)]">{COMPANY.legalName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Contact</dt>
                <dd className="text-[var(--sec-ink)]">
                  {COMPANY.tel} · {COMPANY.mobile} · {COMPANY.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Bank</dt>
                <dd className="text-[var(--sec-ink)]">
                  {BANK_DETAILS.bankName} — {BANK_DETAILS.accountNumber}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">IBAN</dt>
                <dd className="text-[var(--sec-ink)]">{BANK_DETAILS.iban}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
