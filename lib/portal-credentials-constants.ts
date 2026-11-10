// Client-safe: no "server-only" import here, unlike lib/portal-credentials.ts,
// so the list/filter UI (components/PortalCredentialsClient.tsx) can use
// these without pulling in database or crypto code — same split as
// lib/activity-labels.ts vs lib/activity.ts.

export const PORTAL_CREDENTIAL_CATEGORIES = ["Government", "Utility", "Telecom", "Banking", "Other"] as const;
export type PortalCredentialCategory = (typeof PORTAL_CREDENTIAL_CATEGORIES)[number];

// Tailwind-ish inline color pairs (background tint, text) per category —
// mirrors the badges from the design mockup. "Other" falls back to slate.
export const CATEGORY_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Government: { bg: "#EFF6FF", text: "#1D4ED8" },
  Utility: { bg: "#F0FDFA", text: "#0F766E" },
  Telecom: { bg: "#F5F3FF", text: "#7C3AED" },
  Banking: { bg: "#FFFBEB", text: "#B45309" },
  Other: { bg: "#F1F5F9", text: "#475569" },
};
