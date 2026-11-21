import {
  mysqlTable,
  varchar,
  text,
  int,
  decimal,
  boolean,
  timestamp,
  json,
  bigint,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// 1. Shopify OAuth Sessions
export const shopifySessions = mysqlTable("shopify_sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  shop: varchar("shop", { length: 255 }).notNull(),
  state: varchar("state", { length: 255 }).notNull(),
  isOnline: boolean("is_online").default(false).notNull(),
  scope: text("scope"),
  expires: timestamp("expires"),
  accessToken: varchar("access_token", { length: 255 }).notNull(),
  userId: bigint("user_id", { mode: "number" }),
});

// 2. Synced Audio Gear Specs (from Shopify Products)
export const hardwareSpecs = mysqlTable("hardware_specs", {
  id: int("id").autoincrement().primaryKey(),
  shop: varchar("shop", { length: 255 }).notNull(),
  shopifyProductId: varchar("shopify_product_id", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(), // 'IEM' | 'DAC' | 'DAP' | 'Cable'
  connectorType: varchar("connector_type", { length: 64 }).default("2-Pin").notNull(), // '2-Pin' | 'MMCX' | 'N/A'
  outputPort: varchar("output_port", { length: 64 }).default("3.5mm + 4.4mm").notNull(), // '4.4mm' | '3.5mm' | '3.5mm-Only' | '3.5mm + 4.4mm'
  powerLevel: varchar("power_level", { length: 32 }).default("standard").notNull(), // 'standard' | 'high'
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 3. Curated Pocket Rig Bundles
export const rigBlueprints = mysqlTable("rig_blueprints", {
  id: int("id").autoincrement().primaryKey(),
  shop: varchar("shop", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  useCaseProfile: varchar("use_case_profile", { length: 64 }).notNull(), // 'daily_commute' | 'stage_monitoring' | 'desktop_reference'
  synergyScore: int("synergy_score").default(0).notNull(),
  netMarginPct: decimal("net_margin_pct", { precision: 5, scale: 2 }).default("0.00").notNull(),
  bundleDiscountPct: decimal("bundle_discount_pct", { precision: 5, scale: 2 }).default("5.00").notNull(),
  status: varchar("status", { length: 32 }).default("DRAFT").notNull(), // 'ACTIVE' | 'DRAFT'
  warningsJson: json("warnings_json").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 4. Relational Join Table (Blueprints <-> Hardware Specs)
export const blueprintSlots = mysqlTable("blueprint_slots", {
  id: int("id").autoincrement().primaryKey(),
  blueprintId: int("blueprint_id")
    .notNull()
    .references(() => rigBlueprints.id, { onDelete: "cascade" }),
  hardwareSpecId: int("hardware_spec_id")
    .notNull()
    .references(() => hardwareSpecs.id, { onDelete: "cascade" }),
  slotRole: varchar("slot_role", { length: 64 }).notNull(), // 'iem' | 'source' | 'cable'
});

// 5. Immutable Activity & Audit Log
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  shop: varchar("shop", { length: 255 }).notNull(),
  actionType: varchar("action_type", { length: 64 }).notNull(),
  entityName: varchar("entity_name", { length: 255 }).notNull(),
  scoreDelta: int("score_delta").default(0),
  payloadSummary: text("payload_summary").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rigBlueprintsRelations = relations(rigBlueprints, ({ many }) => ({
  slots: many(blueprintSlots),
}));

export const blueprintSlotsRelations = relations(blueprintSlots, ({ one }) => ({
  blueprint: one(rigBlueprints, {
    fields: [blueprintSlots.blueprintId],
    references: [rigBlueprints.id],
  }),
  hardware: one(hardwareSpecs, {
    fields: [blueprintSlots.hardwareSpecId],
    references: [hardwareSpecs.id],
  }),
}));