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

// Flipkart Grocery PO Header Table
export const flipkartGroceryPoHeader = pgTable("flipkart_grocery_po_header", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_number: varchar("po_number", { length: 50 }).notNull().unique(),
  supplier_name: text("supplier_name").notNull(),
  supplier_address: text("supplier_address"),
  supplier_contact: varchar("supplier_contact", { length: 20 }),
  supplier_email: varchar("supplier_email", { length: 100 }),
  supplier_gstin: varchar("supplier_gstin", { length: 20 }),
  billed_to_address: text("billed_to_address"),
  billed_to_gstin: varchar("billed_to_gstin", { length: 20 }),
  shipped_to_address: text("shipped_to_address"),
  shipped_to_gstin: varchar("shipped_to_gstin", { length: 20 }),
  nature_of_supply: varchar("nature_of_supply", { length: 50 }),
  nature_of_transaction: varchar("nature_of_transaction", { length: 50 }),
  po_expiry_date: timestamp("po_expiry_date"),
  category: varchar("category", { length: 100 }),
  order_date: timestamp("order_date").notNull(),
  mode_of_payment: varchar("mode_of_payment", { length: 50 }),
  contract_ref_id: varchar("contract_ref_id", { length: 100 }),
  contract_version: varchar("contract_version", { length: 10 }),
  credit_term: varchar("credit_term", { length: 100 }),
  total_quantity: integer("total_quantity"),
  total_taxable_value: decimal("total_taxable_value", { precision: 12, scale: 2 }),
  total_tax_amount: decimal("total_tax_amount", { precision: 12, scale: 2 }),
  total_amount: decimal("total_amount", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default('Open'),
  created_by: varchar("created_by", { length: 100 }),
  uploaded_by: varchar("uploaded_by", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Flipkart Grocery PO Lines Table
export const flipkartGroceryPoLines = pgTable("flipkart_grocery_po_lines", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  header_id: integer("header_id").notNull().references(() => flipkartGroceryPoHeader.id, { onDelete: "cascade" }),
  line_number: integer("line_number").notNull(),
  hsn_code: varchar("hsn_code", { length: 20 }),
  fsn_isbn: varchar("fsn_isbn", { length: 50 }),
  quantity: integer("quantity").notNull(),
  pending_quantity: integer("pending_quantity"),
  uom: varchar("uom", { length: 20 }),
  title: text("title").notNull(),
  brand: varchar("brand", { length: 100 }),
  type: varchar("type", { length: 100 }),
  ean: varchar("ean", { length: 20 }),
  vertical: varchar("vertical", { length: 100 }),
  required_by_date: timestamp("required_by_date"),
  supplier_mrp: decimal("supplier_mrp", { precision: 10, scale: 2 }),
  supplier_price: decimal("supplier_price", { precision: 10, scale: 2 }),
  taxable_value: decimal("taxable_value", { precision: 10, scale: 2 }),
  igst_rate: decimal("igst_rate", { precision: 5, scale: 2 }),
  igst_amount_per_unit: decimal("igst_amount_per_unit", { precision: 10, scale: 2 }),
  sgst_rate: decimal("sgst_rate", { precision: 5, scale: 2 }),
  sgst_amount_per_unit: decimal("sgst_amount_per_unit", { precision: 10, scale: 2 }),
  cgst_rate: decimal("cgst_rate", { precision: 5, scale: 2 }),
  cgst_amount_per_unit: decimal("cgst_amount_per_unit", { precision: 10, scale: 2 }),
  cess_rate: decimal("cess_rate", { precision: 5, scale: 2 }),
  cess_amount_per_unit: decimal("cess_amount_per_unit", { precision: 10, scale: 2 }),
  tax_amount: decimal("tax_amount", { precision: 10, scale: 2 }),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).default('Pending'),
  created_by: varchar("created_by", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Relations for Flipkart Grocery PO tables
export const flipkartGroceryPoHeaderRelations = relations(flipkartGroceryPoHeader, ({ many }) => ({
  poLines: many(flipkartGroceryPoLines)
}));

export const flipkartGroceryPoLinesRelations = relations(flipkartGroceryPoLines, ({ one }) => ({
  header: one(flipkartGroceryPoHeader, {
    fields: [flipkartGroceryPoLines.header_id],
    references: [flipkartGroceryPoHeader.id]
  })
}));

// Insert schemas for Flipkart Grocery PO tables
export const insertFlipkartGroceryPoHeaderSchema = createInsertSchema(flipkartGroceryPoHeader).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const insertFlipkartGroceryPoLinesSchema = createInsertSchema(flipkartGroceryPoLines).omit({ 
  id: true, 
  header_id: true, 
  created_at: true, 
  updated_at: true 
});

// Types for Flipkart Grocery PO tables
export type FlipkartGroceryPoHeader = typeof flipkartGroceryPoHeader.$inferSelect;
export type InsertFlipkartGroceryPoHeader = z.infer<typeof insertFlipkartGroceryPoHeaderSchema>;
export type FlipkartGroceryPoLines = typeof flipkartGroceryPoLines.$inferSelect;
export type InsertFlipkartGroceryPoLines = z.infer<typeof insertFlipkartGroceryPoLinesSchema>;
