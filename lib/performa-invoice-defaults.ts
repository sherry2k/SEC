export type PerformaInvoiceItemDraft = { key: string; itemDate: string; description: string; amount: string };

export function emptyItem(): PerformaInvoiceItemDraft {
  return { key: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, itemDate: "", description: "", amount: "" };
}

export type PerformaInvoiceFormValues = {
  projectId: string; // "" = not linked to a project
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
