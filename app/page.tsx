import { redirect } from "next/navigation";

// middleware.ts already redirects "/" for signed-in users; this covers the
// signed-out case (middleware treats "/" as protected, so it sends them to
// /login first — this file is a safety net if that ever changes).
export default function RootPage() {
  redirect("/login");
}
