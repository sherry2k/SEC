// Save as: app/api/messages/people/route.ts
import { NextResponse } from "next/server";
import { authorizePermissionApi } from "@/lib/auth";
import { getDirectory } from "@/lib/messages";

export async function GET() {
  const auth = await authorizePermissionApi("messages.use");
  if (!auth.ok) return auth.response;

  const people = await getDirectory(auth.user.id);
  return NextResponse.json({ people });
}
