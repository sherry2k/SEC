import { COMPANY } from "@/lib/company";

export default function PrintFooterStrip() {
  return (
    <div className="border-t border-[var(--sec-line)] pt-3 text-center">
      <img src="/images/certifications.jpg" alt="ISO 9001, ISO 14001, ISO 45001, ICV" className="mx-auto h-8 object-contain" />
      <p className="mt-2 text-[11px] text-[var(--sec-muted)]">
        {COMPANY.address}, Tel: {COMPANY.tel}, Mobile: {COMPANY.mobile}, Email: {COMPANY.email}
      </p>
    </div>
  );
}
