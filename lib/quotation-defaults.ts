// Plain data + functions only — deliberately NOT "use client", so Server
// Components (like the New Quotation page) can safely call these directly.
// Anything exported from a "use client" file becomes a client reference once
// imported elsewhere; calling one as a plain function from server code throws
// at runtime rather than at build time, which is exactly what happened here.

export type QuotationItemDraft = {
  key: string;
  description: string;
  classification: string;
  feeExclVat: string;
  scopeOfWork: string;
  duration: string;
  note: string;
};

export function emptyItem(): QuotationItemDraft {
  return {
    key: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    description: "",
    classification: "Mandatory",
    feeExclVat: "",
    scopeOfWork: "",
    duration: "",
    note: "",
  };
}

export type QuotationFormValues = {
  title: string;
  subtitle: string;
  attention: string;
  clientName: string;
  projectDescription: string;
  location: string;
  buildingConfig: string;
  vatRatePercent: number;
  intro: string;
  paymentTerms: string;
  commercialConditions: string;
  signatoryName: string;
  signatoryTitle: string;
  items: QuotationItemDraft[];
};

// No boilerplate content is pre-filled anywhere — every field starts blank
// so nothing needs to be deleted before typing the real content.
export function defaultQuotationValues(): QuotationFormValues {
  return {
    title: "Technical and Commercial Proposal",
    subtitle: "",
    attention: "",
    clientName: "",
    projectDescription: "",
    location: "",
    buildingConfig: "",
    vatRatePercent: 5,
    intro: "",
    paymentTerms: "",
    commercialConditions: "",
    signatoryName: "",
    signatoryTitle: "",
    items: [emptyItem()],
  };
}
