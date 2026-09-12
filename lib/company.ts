// SEC's fixed letterhead details — shared across Quotations, Invoices, and
// any future printable document, so this only needs correcting in one place.
export const COMPANY = {
  legalName: "SOLID ENGINEERING CONSULTANCY - L.L.C - S.P.C",
  address: "Abu Dhabi - UAE",
  tel: "+971 2 6220 1332",
  mobile: "+971 50 7119095",
  email: "solid.con.eng@gmail.com",
};

// Static bank account info printed on Performa Invoices — not something a
// user re-types per document, so it isn't a form field, just fixed letterhead
// data like the phone number above.
export const BANK_DETAILS = {
  accountName: "SOLID ENGINEERING CONSULTANCY",
  bankName: "ADCB",
  accountNumber: "13891995820001",
  iban: "AE980030013891995820001",
  currency: "AED",
};
