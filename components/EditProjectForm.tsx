"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type ProjectFields = {
  name: string;
  clientName: string;
  buildingName: string;
  unitNo: string;
  plotNo: string;
  municipalityNo: string;
  location: string;
  notes: string;
};

export default function EditProjectForm({ projectId, initial }: { projectId: string; initial: ProjectFields }) {
  const router = useRouter();
  const [fields, setFields] = useState<ProjectFields>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--sec-ink)]";

  const set = (key: keyof ProjectFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fields.name.trim()) {
      setError("Project name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Couldn't save these changes. Try again.");
        setLoading(false);
        return;
      }

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>Project name</label>
        <input id="name" value={fields.name} onChange={set("name")} required className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="clientName" className={labelClass}>Client</label>
          <input id="clientName" value={fields.clientName} onChange={set("clientName")} className={inputClass} />
        </div>
        <div>
          <label htmlFor="buildingName" className={labelClass}>Building / mall name</label>
          <input id="buildingName" value={fields.buildingName} onChange={set("buildingName")} className={inputClass} />
        </div>
        <div>
          <label htmlFor="unitNo" className={labelClass}>Unit / shop number</label>
          <input id="unitNo" value={fields.unitNo} onChange={set("unitNo")} className={inputClass} />
        </div>
        <div>
          <label htmlFor="plotNo" className={labelClass}>Plot No.</label>
          <input id="plotNo" value={fields.plotNo} onChange={set("plotNo")} className={inputClass} />
        </div>
        <div>
          <label htmlFor="municipalityNo" className={labelClass}>Project No. (municipality)</label>
          <input id="municipalityNo" value={fields.municipalityNo} onChange={set("municipalityNo")} className={inputClass} />
        </div>
        <div>
          <label htmlFor="location" className={labelClass}>Location</label>
          <input id="location" value={fields.location} onChange={set("location")} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>Notes</label>
        <textarea id="notes" value={fields.notes} onChange={set("notes")} rows={3} className={inputClass} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Save changes"}
        </button>
      </div>
    </form>
  );
}
