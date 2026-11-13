import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { receiptVouchers, receiptVoucherItems } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { nextDocumentCode } from "@/lib/sequences";
import { logActivity } from "@/lib/activity";
import { isValidLinkTarget, type LinkableDocumentType } from "@/lib/invoice-link-options";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// Resolves the optional "Linked invoice" fields from the request body
// into a validated (type, id) pair, or null if not linked / the target
// doesn't actually belong to the same project. Shared by POST and PATCH
// so the two routes can't drift on what counts as a valid link.
async function resolveLink(
  body: unknown,
  projectId: string | null,
  accountProjectId: string | null
): Promise<{ linkedDocumentType: string | null; linkedDocumentId: string | null }> {
  const record = body as Record<string, unknown>;
  const type = str(record?.linkedDocumentType);
  const id = str(record?.linkedDocumentId);
  if (!type || !id) return { linkedDocumentType: null, linkedDocumentId: null };
  if (type !== "tax_invoice" && type !== "invoice") return { linkedDocumentType: null, linkedDocumentId: null };

  const valid = await isValidLinkTarget({ type: type as LinkableDocumentType, id, projectId, accountProjectId });
  if (!valid) return { linkedDocumentType: null, linkedDocumentId: null };
  return { linkedDocumentType: type, linkedDocumentId: id };
}

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const toName = str(body?.toName);
    const items: unknown[] = Array.isArray(body?.items) ? body.items : [];

    if (!toName) {
      return NextResponse.json({ error: "Recipient (To) is required." }, { status: 400 });
    }

    const rows = items
      .map((item, index) => {
        const record = item as Record<string, unknown>;
        const description = str(record?.description);
        const amount = Number(record?.amount);
        if (!description || !Number.isFinite(amount)) return null;
        return { sortOrder: index, itemDate: str(record?.itemDate) || null, description, amount: String(amount) };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Add at least one valid line item." }, { status: 400 });
    }

    const vatRatePercent = typeof body?.vatRatePercent === "number" ? body.vatRatePercent : 5;
    const voucherNo = await nextDocumentCode("INV");

    const projectId = str(body?.projectId) || null;
    const accountProjectId = str(body?.accountProjectId) || null;
    const link = await resolveLink(body, projectId, accountProjectId);

    const [voucher] = await db
      .insert(receiptVouchers)
      .values({
        voucherNo,
        issueDate: str(body?.issueDate) || new Date().toLocaleDateString("en-GB"),
        toName,
        projectId,
        // Was missing — the form has carried this through from the "New
        // receipt voucher" link's ?accountProjectId= since that feature was
        // built, but it was never actually read here, so every voucher
        // created from an Account Project page silently lost the link
        // (invisible on that project's page, excluded from Total Received).
        accountProjectId,
        linkedDocumentType: link.linkedDocumentType,
        linkedDocumentId: link.linkedDocumentId,
        project: str(body?.project) || null,
        location: str(body?.location) || null,
        vatRatePercent: String(vatRatePercent),
        signatoryName: str(body?.signatoryName) || null,
        showStamp: Boolean(body?.showStamp),
        notes: str(body?.notes) || null,
        createdBy: auth.user.id,
        updatedBy: auth.user.id,
      })
      .returning();

    await db.insert(receiptVoucherItems).values(rows.map((r) => ({ ...r, voucherId: voucher.id })));

    await logActivity({
      userId: auth.user.id,
      action: "receipt_voucher_created",
      targetName: `${voucher.voucherNo} — ${toName}`,
    });

    return NextResponse.json({ success: true, voucher }, { status: 201 });
  } catch (error) {
    console.error("Create receipt voucher error:", error);
    return NextResponse.json({ error: "Something went wrong on the server. Try again." }, { status: 500 });
  }
}
