import { requirePermission } from "@/lib/auth";
import AccountsTabs from "@/components/AccountsTabs";

export default async function AccountsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("accounts.view");
  return (
    <div>
      <AccountsTabs />
      {children}
    </div>
  );
}
