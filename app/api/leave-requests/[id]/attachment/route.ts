import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — a scanned certificate, not a drawing set

// A supporting document (e.g. a medical certificate) for a leave request —
// only the person who submitted the request can attach one, and only
// while it's still pending.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.status !== "approved") {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const { id } = await params;
  const [existing] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
  }
  if (existing.userId !== user.id) {
    return NextResponse.json({ error: "You don't have access to this." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}.` },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is larger than the 10MB limit." }, { status: 400 });
  }

  let blob;
  try {
    blob = await put(`leave-requests/${id}/${Date.now()}-${file.name}`, file, {
      access: "private",
      addRandomSuffix: false,
    });
  } catch (error) {
    console.error("Blob upload failed:", error);
    return NextResponse.json(
      {
        error:
          "Upload failed. If you just connected the Blob store, make sure you've redeployed since then — " +
          "Vercel only gives a deployment access to storage that existed before it was built.",
      },
      { status: 500 }
    );
  }

  await db
    .update(leaveRequests)
    .set({ attachmentUrl: blob.url, attachmentFileName: file.name, updatedAt: new Date() })
    .where(eq(leaveRequests.id, id));

  return NextResponse.json({ success: true, url: blob.url, fileName: file.name });
}
