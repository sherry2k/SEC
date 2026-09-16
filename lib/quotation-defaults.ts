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
};

const DEFAULT_DURATION = "30 Working Days";

export function emptyItem(): QuotationItemDraft {
  return {
    key: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    description: "",
    classification: "Mandatory",
    feeExclVat: "",
    scopeOfWork: "",
    duration: DEFAULT_DURATION,
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
  notes: string;
  signatoryName: string;
  showStamp: boolean;
  signatoryTitle: string;
  items: QuotationItemDraft[];
};

const DEFAULT_INTRO =
  "We are pleased to submit our technical and commercial proposal for the requested mandatory and optional consultancy services. Each service is separately priced and will be executed in accordance with the approved scope and applicable authority requirements.";

const DEFAULT_PAYMENT_TERMS =
  "50% down payment upon approval of each service item and before commencement.\n50% upon completion of the respective service item.";

const DEFAULT_COMMERCIAL_CONDITIONS = [
  "All prices are lump sum fees for the scope specifically stated under each service item.",
  "No optional service will commence without the Client's prior written approval.",
  "The stated durations commence upon receipt of the down payment, all required documents and information, and full access to the property.",
  "Authority review periods and delays are not included within the stated working durations.",
  "Authority comments, revisions, and resubmissions within the approved scope are included.",
  "Client requested changes or changes to the approved scope will be treated as a variation.",
  "No additional government fees are currently anticipated under the stated scope.",
  "This proposal is valid for 30 days from the proposal date.",
].join("\n");

// Intro, payment terms, and commercial conditions are all pre-filled now —
// standing boilerplate you'd otherwise retype on every quotation. Notes
// stays blank on purpose: it's the free-form area for whatever's specific
// to that one document.
export function defaultQuotationValues(): QuotationFormValues {
  return {
    title: "Technical and Commercial Proposal",
    subtitle: "",
    attention: "",
    clientName: "",
    projectDescription: "",
    location: "Abu Dhabi - UAE",
    buildingConfig: "",
    vatRatePercent: 5,
    intro: DEFAULT_INTRO,
    paymentTerms: DEFAULT_PAYMENT_TERMS,
    commercialConditions: DEFAULT_COMMERCIAL_CONDITIONS,
    notes: "",
    signatoryName: "Eng. Mohammad Abu Eisa",
    showStamp: false,
    signatoryTitle: "",
    items: [emptyItem()],
  };
}
