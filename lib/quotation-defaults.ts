// Plain data + functions only — deliberately NOT "use client", so Server
// Components (like the New Quotation page) can safely call these directly.
// Anything exported from a "use client" file becomes a client reference once
// imported elsewhere; calling one as a plain function from server code throws
// at runtime rather than at build time, which is exactly what happened here.

import {
  DEFAULT_DOWN_PAYMENT_LABEL,
  QUOTATION_CATEGORY_BALANCE_LABELS,
  QUOTATION_CATEGORY_LABELS,
  type QuotationCategory,
} from "@/lib/quotation-category-constants";

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

export type FeeItemDraft = { key: string; name: string; price: string; note: string };

function emptyFeeItem(): FeeItemDraft {
  return { key: `fee-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: "", price: "", note: "" };
}

export type QuotationFormValues = {
  title: string;
  subtitle: string;
  attention: string;
  clientName: string;
  projectDescription: string;
  location: string;
  buildingConfig: string;
  // Replaces the old free-choice `projectId` select — now always set from
  // context (the Account Project a quotation is created under), never
  // picked manually in the form. "" only for a quotation created outside
  // any Account Project (kept possible for now, not promoted in the UI).
  accountProjectId: string;
  vatRatePercent: number;
  intro: string;
  paymentTerms: string;
  commercialConditions: string;
  notes: string;
  signatoryName: string;
  showStamp: boolean;
  signatoryTitle: string;
  items: QuotationItemDraft[];
  // Category-based quotations (BOC/CBC/Permit/Work Permit) only — "" on a
  // blank/custom quotation, same as before this existed.
  category: string;
  scopeItemsText: string;
  scopeFeeExclVat: string;
  exclusionsText: string;
  acceptanceNote: string;
  mandatoryFees: FeeItemDraft[];
  optionalServices: FeeItemDraft[];
  // Toggle, on by default — whether the Commercial Summary and Payment
  // Schedule table prints on category-based quotations. Same on/off pattern
  // as showStamp above, just defaulting to true instead of false.
  showCommercialSummary: boolean;
  // That table's Down Payment / Balance row wording — category-based
  // quotations only, pre-filled from the category's default (see
  // QUOTATION_CATEGORY_BALANCE_LABELS) but freely editable per document.
  downPaymentLabel: string;
  balanceLabel: string;
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
    accountProjectId: "",
    vatRatePercent: 5,
    intro: DEFAULT_INTRO,
    paymentTerms: DEFAULT_PAYMENT_TERMS,
    commercialConditions: DEFAULT_COMMERCIAL_CONDITIONS,
    notes: "",
    signatoryName: "Eng. Mohammad Abu Eisa",
    showStamp: false,
    signatoryTitle: "",
    items: [emptyItem()],
    category: "",
    scopeItemsText: "",
    scopeFeeExclVat: "",
    exclusionsText: "",
    acceptanceNote: "",
    mandatoryFees: [],
    optionalServices: [],
    showCommercialSummary: true,
    downPaymentLabel: "",
    balanceLabel: "",
  };
}

// Builds the initial form values for a NEW category-based quotation from
// its template — everything pre-filled and freely editable from there,
// same as the blank/custom defaults above.
export function categoryQuotationValues(template: {
  category: string;
  title: string;
  subtitle: string;
  intro: string;
  scopeItemsText: string;
  defaultScopeFeeExclVat: number;
  mandatoryFeeItems: { name: string; defaultPrice: number; note: string }[];
  exclusionsText: string;
  optionalServiceItems: { name: string; defaultPrice: number; note: string }[];
  commercialTermsText: string;
  acceptanceNote: string;
}): QuotationFormValues {
  const toFeeItems = (items: { name: string; defaultPrice: number; note: string }[]): FeeItemDraft[] =>
    items.map((i) => ({ key: `fee-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: i.name, price: String(i.defaultPrice), note: i.note }));

  return {
    title: template.title,
    subtitle: template.subtitle,
    attention: "",
    clientName: "",
    projectDescription: "",
    location: "Abu Dhabi - UAE",
    buildingConfig: "",
    accountProjectId: "",
    vatRatePercent: 5,
    intro: template.intro,
    paymentTerms: "",
    commercialConditions: template.commercialTermsText,
    notes: "",
    signatoryName: "Eng. Mohammad Abu Eisa",
    showStamp: false,
    signatoryTitle: "",
    items: [],
    category: template.category,
    scopeItemsText: template.scopeItemsText,
    scopeFeeExclVat: String(template.defaultScopeFeeExclVat),
    exclusionsText: template.exclusionsText,
    acceptanceNote: template.acceptanceNote,
    mandatoryFees: toFeeItems(template.mandatoryFeeItems),
    optionalServices: toFeeItems(template.optionalServiceItems),
    showCommercialSummary: true,
    downPaymentLabel: DEFAULT_DOWN_PAYMENT_LABEL,
    balanceLabel:
      QUOTATION_CATEGORY_BALANCE_LABELS[template.category as QuotationCategory] ?? QUOTATION_CATEGORY_BALANCE_LABELS.permit,
  };
}

// Builds the initial form values for a quotation started from TWO OR MORE
// categories at once (e.g. a project that needs both BOC and CBC) — each
// template's scope/exclusions get their own lettered sub-heading so the
// client can tell which paragraph belongs to which category, each
// template's fee rows get their name prefixed with that category's label
// so the two categories' items don't blur together in one flat list, and
// the scope fee is the sum of both. Everything stays freely editable from
// there, same as the single-category path.
//
// `category` is stored as a combined human label ("BOC + CBC") rather than
// a real QuotationCategory slug — every place that displays it already
// falls back to showing the raw value when it's not a recognized key
// (`QUOTATION_CATEGORY_LABELS[x] ?? x`), so this displays correctly
// everywhere with no further code changes.
export function mergeCategoryQuotationValues(
  templates: {
    category: string;
    title: string;
    subtitle: string;
    intro: string;
    scopeItemsText: string;
    defaultScopeFeeExclVat: number;
    mandatoryFeeItems: { name: string; defaultPrice: number; note: string }[];
    exclusionsText: string;
    optionalServiceItems: { name: string; defaultPrice: number; note: string }[];
    commercialTermsText: string;
    acceptanceNote: string;
  }[]
): QuotationFormValues {
  const label = (category: string) => QUOTATION_CATEGORY_LABELS[category as QuotationCategory] ?? category;

  const toFeeItems = (items: { name: string; defaultPrice: number; note: string }[], prefix: string): FeeItemDraft[] =>
    items.map((i) => ({
      key: `fee-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: `${prefix} – ${i.name}`,
      price: String(i.defaultPrice),
      note: i.note,
    }));

  const letters = ["A", "B", "C", "D"];
  const section = (text: string, i: number, heading: string) => `${letters[i] ?? i + 1}. ${label(templates[i].category)} – ${heading}\n${text}`;

  return {
    title: templates[0].title,
    subtitle: templates[0].subtitle,
    attention: "",
    clientName: "",
    projectDescription: "",
    location: "Abu Dhabi - UAE",
    buildingConfig: "",
    accountProjectId: "",
    vatRatePercent: 5,
    intro: templates[0].intro,
    paymentTerms: "",
    commercialConditions: templates[0].commercialTermsText,
    notes: "",
    signatoryName: "Eng. Mohammad Abu Eisa",
    showStamp: false,
    signatoryTitle: "",
    items: [],
    category: templates.map((t) => label(t.category)).join(" + "),
    scopeItemsText: templates.map((t, i) => section(t.scopeItemsText, i, "Scope of Services")).join("\n\n"),
    scopeFeeExclVat: String(templates.reduce((sum, t) => sum + t.defaultScopeFeeExclVat, 0)),
    exclusionsText: templates.map((t, i) => section(t.exclusionsText, i, "Exclusions")).join("\n\n"),
    acceptanceNote: templates[0].acceptanceNote,
    mandatoryFees: templates.flatMap((t) => toFeeItems(t.mandatoryFeeItems, label(t.category))),
    optionalServices: templates.flatMap((t) => toFeeItems(t.optionalServiceItems, label(t.category))),
    showCommercialSummary: true,
    downPaymentLabel: DEFAULT_DOWN_PAYMENT_LABEL,
    balanceLabel: templates
      .map((t) => QUOTATION_CATEGORY_BALANCE_LABELS[t.category as QuotationCategory] ?? QUOTATION_CATEGORY_BALANCE_LABELS.permit)
      .join(" / "),
  };
}

export { emptyFeeItem };
