"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StampToggle from "@/components/StampToggle";

export default function StatementStampToggle({ projectId, initialShowStamp }: { projectId: string; initialShowStamp: boolean }) {
  const router = useRouter();
  const [showStamp, setShowStamp] = useState(initialShowStamp);

  const handleChange = async (next: boolean) => {
    setShowStamp(next); // optimistic
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementShowStamp: next }),
      });
      if (!res.ok) {
        setShowStamp(!next);
        return;
      }
      router.refresh();
    } catch {
      setShowStamp(!next);
    }
  };

  return (
    <div className="no-print max-w-sm">
      <StampToggle checked={showStamp} onChange={handleChange} />
    </div>
  );
}
