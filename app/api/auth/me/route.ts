import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.status !== "approved") {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  return NextResponse.json({ user });
}
