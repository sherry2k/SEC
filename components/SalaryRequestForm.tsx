"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { emptySalaryRequestItem, type SalaryRequestFormValues, type SalaryRequestItemDraft } from "@/lib/salary-request-defaults";
import type { SalaryEmployeeOption } from "@/components/SalarySlipForm";

export default function SalaryRequestForm({
  mode,
  requestId,
  initial,
  employees,
}: {
  mode: "create" | "edit";
  requestId?: string;
  initial: SalaryRequestFormValues;
  employees: SalaryEmployeeOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<SalaryRequestFormValues>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof SalaryRequestFormValues>(key: K, value: SalaryRequestFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const updateItem = (key: string, patch: Partial<SalaryRequestItemDraft>) =>
    set("items", values.items.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const removeItem = (key: string) => set("items", values.items.filter((i) => i.key !== key));
  const addItem = () => set("items", [...values.items, emptySalaryRequestItem()]);

  const handleEmployeeSelect = (key: string, value: string) => {
    if (value === "__other__") {
      updateItem(key, { employeeId: "" });
      return;
    }
    const user = employees.find((e) => String(e.id) === value);
    updateItem(key, { employeeId: value, employeeName: user?.name ?? "", designation: user?.designation ?? "" });
  };

  const validItems = values.items.filter((i) => i.employeeName.trim() && Number(i.amount) > 0);
  const total = validItems.reduce((sum, i) => sum + Number(i.amount), 0);

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--sec-ink)]";
  const smallInput =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-2.5 py-1.5 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)] focus:ring-1 focus:ring-[var(--sec-blue)]/20";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (validItems.length === 0) {
      setError("Add at least one employee with an amount.");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/salary-requests" : `/api/salary-requests/${requestId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, items: validItems.map((i) => ({ ...i, amount: Number(i.amount) })) }),
      });
      const data: { error?: string; request?: { id: string } } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Couldn't save this salary request. Try again.");
        setLoading(false);
        return;
      }

      const destination = mode === "create" ? data.request?.id : requestId;
      router.push(`/accounts/salary-requests/${destination}`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="max-w-xs">
        <label className={labelClass}>Pay month</label>
        <input type="month" value={values.payMonth} onChange={(e) => set("payMonth", e.target.value)} className={inputClass} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className={labelClass}>Employees</label>
        </div>
        <div className="overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] bg-slate-50 text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-3 py-2 font-medium">Employee</th>
                <th className="w-32 px-3 py-2 font-medium">Amount</th>
                <th className="w-12 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {values.items.map((item) => {
                const usingOther = item.employeeId === "" || !employees.some((e) => String(e.id) === item.employeeId);
                return (
                  <tr key={item.key} className="border-b border-[var(--sec-line)] last:border-0 align-top">
                    <td className="px-3 py-2">
                      <select
                        value={usingOther ? "__other__" : item.employeeId}
                        onChange={(e) => handleEmployeeSelect(item.key, e.target.value)}
                        className={smallInput}
                      >
                        <option value="__other__">Other (no system account)</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                      {usingOther && (
                        <input
                          value={item.employeeName}
                          onChange={(e) => updateItem(item.key, { employeeName: e.target.value })}
                          placeholder="Employee name"
                          className={`${smallInput} mt-1.5`}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateItem(item.key, { amount: e.target.value })}
                        placeholder="0.00"
                        className={smallInput}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-3 flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-sm font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
        >
          <Plus size={14} />
          Add employee
        </button>
      </div>

      {validItems.length > 0 && (
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4 text-sm">
          <div className="flex justify-between font-bold text-[var(--sec-ink)]">
            <span>Total</span>
            <span>AED {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Notes (optional)</label>
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="One per line — leave blank if there's nothing to add"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "create" ? "Save salary request" : "Save changes"}
      </button>
    </form>
  );
}
