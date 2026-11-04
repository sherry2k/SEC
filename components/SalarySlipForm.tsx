"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { calcSalarySlipTotals } from "@/lib/salary-slip-calc";
import { emptySalaryItem, type SalarySlipFormValues, type SalarySlipItemDraft } from "@/lib/salary-slip-defaults";
import StampToggle from "@/components/StampToggle";

export type SalaryEmployeeOption = { id: number; name: string; designation: string | null };

export default function SalarySlipForm({
  mode,
  slipId,
  initial,
  employees,
}: {
  mode: "create" | "edit";
  slipId?: string;
  initial: SalarySlipFormValues;
  employees: SalaryEmployeeOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<SalarySlipFormValues>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof SalarySlipFormValues>(key: K, value: SalarySlipFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const updateItem = (key: string, patch: Partial<SalarySlipItemDraft>) =>
    set("items", values.items.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const removeItem = (key: string) => set("items", values.items.filter((i) => i.key !== key));
  const addItem = (type: "earning" | "deduction") => set("items", [...values.items, emptySalaryItem(type)]);

  const validItems = values.items.filter((i) => i.description.trim() && Number(i.amount) > 0);
  const totals = calcSalarySlipTotals(validItems.map((i) => ({ type: i.type, description: i.description, amount: Number(i.amount) })));

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--sec-ink)]";
  const smallInput =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-2.5 py-1.5 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)] focus:ring-1 focus:ring-[var(--sec-blue)]/20";

  const handleEmployeeSelect = (value: string) => {
    if (value === "__other__") {
      set("employeeId", "");
      return;
    }
    set("employeeId", value);
    const user = employees.find((e) => String(e.id) === value);
    if (user) {
      set("employeeName", user.name);
      if (user.designation) set("designation", user.designation);
    }
  };

  const usingOther = values.employeeId === "" || !employees.some((e) => String(e.id) === values.employeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!values.employeeName.trim()) {
      setError("Employee name is required.");
      return;
    }
    if (validItems.length === 0) {
      setError("Add at least one earning or deduction line with a description and an amount.");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/salary-slips" : `/api/salary-slips/${slipId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, items: validItems.map((i) => ({ ...i, amount: Number(i.amount) })) }),
      });
      const data: { error?: string; slip?: { id: string } } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Couldn't save this salary slip. Try again.");
        setLoading(false);
        return;
      }

      const destination = mode === "create" ? data.slip?.id : slipId;
      router.push(`/accounts/salary-slips/${destination}`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  const renderItemRows = (type: "earning" | "deduction") => {
    const rows = values.items.filter((i) => i.type === type);
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className={labelClass}>{type === "earning" ? "Earnings" : "Deductions"}</label>
        </div>
        <div className="overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] bg-slate-50 text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="w-32 px-3 py-2 font-medium">Amount</th>
                <th className="w-12 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.key} className="border-b border-[var(--sec-line)] last:border-0">
                  <td className="px-3 py-2">
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(item.key, { description: e.target.value })}
                      placeholder={type === "earning" ? "e.g. Basic Salary, Housing Allowance" : "e.g. Absence, Advance"}
                      className={smallInput}
                    />
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
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => addItem(type)}
          className="mt-3 flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-sm font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
        >
          <Plus size={14} />
          Add {type === "earning" ? "earning" : "deduction"}
        </button>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Employee</label>
          <select
            value={usingOther ? "__other__" : values.employeeId}
            onChange={(e) => handleEmployeeSelect(e.target.value)}
            className={inputClass}
          >
            <option value="__other__">Other (no system account)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Pay month</label>
          <input type="month" value={values.payMonth} onChange={(e) => set("payMonth", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Employee name *</label>
          <input
            value={values.employeeName}
            onChange={(e) => set("employeeName", e.target.value)}
            disabled={!usingOther}
            required
            className={`${inputClass} disabled:bg-slate-50 disabled:text-[var(--sec-muted)]`}
          />
        </div>
        <div>
          <label className={labelClass}>Designation</label>
          <input
            value={values.designation}
            onChange={(e) => set("designation", e.target.value)}
            disabled={!usingOther}
            className={`${inputClass} disabled:bg-slate-50 disabled:text-[var(--sec-muted)]`}
          />
        </div>
        <div>
          <label className={labelClass}>Issue date</label>
          <input value={values.issueDate} onChange={(e) => set("issueDate", e.target.value)} placeholder="DD/MM/YYYY" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {renderItemRows("earning")}
        {renderItemRows("deduction")}
      </div>

      {validItems.length > 0 && (
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4 text-sm">
          <div className="flex justify-between text-[var(--sec-muted)]">
            <span>Gross Earnings</span>
            <span>AED {totals.earningsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-[var(--sec-muted)]">
            <span>Total Deductions</span>
            <span>AED {totals.deductionsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-[var(--sec-line)] pt-1 font-bold text-[var(--sec-ink)]">
            <span>Net Pay</span>
            <span>AED {totals.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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

      <div>
        <label className={labelClass}>Signatory name</label>
        <input
          value={values.signatoryName}
          onChange={(e) => set("signatoryName", e.target.value)}
          placeholder="e.g. Eng. Mohammad Abu Eisa"
          className={inputClass}
        />
      </div>

      <StampToggle checked={values.showStamp} onChange={(v) => set("showStamp", v)} />

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "create" ? "Save salary slip" : "Save changes"}
      </button>
    </form>
  );
}
