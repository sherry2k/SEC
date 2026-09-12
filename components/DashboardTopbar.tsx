import NotificationBell from "@/components/NotificationBell";

// Sits above the page content, on every screen size (unlike MobileShell's
// topbar, which only exists on mobile for the hamburger menu).
export default function DashboardTopbar() {
  return (
    <div className="no-print sticky top-0 z-20 flex items-center justify-end border-b border-[var(--sec-line)] bg-white px-4 py-2 sm:px-8">
      <NotificationBell />
    </div>
  );
}
