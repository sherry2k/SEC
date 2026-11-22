"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FolderKanban,
  Wallet,
  Users,
  Settings,
  CalendarCheck,
  ClipboardList,
  CalendarOff,
  FileClock,
  MessageCircle,
  Receipt,
  KeyRound,
  Megaphone,
} from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import SignOutButton from "@/components/SignOutButton";
import LogoBadge from "@/components/LogoBadge";
import AttendanceWidget from "@/components/AttendanceWidget";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  show: boolean;
  badge?: number;
};

// Client component so the active nav item can be highlighted from the
// current route (usePathname). The permission checks below are pure and
// synchronous — no data fetching happens here, so this stays just as safe
// as a server component for hiding items a role shouldn't see.
export default function Sidebar({
  user,
  todayAttendance,
  pendingLeaveCount = 0,
  unreadMessageCount = 0,
  unreadAnnouncementCount = 0,
}: {
  user: CurrentUser;
  todayAttendance: {
    checkInAt: string | null;
    lunchOutAt: string | null;
    lunchInAt: string | null;
    checkOutAt: string | null;
  } | null;
  pendingLeaveCount?: number;
  unreadMessageCount?: number;
  unreadAnnouncementCount?: number;
}) {
  const pathname = usePathname();

  // Attendance/Leave Requests (and Document Renewals, which is already
  // gated the same way) read as things to MANAGE for Master Admin/Admin/
  // Finance — so those three live under "HR" for those roles. For Staff
  // they're just personal records, so they stay under "My Space" instead,
  // alongside My Payslips. Same permission that already gates Document
  // Renewals decides which of the two groups a signed-in person gets.
  const isHRRole = can(user.role, "document_renewals.view");

  const messagesItem: NavItem = { href: "/messages", label: "Messages", icon: MessageCircle, show: true, badge: unreadMessageCount };
  const announcementsItem: NavItem = { href: "/announcements", label: "Announcements", icon: Megaphone, show: true, badge: unreadAnnouncementCount };
  const projectsItem: NavItem = { href: "/projects", label: "Projects", icon: FolderKanban, show: can(user.role, "projects.view") };
  const accountsItem: NavItem = { href: "/accounts", label: "Accounts", icon: Wallet, show: can(user.role, "accounts.view") };
  const documentRenewalsItem: NavItem = { href: "/document-renewals", label: "Document Renewals", icon: FileClock, show: can(user.role, "document_renewals.view") };
  const attendanceItem: NavItem = { href: "/attendance", label: "Attendance", icon: CalendarCheck, show: can(user.role, "attendance.view") };
  const leaveRequestsItem: NavItem = { href: "/leave-requests", label: "Leave Requests", icon: CalendarOff, show: true, badge: pendingLeaveCount };
  // Shown to everyone — it only ever lists slips issued to the signed-in
  // person, regardless of role. Admin/Finance manage every slip from
  // Accounts → Salary Slips instead.
  const myPayslipsItem: NavItem = { href: "/my-payslips", label: "My Payslips", icon: Receipt, show: true };
  const dailyReportItem: NavItem = {
    href: "/daily-report",
    label: "Daily Report",
    icon: ClipboardList,
    show: can(user.role, "daily_report.submit", false, user.canSubmitDailyReport),
  };
  const dailyReportsItem: NavItem = { href: "/daily-reports", label: "Daily Reports", icon: ClipboardList, show: can(user.role, "daily_report.view_all") };
  const userManagementItem: NavItem = { href: "/users", label: "User Management", icon: Users, show: can(user.role, "users.manage") };
  // Own top-level nav item, not nested under Accounts — Accounts is
  // visible to Finance too (accounts.view), but this is Admin + Master
  // Admin only (credentials.manage), so it needs its own gated entry.
  const portalCredentialsItem: NavItem = { href: "/portal-credentials", label: "Portal Credentials", icon: KeyRound, show: can(user.role, "credentials.manage") };
  const settingsItem: NavItem = { href: "/settings", label: "Settings", icon: Settings, show: can(user.role, "settings.manage") };

  // Grouped into labelled sections so a long flat list reads as a handful
  // of digestible chunks. Overview keeps no label (it's the home item,
  // not a category). A group whose items are all hidden for this role
  // (e.g. "HR" for Staff, "Admin" for Finance) is dropped entirely below,
  // so its label never shows above an empty section.
  const navGroups: { label: string | null; items: NavItem[] }[] = [
    { label: null, items: [{ href: "/dashboard", label: "Overview", icon: LayoutGrid, show: true }] },
    { label: "Update", items: [messagesItem, announcementsItem] },
    { label: "Work", items: [projectsItem, accountsItem, dailyReportItem, dailyReportsItem] },
    ...(isHRRole ? [{ label: "HR", items: [documentRenewalsItem, attendanceItem, leaveRequestsItem] }] : []),
    { label: "My Space", items: isHRRole ? [myPayslipsItem] : [attendanceItem, leaveRequestsItem, myPayslipsItem] },
    { label: "Admin", items: [userManagementItem, portalCredentialsItem, settingsItem] },
  ];

  return (
    <aside className="relative flex h-full w-64 shrink-0 flex-col overflow-hidden bg-[var(--sec-blue-deep)]">
      {/* Roofline watermark, echoing the login page's brand panel — the one
          deliberately branded surface, kept quiet so the nav stays legible. */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]"
        viewBox="0 0 260 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <line x1="0" y1="140" x2="280" y2="380" stroke="white" strokeWidth="3" />
        <line x1="40" y1="80" x2="260" y2="260" stroke="white" strokeWidth="3" />
        <line x1="120" y1="300" x2="120" y2="500" stroke="white" strokeWidth="3" />
        <line x1="180" y1="240" x2="180" y2="500" stroke="white" strokeWidth="3" />
        <line x1="90" y1="500" x2="220" y2="500" stroke="white" strokeWidth="3" />
      </svg>

      <div className="relative flex items-center gap-2.5 px-5 py-5">
        <LogoBadge size={48} iconSize={42} />
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">Solid Engineering</p>
          <p className="text-xs text-white/55">Consultancy</p>
        </div>
      </div>

      <nav className="relative flex-1 px-3 py-2">
        {navGroups.map((group) => {
          const items = group.items.filter((item) => item.show);
          if (items.length === 0) return null;
          return (
            <div key={group.label ?? "overview"} className="mt-3.5 first:mt-0">
              {group.label && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition-colors ${
                        active
                          ? "border-white bg-white/10 font-medium text-white"
                          : "border-transparent text-white/65 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon size={17} className={active ? "text-white" : "text-white/50"} />
                      <span className="flex-1">{item.label}</span>
                      {"badge" in item && item.badge! > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-semibold text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {can(user.role, "attendance.checkin") && todayAttendance && (
        <div className="relative border-t border-white/10 px-3 py-3">
          <AttendanceWidget
            initialCheckInAt={todayAttendance.checkInAt}
            initialLunchOutAt={todayAttendance.lunchOutAt}
            initialLunchInAt={todayAttendance.lunchInAt}
            initialCheckOutAt={todayAttendance.checkOutAt}
          />
        </div>
      )}

      <div className="relative border-t border-white/10 px-3 py-3">
        <Link
          href="/profile"
          className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-white/5"
        >
          <div className="leading-tight">
            <p className="text-sm font-medium text-white">{user.name}</p>
            {user.designation && <p className="text-xs text-white/70">{user.designation}</p>}
            {user.role !== "staff" && <p className="text-xs text-white/50">{ROLE_LABELS[user.role]}</p>}
          </div>
        </Link>
        <SignOutButton />
      </div>
    </aside>
  );
}
