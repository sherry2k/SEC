"use client";

import { useState } from "react";
import StatementOfAccountPrintView from "@/components/StatementOfAccountPrintView";
import type { StatementOfAccountData } from "@/components/StatementOfAccountPrintBody";

// A lightweight, non-persisted stand-in for the legacy page's
// StatementStampToggle: Account Projects have no `statementShowStamp`
// column to save against, so this just holds the checkbox in local state
// for this viewing/printing session. Say the word if you want it to
// persist — that just needs a column on account_projects plus a small
// PATCH route mirroring the legacy StatementStampToggle.
export default function AccountProjectStatementView({ data }: { data: StatementOfAccountData }) {
  const [showStamp, setShowStamp] = useState(data.showStamp);

  return (
    <div>
      <div className="no-print mb-4">
        <label className="flex w-fit items-center gap-2 text-sm text-[var(--sec-ink)]">
          <input type="checkbox" checked={showStamp} onChange={(e) => setShowStamp(e.target.checked)} />
          Show stamp
        </label>
      </div>
      <StatementOfAccountPrintView data={{ ...data, showStamp }} />
    </div>
  );
}
