import NotificationBell from "@/components/NotificationBell";
import GlobalProjectSearch from "@/components/GlobalProjectSearch";
import AccountMenu from "@/components/AccountMenu";
import type { CurrentUser } from "@/lib/auth";

// Sits above the page content, on every screen size (unlike MobileShell's
// topbar, which only exists on mobile for the hamburger menu).
export default function DashboardTopbar({ user }: { user: CurrentUser }) {
  return (
    <div className="no-print sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[var(--sec-line)] bg-white px-4 py-2 sm:px-8">
      <GlobalProjectSearch />
      <div className="flex items-center gap-2">
        <NotificationBell />
        <AccountMenu name={user.name} role={user.role} />
      </div>
    </div>
  );
}
