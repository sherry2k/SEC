"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PROJECT_CATEGORIES, CATEGORY_LABELS, CATEGORY_FULL_NAMES, type ProjectCategory } from "@/lib/checklist";

export default function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [unitNo, setUnitNo] = useState("");
  const [location, setLocation] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [notes, setNotes] = useState("");
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--sec-ink)]";

  const toggleCategory = (c: ProjectCategory) => {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    if (categories.length === 0) {
      setError("Select at least one category.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          clientName: clientName.trim(),
          buildingName: buildingName.trim(),
          unitNo: unitNo.trim(),
          location: location.trim(),
          areaSqm: areaSqm ? Number(areaSqm) : undefined,
          notes: notes.trim(),
          categories,
        }),
      });
      const data: { error?: string; project?: { id: string } } = await res.json().catch(() => ({}));

      if (!res.ok || !data.project) {
        setError(data.error || "Couldn't create the project. Try again.");
        setLoading(false);
        return;
      }

      router.push(`/projects/${data.project.id}`);
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
        <label className={labelClass}>Categories</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PROJECT_CATEGORIES.map((c) => (
            <label
              key={c}
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 transition-colors ${
                categories.includes(c)
                  ? "border-[var(--sec-blue)] bg-[var(--sec-blue)]/[0.06]"
                  : "border-[var(--sec-line)] bg-white hover:border-[var(--sec-blue)]/40"
              }`}
            >
              <input
                type="checkbox"
                checked={categories.includes(c)}
                onChange={() => toggleCategory(c)}
                className="mt-0.5 accent-[var(--sec-blue)]"
              />
              <span>
                <span className="block text-sm font-medium text-[var(--sec-ink)]">{CATEGORY_LABELS[c]}</span>
                <span className="block text-xs text-[var(--sec-muted)]">{CATEGORY_FULL_NAMES[c]}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>Project name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="clientName" className={labelClass}>Client</label>
          <input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="buildingName" className={labelClass}>Building / mall name</label>
          <input id="buildingName" value={buildingName} onChange={(e) => setBuildingName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="unitNo" className={labelClass}>Unit / shop number</label>
          <input id="unitNo" value={unitNo} onChange={(e) => setUnitNo(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="location" className={labelClass}>Location</label>
          <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="areaSqm" className={labelClass}>Area (sqm)</label>
          <input
            id="areaSqm"
            type="number"
            min="0"
            step="0.01"
            value={areaSqm}
            onChange={(e) => setAreaSqm(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>Notes</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : "Create project"}
      </button>
    </form>
  );
}
