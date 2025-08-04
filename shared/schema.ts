import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// SAP Item Master Table
export const sapItemMst = pgTable("sap_item_mst", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  itemcode: varchar("itemcode", { length: 50 }).notNull().unique(),
  itemname: text("itemname").notNull(),
  type: varchar("type", { length: 50 }),
  itemgroup: varchar("itemgroup", { length: 100 }),
  variety: varchar("variety", { length: 100 }),
  subgroup: varchar("subgroup", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  uom: varchar("uom", { length: 20 }),
  taxrate: decimal("taxrate", { precision: 5, scale: 2 }),
  unitsize: varchar("unitsize", { length: 50 }),
  is_litre: boolean("is_litre").default(false),
  case_pack: integer("case_pack")
});

// Platform Master Table
export const pfMst = pgTable("pf_mst", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  pf_name: varchar("pf_name", { length: 100 }).notNull().unique()
});

// Platform Item Master Table
export const pfItemMst = pgTable("pf_item_mst", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  pf_itemcode: varchar("pf_itemcode", { length: 100 }).notNull(),
  pf_itemname: text("pf_itemname").notNull(),
  pf_id: integer("pf_id").notNull().references(() => pfMst.id),
  sap_id: integer("sap_id").notNull().references(() => sapItemMst.id)
});

// Platform PO Table
export const pfPo = pgTable("pf_po", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_number: varchar("po_number", { length: 100 }).notNull().unique(),
  platform: integer("platform").notNull().references(() => pfMst.id),
  serving_distributor: varchar("serving_distributor", { length: 200 }),
  order_date: timestamp("order_date").notNull(),
  expiry_date: timestamp("expiry_date"),
  appointment_date: timestamp("appointment_date"),
  region: varchar("region", { length: 50 }),
  state: varchar("state", { length: 50 }),
  city: varchar("city", { length: 100 }),
  area: varchar("area", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default('Open'),
  attachment: text("attachment"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Platform Order Items Table
export const pfOrderItems = pgTable("pf_order_items", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_id: integer("po_id").notNull().references(() => pfPo.id, { onDelete: "cascade" }),
  item_name: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  sap_code: varchar("sap_code", { length: 50 }),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  basic_rate: decimal("basic_rate", { precision: 10, scale: 2 }).notNull(),
  gst_rate: decimal("gst_rate", { precision: 5, scale: 2 }).notNull(),
  landing_rate: decimal("landing_rate", { precision: 10, scale: 2 }).notNull(),
  total_litres: decimal("total_litres", { precision: 10, scale: 3 }),
  status: varchar("status", { length: 50 }).default('Pending')
});

// Relations
export const sapItemMstRelations = relations(sapItemMst, ({ many }) => ({
  pfItems: many(pfItemMst)
}));

export const pfMstRelations = relations(pfMst, ({ many }) => ({
  pfItems: many(pfItemMst),
  pfPos: many(pfPo)
}));

export const pfItemMstRelations = relations(pfItemMst, ({ one }) => ({
  platform: one(pfMst, {
    fields: [pfItemMst.pf_id],
    references: [pfMst.id]
  }),
  sapItem: one(sapItemMst, {
    fields: [pfItemMst.sap_id],
    references: [sapItemMst.id]
  })
}));

export const pfPoRelations = relations(pfPo, ({ one, many }) => ({
  platform: one(pfMst, {
    fields: [pfPo.platform],
    references: [pfMst.id]
  }),
  orderItems: many(pfOrderItems)
}));

export const pfOrderItemsRelations = relations(pfOrderItems, ({ one }) => ({
  po: one(pfPo, {
    fields: [pfOrderItems.po_id],
    references: [pfPo.id]
  })
}));

// Insert schemas
export const insertSapItemMstSchema = createInsertSchema(sapItemMst).omit({ id: true });
export const insertPfMstSchema = createInsertSchema(pfMst).omit({ id: true });
export const insertPfItemMstSchema = createInsertSchema(pfItemMst).omit({ id: true });
export const insertPfPoSchema = createInsertSchema(pfPo).omit({ id: true, created_at: true, updated_at: true });
export const insertPfOrderItemsSchema = createInsertSchema(pfOrderItems).omit({ id: true, po_id: true });

// Types
export type SapItemMst = typeof sapItemMst.$inferSelect;
export type InsertSapItemMst = z.infer<typeof insertSapItemMstSchema>;
export type PfMst = typeof pfMst.$inferSelect;
export type InsertPfMst = z.infer<typeof insertPfMstSchema>;
export type PfItemMst = typeof pfItemMst.$inferSelect;
export type InsertPfItemMst = z.infer<typeof insertPfItemMstSchema>;
export type PfPo = typeof pfPo.$inferSelect;
export type InsertPfPo = z.infer<typeof insertPfPoSchema>;
export type PfOrderItems = typeof pfOrderItems.$inferSelect;
export type InsertPfOrderItems = z.infer<typeof insertPfOrderItemsSchema>;

// Legacy user table (keeping for compatibility)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
