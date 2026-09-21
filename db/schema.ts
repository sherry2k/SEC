import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  uuid,
  primaryKey,
  unique,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { ROLES, USER_STATUSES } from "@/lib/roles";
import { PROJECT_CATEGORIES, ITEM_STATUSES, PROJECT_STATUSES } from "@/lib/checklist";

export const userRoleEnum = pgEnum("user_role", ROLES);
export const userStatusEnum = pgEnum("user_status", USER_STATUSES);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: varchar("username", { length: 30 }).notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("staff"),
  // Job title shown under the person's name — free text ("Architectural
  // Engineer", "Structural Engineer") since titles vary and aren't
  // meaningfully tied to the account role.
  designation: text("designation"),
  status: userStatusEnum("status").notNull().default("pending"),
  approvedBy: integer("approved_by").references((): AnyPgColumn => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ---------------------------------------------------------------------------
// Projects — category/checklist tree (framework doc Section 3)
// ---------------------------------------------------------------------------

export const projectCategoryEnum = pgEnum("project_category", PROJECT_CATEGORIES);
export const itemStatusEnum = pgEnum("item_status", ITEM_STATUSES);
export const projectStatusEnum = pgEnum("project_status", PROJECT_STATUSES);

// One counter per document prefix per year — used for project codes now,
// and quotation/invoice numbers once the Finance phase starts.
export const documentSequences = pgTable(
  "document_sequences",
  {
    prefix: text("prefix").notNull(),
    year: integer("year").notNull(),
    nextNumber: integer("next_number").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.prefix, t.year] })]
);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectCode: text("project_code").notNull().unique(),
  name: text("name").notNull(),
  clientName: text("client_name"),
  buildingName: text("building_name"),
  unitNo: text("unit_no"),
  plotNo: text("plot_no"),
  // The real-world reference issued by the municipality — entered by
  // staff, unrelated to our own auto-generated projectCode above.
  municipalityNo: text("municipality_no"),
  location: text("location"),
  status: projectStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  // Who owns this project day to day — separate from createdBy/updatedBy,
  // which track who touched the record, not who's accountable for the work.
  responsibleId: integer("responsible_id").references(() => users.id),
  // Frozen at the moment a project is marked Completed — stays correct as
  // the record of who actually finished it even if Responsible is later
  // reassigned to someone else for follow-up work.
  completedBy: integer("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  // Remembered per project since the Statement of Account is generated
  // fresh each time rather than saved as its own row — there's nowhere
  // else for this toggle's state to live.
  statementShowStamp: boolean("statement_show_stamp").notNull().default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// A general-purpose audit trail — scoped to Projects today, but the shape
// (actor, optional related project, a short action code, a human-readable
// target name, free-text details) works unchanged for Users or Finance
// events later without a schema change.
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetName: text("target_name").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// The seed tree: BOC / CBC / Permit / Work Permit / Contractor, each with
// its checklist items. Some items (Contractor → Inspection) have their own
// children via parentId — a self-reference, so the tree can go one level
// deeper wherever it needs to without a schema change.
export const checklistTemplates = pgTable("checklist_templates", {
  id: serial("id").primaryKey(),
  category: projectCategoryEnum("category").notNull(),
  parentId: integer("parent_id").references((): AnyPgColumn => checklistTemplates.id),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// A project can be linked to more than one category (framework doc 3.3).
export const projectCategories = pgTable(
  "project_categories",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    category: projectCategoryEnum("category").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.category] })]
);

// The working copy: one row per template item, copied onto the project when
// its category is added. This is what staff actually update day to day.
export const projectChecklistItems = pgTable("project_checklist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  // Nullable now: a template-based item has one; a custom item added by
  // staff for just this project has customName instead. category and
  // sortOrder are stored directly on every item (not just derived via the
  // template join) so custom items — which have no template — still group
  // and sort correctly.
  templateId: integer("template_id").references(() => checklistTemplates.id),
  customName: text("custom_name"),
  category: projectCategoryEnum("category").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  parentItemId: uuid("parent_item_id").references((): AnyPgColumn => projectChecklistItems.id),
  status: itemStatusEnum("status").notNull().default("not_started"),
  // The one field this needs — "days in current status" comes free from
  // updatedAt below, no separate field required for that.
  dueDate: date("due_date", { mode: "date" }),
  remarks: text("remarks"),
  fileUrl: text("file_url"),
  // Submitting is the real staff action worth crediting — approval itself
  // is the municipality's decision, not something a staff member does, so
  // there's no "approvedBy" here on purpose. submittedBy/At update every
  // time the item re-enters "submitted" (e.g. after a resubmission) and
  // otherwise persist as history even if the item is later approved or
  // rejected. approvedAt is just a date, not a person's credit.
  submittedBy: integer("submitted_by").references(() => users.id),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// A running thread, not a single overwritable box — every time feedback
// comes back from an authority, that's a new dated entry, not a
// replacement of the last one.
export const checklistItemComments = pgTable("checklist_item_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => projectChecklistItems.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Finance — Quotations (framework doc Section 4, refined against SEC's real
// quotation format)
// ---------------------------------------------------------------------------

export const quotations = pgTable("quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Optional — links this quotation to a project so its value counts
  // toward that project's financial summary and Statement of Account.
  quotationNo: text("quotation_no").notNull().unique(),
  title: text("title").notNull().default("Technical and Commercial Proposal"),
  subtitle: text("subtitle"),
  attention: text("attention"),
  clientName: text("client_name"),
  projectDescription: text("project_description"),
  location: text("location"),
  buildingConfig: text("building_config"),
  projectId: uuid("project_id").references(() => projects.id),
  vatRatePercent: numeric("vat_rate_percent", { precision: 5, scale: 2 }).notNull().default("5"),
  intro: text("intro"),
  paymentTerms: text("payment_terms"),
  commercialConditions: text("commercial_conditions"),
  // A free-form area for whatever's specific to one quotation — separate
  // from the standing commercial conditions above.
  notes: text("notes"),
  signatoryName: text("signatory_name"),
  // Toggle, off by default — the stamp only appears on the printed page
  // when explicitly turned on for that document.
  showStamp: boolean("show_stamp").notNull().default(false),
  signatoryTitle: text("signatory_title"),
  status: text("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// VAT amount and totals are never stored — always derived from feeExclVat and
// the parent quotation's vatRatePercent, so changing the VAT rate later never
// leaves a stale total sitting in the database.
export const quotationItems = pgTable("quotation_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id")
    .notNull()
    .references(() => quotations.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  description: text("description").notNull(),
  classification: text("classification"),
  feeExclVat: numeric("fee_excl_vat", { precision: 12, scale: 2 }).notNull(),
  scopeOfWork: text("scope_of_work"),
  duration: text("duration"),
  note: text("note"),
});

// ---------------------------------------------------------------------------
// Finance — Performa Invoices (a distinct document from Quotations: a
// pre-payment bill sent to a client, matching SEC's real "PERFORMA INVOICE"
// format — customer + project + a simple item list + one VAT line + total)
// ---------------------------------------------------------------------------

export const performaInvoices = pgTable("performa_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id),
  invoiceNo: text("invoice_no").notNull().unique(),
  issueDate: text("issue_date").notNull(),
  customerName: text("customer_name"),
  project: text("project"),
  customerAddress: text("customer_address"),
  vatRatePercent: numeric("vat_rate_percent", { precision: 5, scale: 2 }).notNull().default("5"),
  signatoryName: text("signatory_name"),
  // Toggle, off by default — the stamp only appears on the printed page
  // when explicitly turned on for that document.
  showStamp: boolean("show_stamp").notNull().default(false),
  status: text("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const performaInvoiceItems = pgTable("performa_invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => performaInvoices.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  itemDate: text("item_date"),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
});

// ---------------------------------------------------------------------------
// Finance — Tax Invoices. Same document family as Performa Invoice, but a
// tax invoice needs each client's TRN (Tax Registration Number) recorded —
// SEC's own TRN is fixed (lib/company.ts), the client's varies and is
// editable per invoice, since it isn't stored anywhere else yet.
// ---------------------------------------------------------------------------

export const taxInvoices = pgTable("tax_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id),
  invoiceNo: text("invoice_no").notNull().unique(),
  issueDate: text("issue_date").notNull(),
  clientName: text("client_name"),
  clientAddress: text("client_address"),
  clientTrn: text("client_trn"),
  vatRatePercent: numeric("vat_rate_percent", { precision: 5, scale: 2 }).notNull().default("5"),
  signatoryName: text("signatory_name"),
  // Toggle, off by default — the stamp only appears on the printed page
  // when explicitly turned on for that document.
  showStamp: boolean("show_stamp").notNull().default(false),
  status: text("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Unlike Performa Invoice, the tax invoice's real-world format shows a date
// per line item, so itemDate is displayed here rather than just stored.
export const taxInvoiceItems = pgTable("tax_invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => taxInvoices.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  itemDate: text("item_date"),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
});

// ---------------------------------------------------------------------------
// Attendance — self check-in/out for Staff, visible only to Admin/Master
// admin. One row per person per calendar day (UAE local date).
// ---------------------------------------------------------------------------

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    date: date("date", { mode: "date" }).notNull(),
    checkInAt: timestamp("check_in_at", { withTimezone: true }),
    checkOutAt: timestamp("check_out_at", { withTimezone: true }),
    // Who created/last touched this row — a self check-in, or an Admin's
    // manual correction for a day someone forgot to check in.
    createdBy: integer("created_by").references(() => users.id),
    updatedBy: integer("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.date)]
);

// ---------------------------------------------------------------------------
// Finance — Receipt Vouchers. Same INV numbering sequence as Tax Invoice —
// both were planned from the start to share one counter (along with a
// future Tax Invoice IN), since they're all variants of the same "money
// changed hands" document family.
// ---------------------------------------------------------------------------

export const receiptVouchers = pgTable("receipt_vouchers", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id),
  voucherNo: text("voucher_no").notNull().unique(),
  issueDate: text("issue_date").notNull(),
  toName: text("to_name"),
  project: text("project"),
  location: text("location"),
  vatRatePercent: numeric("vat_rate_percent", { precision: 5, scale: 2 }).notNull().default("5"),
  signatoryName: text("signatory_name"),
  // Toggle, off by default — the stamp only appears on the printed page
  // when explicitly turned on for that document.
  showStamp: boolean("show_stamp").notNull().default(false),
  status: text("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const receiptVoucherItems = pgTable("receipt_voucher_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  voucherId: uuid("voucher_id")
    .notNull()
    .references(() => receiptVouchers.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  itemDate: text("item_date"),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
});

// ---------------------------------------------------------------------------
// Finance — Invoice. Structurally the same shape as Performa Invoice, but
// it's a different real document: titled "Invoice" and on the shared INV
// numbering sequence with Tax Invoice and Receipt Voucher, not Performa
// Invoice's own separate PINV counter.
// ---------------------------------------------------------------------------

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id),
  invoiceNo: text("invoice_no").notNull().unique(),
  issueDate: text("issue_date").notNull(),
  customerName: text("customer_name"),
  project: text("project"),
  customerAddress: text("customer_address"),
  vatRatePercent: numeric("vat_rate_percent", { precision: 5, scale: 2 }).notNull().default("5"),
  signatoryName: text("signatory_name"),
  // Toggle, off by default — the stamp only appears on the printed page
  // when explicitly turned on for that document.
  showStamp: boolean("show_stamp").notNull().default(false),
  status: text("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  itemDate: text("item_date"),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
});

// ---------------------------------------------------------------------------
// Project attachments — drawings and other files (DWG, PDF, JPG) uploaded
// against a project, stored in Vercel Blob. Only the URL and metadata live
// here; the actual file bytes are on Blob's own storage.
// ---------------------------------------------------------------------------

export const projectAttachments = pgTable("project_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  contentType: text("content_type"),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Daily work reports — one per staff member per calendar day. Hours are
// allocated across projects (or "general" work, projectId null) and must
// sum to that day's attendance total (rounded to the nearest 15 minutes)
// before it can be submitted. Only editable while it's still that day —
// see lib/daily-report.ts for the cutoff logic.
// ---------------------------------------------------------------------------

export const dailyWorkReports = pgTable(
  "daily_work_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    date: date("date", { mode: "date" }).notNull(),
    notes: text("notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.date)]
);

export const dailyWorkReportEntries = pgTable("daily_work_report_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id")
    .notNull()
    .references(() => dailyWorkReports.id, { onDelete: "cascade" }),
  // Null = "General / office work" — time not tied to one project.
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  hours: numeric("hours", { precision: 5, scale: 2 }).notNull(),
});
