export type PerformaInvoiceItemDraft = { key: string; itemDate: string; description: string; amount: string };

export function emptyItem(): PerformaInvoiceItemDraft {
  return { key: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, itemDate: "", description: "", amount: "" };
}

export type PerformaInvoiceFormValues = {
  projectId: string; // "" = not linked to a project
  // Set from context (the Account Project a document is created under),
  // same pattern as QuotationFormValues.accountProjectId — never picked
  // manually in the form, just carried through from the "New performa
  // invoice" link's ?accountProjectId= query param.
  accountProjectId: string;
  issueDate: string;
  customerName: string;
  project: string;
  customerAddress: string;
  vatRatePercent: number;
  signatoryName: string;
  showStamp: boolean;
  notes: string;
  items: PerformaInvoiceItemDraft[];
};

export function defaultPerformaInvoiceValues(): PerformaInvoiceFormValues {
  return {
    projectId: "",
    accountProjectId: "",
    issueDate: new Date().toLocaleDateString("en-GB"),
    customerName: "",
    project: "",
    customerAddress: "",
    vatRatePercent: 5,
    signatoryName: "Eng. Mohammad Abu Eisa",
    showStamp: false,
    notes: "",
    items: [emptyItem()],
  };
}
