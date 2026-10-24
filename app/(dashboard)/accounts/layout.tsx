import { requirePermission } from "@/lib/auth";

export default async function AccountsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("accounts.view");
  return <div>{children}</div>;
}
