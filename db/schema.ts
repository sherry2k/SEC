import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  uuid,
  primaryKey,
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
  location: text("location"),
  status: projectStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
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
  templateId: integer("template_id")
    .notNull()
    .references(() => checklistTemplates.id),
  parentItemId: uuid("parent_item_id").references((): AnyPgColumn => projectChecklistItems.id),
  status: itemStatusEnum("status").notNull().default("not_started"),
  remarks: text("remarks"),
  fileUrl: text("file_url"),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
