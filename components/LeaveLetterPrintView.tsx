import PrintDocumentShell from "@/components/PrintDocumentShell";
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_LETTER_TITLES, type LeaveType } from "@/lib/leave";

export type PrintableLeaveRequest = {
  leaveNo: string;
  type: LeaveType;
  staffName: string;
  staffDesignation: string | null;
  startDateLabel: string;
  endDateLabel: string;
  totalDays: number;
  reason: string | null;
  hasAttachment: boolean;
  approvedByName: string;
  approvedAtLabel: string;
};

export default function LeaveLetterPrintView({ request }: { request: PrintableLeaveRequest }) {
  return (
    <PrintDocumentShell
      dateLabel="Date"
      dateValue={request.approvedAtLabel}
      refLabel="Ref."
      refValue={request.leaveNo}
    >
      <h1 className="mt-4 text-center text-lg font-bold uppercase tracking-wide">
        {LEAVE_TYPE_LETTER_TITLES[request.type]}
      </h1>

      <p className="mt-6 font-medium">To Whom It May Concern,</p>

      <p className="mt-3 text-sm leading-relaxed">
        This is to confirm that <span className="font-semibold">{request.staffName}</span>
        {request.staffDesignation && <>, holding the position of <span className="font-semibold">{request.staffDesignation}</span></>}{" "}
        at Solid Engineering Consultancy, has been granted <span className="font-semibold">{LEAVE_TYPE_LABELS[request.type]}</span> for
        the period below{request.type === "sick" && ", in accordance with UAE Labour Law"}.
      </p>

      <table className="mt-5 w-full text-sm">
        <tbody>
          <tr className="border-b border-[var(--sec-line)]">
            <td className="w-40 py-1.5 text-[var(--sec-muted)]">From</td>
            <td className="py-1.5 font-semibold">{request.startDateLabel}</td>
          </tr>
          <tr className="border-b border-[var(--sec-line)]">
            <td className="py-1.5 text-[var(--sec-muted)]">To</td>
            <td className="py-1.5 font-semibold">{request.endDateLabel}</td>
          </tr>
          <tr className="border-b border-[var(--sec-line)]">
            <td className="py-1.5 text-[var(--sec-muted)]">Total Days</td>
            <td className="py-1.5 font-semibold">{request.totalDays} {request.totalDays === 1 ? "day" : "days"}</td>
          </tr>
          <tr className="border-b border-[var(--sec-line)]">
            <td className="py-1.5 text-[var(--sec-muted)]">Leave Type</td>
            <td className="py-1.5 font-semibold">{LEAVE_TYPE_LABELS[request.type]}</td>
          </tr>
        </tbody>
      </table>

      {request.reason && (
        <p className="mt-4 text-sm">
          <span className="text-[var(--sec-muted)]">Reason / Remarks:</span> {request.reason}
        </p>
      )}

      {request.type === "sick" && request.hasAttachment && (
        <p className="mt-1 text-sm">
          <span className="text-[var(--sec-muted)]">Supporting medical certificate:</span> attached
        </p>
      )}

      {request.type === "unpaid" && (
        <p className="mt-4 text-sm">This leave is without salary for the duration stated above.</p>
      )}

      <p className="mt-5 text-sm">This letter is issued upon request for official purposes.</p>

      <div className="mt-10 text-sm">
        <p className="text-[var(--sec-muted)]">Approved by:</p>
        <p className="mt-6 font-semibold">{request.approvedByName}</p>
        <p className="text-[var(--sec-muted)]">Solid Engineering Consultancy</p>
      </div>
    </PrintDocumentShell>
  );
}
