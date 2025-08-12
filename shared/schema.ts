import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// File Upload Tracking Table for Duplicate Prevention
export const fileUploadTracking = pgTable("file_upload_tracking", {
  id: serial("id").primaryKey(),
  file_hash: varchar("file_hash", { length: 64 }).notNull(),
  original_filename: text("original_filename").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  business_unit: varchar("business_unit", { length: 50 }).notNull(),
  period_type: varchar("period_type", { length: 20 }).notNull(),
  upload_type: varchar("upload_type", { length: 50 }).notNull(), // 'inventory', 'secondary-sales', 'po'
  uploaded_at: timestamp("uploaded_at").defaultNow(),
  file_size: integer("file_size"),
  uploader_info: text("uploader_info")
});

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

// SAP Item Master API Table (synchronized from SQL Server)
export const sapItemMstApi = pgTable("sap_item_mst_api", {
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
  case_pack: integer("case_pack"),
  last_synced: timestamp("last_synced").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
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
  status: varchar("status", { length: 50 }).default('Pending'),
  hsn_code: varchar("hsn_code", { length: 20 })
});

// Distributor Master Table (for managing distributor information)
export const distributorMst = pgTable("distributor_mst", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  distributor_name: varchar("distributor_name", { length: 200 }).notNull().unique(),
  distributor_code: varchar("distributor_code", { length: 50 }).unique(),
  contact_person: varchar("contact_person", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  region: varchar("region", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default('Active'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Distributor PO Table
export const distributorPo = pgTable("distributor_po", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_number: varchar("po_number", { length: 100 }).notNull().unique(),
  distributor_id: integer("distributor_id").notNull().references(() => distributorMst.id),
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

// Distributor Order Items Table
export const distributorOrderItems = pgTable("distributor_order_items", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_id: integer("po_id").notNull().references(() => distributorPo.id, { onDelete: "cascade" }),
  item_name: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  sap_code: varchar("sap_code", { length: 50 }),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  basic_rate: decimal("basic_rate", { precision: 10, scale: 2 }).notNull(),
  gst_rate: decimal("gst_rate", { precision: 5, scale: 2 }).notNull(),
  landing_rate: decimal("landing_rate", { precision: 10, scale: 2 }).notNull(),
  total_litres: decimal("total_litres", { precision: 10, scale: 3 }),
  status: varchar("status", { length: 50 }).default('Pending'),
  hsn_code: varchar("hsn_code", { length: 20 })
});

// Insert and Select schemas for new table
export const insertSapItemMstApiSchema = createInsertSchema(sapItemMstApi).omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_synced: true,
});
export type InsertSapItemMstApi = z.infer<typeof insertSapItemMstApiSchema>;
export type SapItemMstApi = typeof sapItemMstApi.$inferSelect;

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

// Distributor relations
export const distributorMstRelations = relations(distributorMst, ({ many }) => ({
  distributorPos: many(distributorPo)
}));

export const distributorPoRelations = relations(distributorPo, ({ one, many }) => ({
  distributor: one(distributorMst, {
    fields: [distributorPo.distributor_id],
    references: [distributorMst.id]
  }),
  orderItems: many(distributorOrderItems)
}));

export const distributorOrderItemsRelations = relations(distributorOrderItems, ({ one }) => ({
  po: one(distributorPo, {
    fields: [distributorOrderItems.po_id],
    references: [distributorPo.id]
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

// Distributor insert schemas and types
export const insertDistributorMstSchema = createInsertSchema(distributorMst).omit({ id: true, created_at: true, updated_at: true });
export const insertDistributorPoSchema = createInsertSchema(distributorPo).omit({ id: true, created_at: true, updated_at: true });
export const insertDistributorOrderItemsSchema = createInsertSchema(distributorOrderItems).omit({ id: true, po_id: true });

export type DistributorMst = typeof distributorMst.$inferSelect;
export type InsertDistributorMst = z.infer<typeof insertDistributorMstSchema>;
export type DistributorPo = typeof distributorPo.$inferSelect;
export type InsertDistributorPo = z.infer<typeof insertDistributorPoSchema>;
export type DistributorOrderItems = typeof distributorOrderItems.$inferSelect;
export type InsertDistributorOrderItems = z.infer<typeof insertDistributorOrderItemsSchema>;

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

// Zepto PO Schema
export const zeptoPoHeader = pgTable("zepto_po_header", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_number: varchar("po_number", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("Open"),
  total_quantity: integer("total_quantity").default(0),
  total_cost_value: decimal("total_cost_value", { precision: 15, scale: 2 }).default("0"),
  total_tax_amount: decimal("total_tax_amount", { precision: 15, scale: 2 }).default("0"),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 }).default("0"),
  unique_brands: text("unique_brands").array(),
  created_by: varchar("created_by", { length: 100 }),
  uploaded_by: varchar("uploaded_by", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const zeptoPoLines = pgTable("zepto_po_lines", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_header_id: integer("po_header_id").references(() => zeptoPoHeader.id, { onDelete: "cascade" }),
  line_number: integer("line_number").notNull(),
  po_number: varchar("po_number", { length: 50 }),
  sku: text("sku"),
  brand: varchar("brand", { length: 100 }),
  sku_id: varchar("sku_id", { length: 100 }),
  sap_id: varchar("sap_id", { length: 50 }),
  hsn_code: varchar("hsn_code", { length: 20 }),
  ean_no: varchar("ean_no", { length: 50 }),
  po_qty: integer("po_qty").default(0),
  asn_qty: integer("asn_qty").default(0),
  grn_qty: integer("grn_qty").default(0),
  remaining_qty: integer("remaining_qty").default(0),
  cost_price: decimal("cost_price", { precision: 10, scale: 2 }),
  cgst: decimal("cgst", { precision: 10, scale: 2 }),
  sgst: decimal("sgst", { precision: 10, scale: 2 }),
  igst: decimal("igst", { precision: 10, scale: 2 }),
  cess: decimal("cess", { precision: 10, scale: 2 }),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  total_value: decimal("total_value", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 20 }).default("Pending"),
  created_by: varchar("created_by", { length: 100 }),
  created_at: timestamp("created_at").defaultNow()
});

// Relations for Zepto PO tables
export const zeptoPoHeaderRelations = relations(zeptoPoHeader, ({ many }) => ({
  poLines: many(zeptoPoLines)
}));

export const zeptoPoLinesRelations = relations(zeptoPoLines, ({ one }) => ({
  header: one(zeptoPoHeader, {
    fields: [zeptoPoLines.po_header_id],
    references: [zeptoPoHeader.id]
  })
}));

// Insert schemas for Zepto PO tables
export const insertZeptoPoHeaderSchema = createInsertSchema(zeptoPoHeader).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertZeptoPoLinesSchema = createInsertSchema(zeptoPoLines).omit({
  id: true,
  po_header_id: true,
  created_at: true
});

// Types for Zepto PO tables
export type ZeptoPoHeader = typeof zeptoPoHeader.$inferSelect;
export type InsertZeptoPoHeader = z.infer<typeof insertZeptoPoHeaderSchema>;
export type ZeptoPoLines = typeof zeptoPoLines.$inferSelect;
export type InsertZeptoPoLines = z.infer<typeof insertZeptoPoLinesSchema>;

// City Mall PO Tables
export const cityMallPoHeader = pgTable("city_mall_po_header", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_number: varchar("po_number", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("Open"),
  total_quantity: integer("total_quantity").default(0),
  total_base_amount: decimal("total_base_amount", { precision: 15, scale: 2 }).default("0"),
  total_igst_amount: decimal("total_igst_amount", { precision: 15, scale: 2 }).default("0"),
  total_cess_amount: decimal("total_cess_amount", { precision: 15, scale: 2 }).default("0"),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 }).default("0"),
  unique_hsn_codes: text("unique_hsn_codes").array(),
  created_by: varchar("created_by", { length: 100 }),
  uploaded_by: varchar("uploaded_by", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const cityMallPoLines = pgTable("city_mall_po_lines", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_header_id: integer("po_header_id").references(() => cityMallPoHeader.id, { onDelete: "cascade" }),
  line_number: integer("line_number").notNull(),
  article_id: varchar("article_id", { length: 50 }),
  article_name: text("article_name"),
  hsn_code: varchar("hsn_code", { length: 20 }),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  base_cost_price: decimal("base_cost_price", { precision: 10, scale: 2 }),
  quantity: integer("quantity").default(0),
  base_amount: decimal("base_amount", { precision: 15, scale: 2 }),
  igst_percent: decimal("igst_percent", { precision: 5, scale: 2 }),
  cess_percent: decimal("cess_percent", { precision: 5, scale: 2 }),
  igst_amount: decimal("igst_amount", { precision: 10, scale: 2 }),
  cess_amount: decimal("cess_amount", { precision: 10, scale: 2 }),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 20 }).default("Pending"),
  created_by: varchar("created_by", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
});

// Relations for City Mall PO tables
export const cityMallPoHeaderRelations = relations(cityMallPoHeader, ({ many }) => ({
  poLines: many(cityMallPoLines)
}));

export const cityMallPoLinesRelations = relations(cityMallPoLines, ({ one }) => ({
  header: one(cityMallPoHeader, {
    fields: [cityMallPoLines.po_header_id],
    references: [cityMallPoHeader.id]
  })
}));

// Insert schemas for City Mall PO tables
export const insertCityMallPoHeaderSchema = createInsertSchema(cityMallPoHeader).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertCityMallPoLinesSchema = createInsertSchema(cityMallPoLines).omit({
  id: true,
  po_header_id: true,
  created_at: true
});

// Types for City Mall PO tables
export type CityMallPoHeader = typeof cityMallPoHeader.$inferSelect;
export type InsertCityMallPoHeader = z.infer<typeof insertCityMallPoHeaderSchema>;
export type CityMallPoLines = typeof cityMallPoLines.$inferSelect;
export type InsertCityMallPoLines = z.infer<typeof insertCityMallPoLinesSchema>;

// Blinkit PO Tables
export const blinkitPoHeader = pgTable("blinkit_po_header", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_number: varchar("po_number", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("Open"),
  total_quantity: integer("total_quantity").default(0),
  total_items: integer("total_items").default(0),
  total_basic_cost: decimal("total_basic_cost", { precision: 15, scale: 2 }).default("0"),
  total_tax_amount: decimal("total_tax_amount", { precision: 15, scale: 2 }).default("0"),
  total_landing_rate: decimal("total_landing_rate", { precision: 15, scale: 2 }).default("0"),
  cart_discount: decimal("cart_discount", { precision: 15, scale: 2 }).default("0"),
  net_amount: decimal("net_amount", { precision: 15, scale: 2 }).default("0"),
  unique_hsn_codes: text("unique_hsn_codes").array(),
  created_by: varchar("created_by", { length: 100 }),
  uploaded_by: varchar("uploaded_by", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const blinkitPoLines = pgTable("blinkit_po_lines", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_header_id: integer("po_header_id").references(() => blinkitPoHeader.id, { onDelete: "cascade" }),
  line_number: integer("line_number").notNull(),
  item_code: varchar("item_code", { length: 50 }),
  hsn_code: varchar("hsn_code", { length: 20 }),
  product_upc: varchar("product_upc", { length: 50 }),
  product_description: text("product_description"),
  grammage: varchar("grammage", { length: 50 }),
  basic_cost_price: decimal("basic_cost_price", { precision: 10, scale: 2 }),
  cgst_percent: decimal("cgst_percent", { precision: 5, scale: 2 }),
  sgst_percent: decimal("sgst_percent", { precision: 5, scale: 2 }),
  igst_percent: decimal("igst_percent", { precision: 5, scale: 2 }),
  cess_percent: decimal("cess_percent", { precision: 5, scale: 2 }),
  additional_cess: decimal("additional_cess", { precision: 10, scale: 2 }),
  tax_amount: decimal("tax_amount", { precision: 10, scale: 2 }),
  landing_rate: decimal("landing_rate", { precision: 10, scale: 2 }),
  quantity: integer("quantity").default(0),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  margin_percent: decimal("margin_percent", { precision: 5, scale: 2 }),
  total_amount: decimal("total_amount", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 20 }).default("Active"),
  created_by: varchar("created_by", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
});

// Relations for Blinkit PO tables
export const blinkitPoHeaderRelations = relations(blinkitPoHeader, ({ many }) => ({
  poLines: many(blinkitPoLines)
}));

export const blinkitPoLinesRelations = relations(blinkitPoLines, ({ one }) => ({
  header: one(blinkitPoHeader, {
    fields: [blinkitPoLines.po_header_id],
    references: [blinkitPoHeader.id]
  })
}));

// Insert schemas for Blinkit PO tables
export const insertBlinkitPoHeaderSchema = createInsertSchema(blinkitPoHeader).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertBlinkitPoLinesSchema = createInsertSchema(blinkitPoLines).omit({
  id: true,
  po_header_id: true,
  created_at: true
});

// Types for Blinkit PO tables
export type BlinkitPoHeader = typeof blinkitPoHeader.$inferSelect;
export type InsertBlinkitPoHeader = z.infer<typeof insertBlinkitPoHeaderSchema>;
export type BlinkitPoLines = typeof blinkitPoLines.$inferSelect;
export type InsertBlinkitPoLines = z.infer<typeof insertBlinkitPoLinesSchema>;

// Swiggy PO tables
export const swiggyPos = pgTable("swiggy_pos", {
  id: serial("id").primaryKey(),
  po_number: varchar("po_number", { length: 100 }).notNull().unique(),
  po_date: timestamp("po_date"),
  po_release_date: timestamp("po_release_date"),
  expected_delivery_date: timestamp("expected_delivery_date"),
  po_expiry_date: timestamp("po_expiry_date"),
  vendor_name: varchar("vendor_name", { length: 255 }),
  payment_terms: varchar("payment_terms", { length: 100 }),
  total_items: integer("total_items").default(0),
  total_quantity: integer("total_quantity").default(0),
  total_taxable_value: decimal("total_taxable_value", { precision: 15, scale: 2 }),
  total_tax_amount: decimal("total_tax_amount", { precision: 15, scale: 2 }),
  grand_total: decimal("grand_total", { precision: 15, scale: 2 }),
  unique_hsn_codes: varchar("unique_hsn_codes").array(),
  status: varchar("status", { length: 50 }).default("pending"),
  created_by: varchar("created_by", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const swiggyPoLines = pgTable("swiggy_po_lines", {
  id: serial("id").primaryKey(),
  po_id: integer("po_id").references(() => swiggyPos.id, { onDelete: "cascade" }),
  line_number: integer("line_number").notNull(),
  item_code: varchar("item_code", { length: 100 }).notNull(),
  item_description: text("item_description"),
  hsn_code: varchar("hsn_code", { length: 20 }),
  quantity: integer("quantity").notNull(),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  unit_base_cost: decimal("unit_base_cost", { precision: 10, scale: 3 }),
  taxable_value: decimal("taxable_value", { precision: 12, scale: 5 }),
  cgst_rate: decimal("cgst_rate", { precision: 5, scale: 2 }),
  cgst_amount: decimal("cgst_amount", { precision: 10, scale: 5 }),
  sgst_rate: decimal("sgst_rate", { precision: 5, scale: 2 }),
  sgst_amount: decimal("sgst_amount", { precision: 10, scale: 5 }),
  igst_rate: decimal("igst_rate", { precision: 5, scale: 2 }),
  igst_amount: decimal("igst_amount", { precision: 10, scale: 5 }),
  cess_rate: decimal("cess_rate", { precision: 5, scale: 2 }),
  cess_amount: decimal("cess_amount", { precision: 10, scale: 5 }),
  additional_cess: decimal("additional_cess", { precision: 10, scale: 5 }),
  total_tax_amount: decimal("total_tax_amount", { precision: 10, scale: 5 }),
  line_total: decimal("line_total", { precision: 12, scale: 5 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const swiggyPosRelations = relations(swiggyPos, ({ many }) => ({
  poLines: many(swiggyPoLines),
}));

export const swiggyPoLinesRelations = relations(swiggyPoLines, ({ one }) => ({
  po: one(swiggyPos, {
    fields: [swiggyPoLines.po_id],
    references: [swiggyPos.id],
  }),
}));

// Insert schemas for Swiggy PO tables
export const insertSwiggyPoSchema = createInsertSchema(swiggyPos).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertSwiggyPoLinesSchema = createInsertSchema(swiggyPoLines).omit({
  id: true,
  po_id: true,
  created_at: true
});

export type SwiggyPo = typeof swiggyPos.$inferSelect;
export type InsertSwiggyPo = z.infer<typeof insertSwiggyPoSchema>;
export type SwiggyPoLine = typeof swiggyPoLines.$inferSelect;
export type InsertSwiggyPoLine = z.infer<typeof insertSwiggyPoLinesSchema>;

// BigBasket PO tables
export const bigbasketPoHeader = pgTable("bigbasket_po_header", {
  id: serial("id").primaryKey(),
  po_number: varchar("po_number", { length: 100 }).notNull().unique(),
  po_date: timestamp("po_date"),
  po_expiry_date: timestamp("po_expiry_date"),
  warehouse_address: text("warehouse_address"),
  delivery_address: text("delivery_address"),
  supplier_name: varchar("supplier_name", { length: 255 }),
  supplier_address: text("supplier_address"),
  supplier_gstin: varchar("supplier_gstin", { length: 50 }),
  dc_address: text("dc_address"),
  dc_gstin: varchar("dc_gstin", { length: 50 }),
  total_items: integer("total_items").default(0),
  total_quantity: integer("total_quantity").default(0),
  total_basic_cost: decimal("total_basic_cost", { precision: 15, scale: 2 }),
  total_gst_amount: decimal("total_gst_amount", { precision: 15, scale: 2 }),
  total_cess_amount: decimal("total_cess_amount", { precision: 15, scale: 2 }),
  grand_total: decimal("grand_total", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 50 }).default("pending"),
  created_by: varchar("created_by", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const bigbasketPoLines = pgTable("bigbasket_po_lines", {
  id: serial("id").primaryKey(),
  po_id: integer("po_id").references(() => bigbasketPoHeader.id, { onDelete: "cascade" }),
  s_no: integer("s_no").notNull(),
  hsn_code: varchar("hsn_code", { length: 20 }),
  sku_code: varchar("sku_code", { length: 100 }).notNull(),
  description: text("description"),
  ean_upc_code: varchar("ean_upc_code", { length: 50 }),
  case_quantity: integer("case_quantity"),
  quantity: integer("quantity").notNull(),
  basic_cost: decimal("basic_cost", { precision: 10, scale: 2 }),
  sgst_percent: decimal("sgst_percent", { precision: 5, scale: 2 }),
  sgst_amount: decimal("sgst_amount", { precision: 10, scale: 2 }),
  cgst_percent: decimal("cgst_percent", { precision: 5, scale: 2 }),
  cgst_amount: decimal("cgst_amount", { precision: 10, scale: 2 }),
  igst_percent: decimal("igst_percent", { precision: 5, scale: 2 }),
  igst_amount: decimal("igst_amount", { precision: 10, scale: 2 }),
  gst_percent: decimal("gst_percent", { precision: 5, scale: 2 }),
  gst_amount: decimal("gst_amount", { precision: 10, scale: 2 }),
  cess_percent: decimal("cess_percent", { precision: 5, scale: 2 }),
  cess_value: decimal("cess_value", { precision: 10, scale: 2 }),
  state_cess_percent: decimal("state_cess_percent", { precision: 5, scale: 2 }),
  state_cess: decimal("state_cess", { precision: 10, scale: 2 }),
  landing_cost: decimal("landing_cost", { precision: 10, scale: 2 }),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  total_value: decimal("total_value", { precision: 12, scale: 2 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const bigbasketPoHeaderRelations = relations(bigbasketPoHeader, ({ many }) => ({
  poLines: many(bigbasketPoLines),
}));

export const bigbasketPoLinesRelations = relations(bigbasketPoLines, ({ one }) => ({
  po: one(bigbasketPoHeader, {
    fields: [bigbasketPoLines.po_id],
    references: [bigbasketPoHeader.id],
  }),
}));

// Insert schemas for BigBasket PO tables
export const insertBigbasketPoHeaderSchema = createInsertSchema(bigbasketPoHeader).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertBigbasketPoLinesSchema = createInsertSchema(bigbasketPoLines).omit({
  id: true,
  po_id: true,
  created_at: true
});

export type BigbasketPoHeader = typeof bigbasketPoHeader.$inferSelect;
export type InsertBigbasketPoHeader = z.infer<typeof insertBigbasketPoHeaderSchema>;
export type BigbasketPoLines = typeof bigbasketPoLines.$inferSelect;
export type InsertBigbasketPoLines = z.infer<typeof insertBigbasketPoLinesSchema>;

// Zomato PO Header Table
export const zomatoPoHeader = pgTable("zomato_po_header", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_number: varchar("po_number", { length: 100 }).notNull().unique(),
  po_date: timestamp("po_date"),
  expected_delivery_date: timestamp("expected_delivery_date"),
  account_number: varchar("account_number", { length: 50 }),
  vendor_id: varchar("vendor_id", { length: 50 }),
  bill_from_name: text("bill_from_name"),
  bill_from_address: text("bill_from_address"),
  bill_from_gstin: varchar("bill_from_gstin", { length: 20 }),
  bill_from_phone: varchar("bill_from_phone", { length: 20 }),
  bill_to_name: text("bill_to_name"),
  bill_to_address: text("bill_to_address"),
  bill_to_gstin: varchar("bill_to_gstin", { length: 20 }),
  ship_from_name: text("ship_from_name"),
  ship_from_address: text("ship_from_address"),
  ship_from_gstin: varchar("ship_from_gstin", { length: 20 }),
  ship_to_name: text("ship_to_name"),
  ship_to_address: text("ship_to_address"),
  ship_to_gstin: varchar("ship_to_gstin", { length: 20 }),
  total_items: integer("total_items").default(0),
  total_quantity: decimal("total_quantity", { precision: 15, scale: 2 }).default("0"),
  grand_total: decimal("grand_total", { precision: 15, scale: 2 }).default("0"),
  total_tax_amount: decimal("total_tax_amount", { precision: 15, scale: 2 }).default("0"),
  uploaded_by: varchar("uploaded_by", { length: 100 }).default("admin"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Zomato PO Items Table
export const zomatoPoItems = pgTable("zomato_po_items", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_header_id: integer("po_header_id").notNull().references(() => zomatoPoHeader.id, { onDelete: "cascade" }),
  line_number: integer("line_number").notNull(),
  product_number: varchar("product_number", { length: 100 }),
  product_name: text("product_name"),
  hsn_code: varchar("hsn_code", { length: 20 }),
  quantity_ordered: decimal("quantity_ordered", { precision: 15, scale: 2 }),
  price_per_unit: decimal("price_per_unit", { precision: 15, scale: 2 }),
  uom: varchar("uom", { length: 50 }),
  gst_rate: decimal("gst_rate", { precision: 5, scale: 4 }),
  total_tax_amount: decimal("total_tax_amount", { precision: 15, scale: 2 }),
  line_total: decimal("line_total", { precision: 15, scale: 2 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Zomato Relations
export const zomatoPoHeaderRelations = relations(zomatoPoHeader, ({ many }) => ({
  poItems: many(zomatoPoItems),
}));

export const zomatoPoItemsRelations = relations(zomatoPoItems, ({ one }) => ({
  po: one(zomatoPoHeader, {
    fields: [zomatoPoItems.po_header_id],
    references: [zomatoPoHeader.id],
  }),
}));

// Insert schemas for Zomato PO tables
export const insertZomatoPoHeaderSchema = createInsertSchema(zomatoPoHeader).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertZomatoPoItemsSchema = createInsertSchema(zomatoPoItems).omit({
  id: true,
  po_header_id: true,
  created_at: true,
  updated_at: true
});

export type ZomatoPoHeader = typeof zomatoPoHeader.$inferSelect;
export type InsertZomatoPoHeader = z.infer<typeof insertZomatoPoHeaderSchema>;
export type ZomatoPoItems = typeof zomatoPoItems.$inferSelect;
export type InsertZomatoPoItems = z.infer<typeof insertZomatoPoItemsSchema>;

// Dealshare PO Header Table
export const dealsharePoHeader = pgTable("dealshare_po_header", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_number: varchar("po_number", { length: 100 }).notNull().unique(),
  po_created_date: timestamp("po_created_date"),
  po_delivery_date: timestamp("po_delivery_date"),
  po_expiry_date: timestamp("po_expiry_date"),
  shipped_by: text("shipped_by"),
  shipped_by_address: text("shipped_by_address"),
  shipped_by_gstin: varchar("shipped_by_gstin", { length: 20 }),
  shipped_by_phone: varchar("shipped_by_phone", { length: 20 }),
  vendor_code: varchar("vendor_code", { length: 50 }),
  shipped_to: text("shipped_to"),
  shipped_to_address: text("shipped_to_address"),
  shipped_to_gstin: varchar("shipped_to_gstin", { length: 20 }),
  bill_to: text("bill_to"),
  bill_to_address: text("bill_to_address"),
  bill_to_gstin: varchar("bill_to_gstin", { length: 20 }),
  comments: text("comments"),
  total_items: integer("total_items").default(0),
  total_quantity: decimal("total_quantity", { precision: 15, scale: 2 }).default("0"),
  total_gross_amount: decimal("total_gross_amount", { precision: 15, scale: 2 }).default("0"),
  uploaded_by: varchar("uploaded_by", { length: 100 }).default("admin"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Dealshare PO Items Table
export const dealsharePoItems = pgTable("dealshare_po_items", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  po_header_id: integer("po_header_id").notNull().references(() => dealsharePoHeader.id, { onDelete: "cascade" }),
  line_number: integer("line_number").notNull(),
  sku: varchar("sku", { length: 100 }),
  product_name: text("product_name"),
  hsn_code: varchar("hsn_code", { length: 20 }),
  quantity: integer("quantity"),
  mrp_tax_inclusive: decimal("mrp_tax_inclusive", { precision: 10, scale: 2 }),
  buying_price: decimal("buying_price", { precision: 10, scale: 2 }),
  gst_percent: decimal("gst_percent", { precision: 5, scale: 2 }),
  cess_percent: decimal("cess_percent", { precision: 5, scale: 2 }),
  gross_amount: decimal("gross_amount", { precision: 12, scale: 2 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Dealshare Relations
export const dealsharePoHeaderRelations = relations(dealsharePoHeader, ({ many }) => ({
  poItems: many(dealsharePoItems),
}));

export const dealsharePoItemsRelations = relations(dealsharePoItems, ({ one }) => ({
  po: one(dealsharePoHeader, {
    fields: [dealsharePoItems.po_header_id],
    references: [dealsharePoHeader.id],
  }),
}));

// Insert schemas for Dealshare PO tables
export const insertDealsharePoHeaderSchema = createInsertSchema(dealsharePoHeader).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertDealsharePoItemsSchema = createInsertSchema(dealsharePoItems).omit({
  id: true,
  po_header_id: true,
  created_at: true,
  updated_at: true
});

export type DealsharePoHeader = typeof dealsharePoHeader.$inferSelect;
export type InsertDealsharePoHeader = z.infer<typeof insertDealsharePoHeaderSchema>;
export type DealsharePoItems = typeof dealsharePoItems.$inferSelect;
export type InsertDealsharePoItems = z.infer<typeof insertDealsharePoItemsSchema>;

// Secondary Sales Header Table
export const secondarySalesHeader = pgTable("secondary_sales_header", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  platform: varchar("platform", { length: 50 }).notNull(), // amazon, flipkart, etc.
  business_unit: varchar("business_unit", { length: 50 }).notNull(), // jivo-wellness, jivo-mart, marketplace
  period_start: timestamp("period_start"),
  period_end: timestamp("period_end"),
  report_generated_date: timestamp("report_generated_date"),
  total_items: integer("total_items").default(0),
  total_quantity: decimal("total_quantity", { precision: 15, scale: 2 }).default("0"),
  total_sales_amount: decimal("total_sales_amount", { precision: 15, scale: 2 }).default("0"),
  total_commission: decimal("total_commission", { precision: 15, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 10 }).default("INR"),
  status: varchar("status", { length: 20 }).default("Active"),
  uploaded_by: varchar("uploaded_by", { length: 100 }).default("admin"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Secondary Sales Items Table
export const secondarySalesItems = pgTable("secondary_sales_items", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  header_id: integer("header_id").notNull().references(() => secondarySalesHeader.id, { onDelete: "cascade" }),
  line_number: integer("line_number").notNull(),
  product_sku: varchar("product_sku", { length: 100 }),
  product_name: text("product_name"),
  product_asin: varchar("product_asin", { length: 50 }), // Amazon specific
  category: varchar("category", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  quantity_sold: integer("quantity_sold"),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }),
  total_sales: decimal("total_sales", { precision: 12, scale: 2 }),
  commission_rate: decimal("commission_rate", { precision: 5, scale: 2 }),
  commission_amount: decimal("commission_amount", { precision: 10, scale: 2 }),
  shipping_fee: decimal("shipping_fee", { precision: 10, scale: 2 }),
  promotion_discount: decimal("promotion_discount", { precision: 10, scale: 2 }),
  net_amount: decimal("net_amount", { precision: 12, scale: 2 }),
  transaction_date: timestamp("transaction_date"),
  order_id: varchar("order_id", { length: 100 }),
  customer_location: varchar("customer_location", { length: 100 }),
  fulfillment_method: varchar("fulfillment_method", { length: 50 }), // FBA, FBM, etc.
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Secondary Sales Relations
export const secondarySalesHeaderRelations = relations(secondarySalesHeader, ({ many }) => ({
  salesItems: many(secondarySalesItems),
}));

export const secondarySalesItemsRelations = relations(secondarySalesItems, ({ one }) => ({
  header: one(secondarySalesHeader, {
    fields: [secondarySalesItems.header_id],
    references: [secondarySalesHeader.id],
  }),
}));

// Insert schemas for Secondary Sales tables
export const insertSecondarySalesHeaderSchema = createInsertSchema(secondarySalesHeader).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertSecondarySalesItemsSchema = createInsertSchema(secondarySalesItems).omit({
  id: true,
  header_id: true,
  created_at: true,
  updated_at: true
});

export type SecondarySalesHeader = typeof secondarySalesHeader.$inferSelect;
export type InsertSecondarySalesHeader = z.infer<typeof insertSecondarySalesHeaderSchema>;
export type SecondarySalesItems = typeof secondarySalesItems.$inferSelect;
export type InsertSecondarySalesItems = z.infer<typeof insertSecondarySalesItemsSchema>;

// Secondary Sales Specific Tables for Business Units and Period Types
// SC_AM_JW_Daily - Amazon Jivo Wellness Daily
export const scAmJwDaily = pgTable("SC_AM_JW_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  asin: varchar("asin", { length: 50 }).notNull(),
  product_title: text("product_title").notNull(),
  brand: varchar("brand", { length: 100 }),
  ordered_revenue: decimal("ordered_revenue", { precision: 15, scale: 2 }),
  ordered_units: integer("ordered_units"),
  shipped_revenue: decimal("shipped_revenue", { precision: 15, scale: 2 }),
  shipped_cogs: decimal("shipped_cogs", { precision: 15, scale: 2 }),
  shipped_units: integer("shipped_units"),
  customer_returns: integer("customer_returns"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// SC_AM_JW_Range - Amazon Jivo Wellness Date Range
export const scAmJwRange = pgTable("SC_AM_JW_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  asin: varchar("asin", { length: 50 }).notNull(),
  product_title: text("product_title").notNull(),
  brand: varchar("brand", { length: 100 }),
  ordered_revenue: decimal("ordered_revenue", { precision: 15, scale: 2 }),
  ordered_units: integer("ordered_units"),
  shipped_revenue: decimal("shipped_revenue", { precision: 15, scale: 2 }),
  shipped_cogs: decimal("shipped_cogs", { precision: 15, scale: 2 }),
  shipped_units: integer("shipped_units"),
  customer_returns: integer("customer_returns"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// SC_AM_JM_Daily - Amazon Jivo Mart Daily
export const scAmJmDaily = pgTable("SC_AM_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  asin: varchar("asin", { length: 50 }).notNull(),
  product_title: text("product_title").notNull(),
  brand: varchar("brand", { length: 100 }),
  ordered_revenue: decimal("ordered_revenue", { precision: 15, scale: 2 }),
  ordered_units: integer("ordered_units"),
  shipped_revenue: decimal("shipped_revenue", { precision: 15, scale: 2 }),
  shipped_cogs: decimal("shipped_cogs", { precision: 15, scale: 2 }),
  shipped_units: integer("shipped_units"),
  customer_returns: integer("customer_returns"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// SC_AM_JM_Range - Amazon Jivo Mart Date Range
export const scAmJmRange = pgTable("SC_AM_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  asin: varchar("asin", { length: 50 }).notNull(),
  product_title: text("product_title").notNull(),
  brand: varchar("brand", { length: 100 }),
  ordered_revenue: decimal("ordered_revenue", { precision: 15, scale: 2 }),
  ordered_units: integer("ordered_units"),
  shipped_revenue: decimal("shipped_revenue", { precision: 15, scale: 2 }),
  shipped_cogs: decimal("shipped_cogs", { precision: 15, scale: 2 }),
  shipped_units: integer("shipped_units"),
  customer_returns: integer("customer_returns"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Insert schemas for the new tables
export const insertScAmJwDailySchema = createInsertSchema(scAmJwDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertScAmJwRangeSchema = createInsertSchema(scAmJwRange).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertScAmJmDailySchema = createInsertSchema(scAmJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertScAmJmRangeSchema = createInsertSchema(scAmJmRange).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types for the new tables
export type ScAmJwDaily = typeof scAmJwDaily.$inferSelect;
export type InsertScAmJwDaily = z.infer<typeof insertScAmJwDailySchema>;
export type ScAmJwRange = typeof scAmJwRange.$inferSelect;
export type InsertScAmJwRange = z.infer<typeof insertScAmJwRangeSchema>;
export type ScAmJmDaily = typeof scAmJmDaily.$inferSelect;
export type InsertScAmJmDaily = z.infer<typeof insertScAmJmDailySchema>;
export type ScAmJmRange = typeof scAmJmRange.$inferSelect;
export type InsertScAmJmRange = z.infer<typeof insertScAmJmRangeSchema>;

// Zepto Secondary Sales Tables - Jivo Mart
export const scZeptoJmDaily = pgTable("SC_Zepto_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  date: timestamp("date").notNull(),
  sku_number: text("sku_number"),
  sku_name: text("sku_name"),
  ean: text("ean"),
  sku_category: text("sku_category"),
  sku_sub_category: text("sku_sub_category"),
  brand_name: text("brand_name"),
  manufacturer_name: text("manufacturer_name"),
  manufacturer_id: text("manufacturer_id"),
  city: text("city"),
  sales_qty_units: integer("sales_qty_units"),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  gmv: decimal("gmv", { precision: 10, scale: 2 }),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const scZeptoJmRange = pgTable("SC_Zepto_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  date: timestamp("date").notNull(),
  sku_number: text("sku_number"),
  sku_name: text("sku_name"),
  ean: text("ean"),
  sku_category: text("sku_category"),
  sku_sub_category: text("sku_sub_category"),
  brand_name: text("brand_name"),
  manufacturer_name: text("manufacturer_name"),
  manufacturer_id: text("manufacturer_id"),
  city: text("city"),
  sales_qty_units: integer("sales_qty_units"),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  gmv: decimal("gmv", { precision: 10, scale: 2 }),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Blinkit Secondary Sales Tables - Jivo Mart
export const scBlinkitJmDaily = pgTable("SC_Blinkit_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  item_id: text("item_id"),
  item_name: text("item_name"),
  manufacturer_id: text("manufacturer_id"),
  manufacturer_name: text("manufacturer_name"),
  city_id: text("city_id"),
  city_name: text("city_name"),
  category: text("category"),
  date: timestamp("date").notNull(),
  qty_sold: decimal("qty_sold", { precision: 10, scale: 2 }),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const scBlinkitJmRange = pgTable("SC_Blinkit_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  item_id: text("item_id"),
  item_name: text("item_name"),
  manufacturer_id: text("manufacturer_id"),
  manufacturer_name: text("manufacturer_name"),
  city_id: text("city_id"),
  city_name: text("city_name"),
  category: text("category"),
  date: timestamp("date").notNull(),
  qty_sold: decimal("qty_sold", { precision: 10, scale: 2 }),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Swiggy Secondary Sales Tables - Jivo Mart
export const scSwiggyJmDaily = pgTable("SC_Swiggy_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  brand: text("brand"),
  ordered_date: timestamp("ordered_date").notNull(),
  city: text("city"),
  area_name: text("area_name"),
  store_id: text("store_id"),
  l1_category: text("l1_category"),
  l2_category: text("l2_category"),
  l3_category: text("l3_category"),
  product_name: text("product_name"),
  variant: text("variant"),
  item_code: text("item_code"),
  combo: text("combo"),
  combo_item_code: text("combo_item_code"),
  combo_units_sold: decimal("combo_units_sold", { precision: 10, scale: 2 }),
  base_mrp: decimal("base_mrp", { precision: 10, scale: 2 }),
  units_sold: decimal("units_sold", { precision: 10, scale: 2 }),
  gmv: decimal("gmv", { precision: 10, scale: 2 }),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const scSwiggyJmRange = pgTable("SC_Swiggy_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  brand: text("brand"),
  ordered_date: timestamp("ordered_date").notNull(),
  city: text("city"),
  area_name: text("area_name"),
  store_id: text("store_id"),
  l1_category: text("l1_category"),
  l2_category: text("l2_category"),
  l3_category: text("l3_category"),
  product_name: text("product_name"),
  variant: text("variant"),
  item_code: text("item_code"),
  combo: text("combo"),
  combo_item_code: text("combo_item_code"),
  combo_units_sold: decimal("combo_units_sold", { precision: 10, scale: 2 }),
  base_mrp: decimal("base_mrp", { precision: 10, scale: 2 }),
  units_sold: decimal("units_sold", { precision: 10, scale: 2 }),
  gmv: decimal("gmv", { precision: 10, scale: 2 }),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Insert schemas for new secondary sales tables
export const insertZeptoSecondarySalesItemSchema = createInsertSchema(scZeptoJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertBlinkitSecondarySalesItemSchema = createInsertSchema(scBlinkitJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertSwiggySecondarySalesItemSchema = createInsertSchema(scSwiggyJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types for new secondary sales tables
export type ZeptoSecondarySalesItem = typeof scZeptoJmDaily.$inferSelect;
export type InsertZeptoSecondarySalesItem = z.infer<typeof insertZeptoSecondarySalesItemSchema>;

export type BlinkitSecondarySalesItem = typeof scBlinkitJmDaily.$inferSelect;
export type InsertBlinkitSecondarySalesItem = z.infer<typeof insertBlinkitSecondarySalesItemSchema>;

export type SwiggySecondarySalesItem = typeof scSwiggyJmDaily.$inferSelect;
export type InsertSwiggySecondarySalesItem = z.infer<typeof insertSwiggySecondarySalesItemSchema>;

// Flipkart Grocery secondary sales tables (2-month range only)
export const scFlipkartJm2Month = pgTable("SC_FlipKart_JM_2Month", {
  id: serial("id").primaryKey(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  business_unit: text("business_unit").notNull(),
  tenant_id: text("tenant_id"),
  retailer_id: text("retailer_id"),
  retailer_name: text("retailer_name"),
  fsn: text("fsn"),
  category: text("category"),
  vertical: text("vertical"),
  brand: text("brand"),
  product_title: text("product_title"),
  ean: text("ean"),
  style_code: text("style_code"),
  isbn: text("isbn"),
  publisher: text("publisher"),
  hsn: text("hsn"),
  model_id: text("model_id"),
  last_calculated_at: text("last_calculated_at"),
  sale_date: timestamp("sale_date"),
  sale_quantity: integer("sale_quantity"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const scFlipkartChirag2Month = pgTable("SC_FlipKart_CHIRAG_2Month", {
  id: serial("id").primaryKey(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  business_unit: text("business_unit").notNull(),
  tenant_id: text("tenant_id"),
  retailer_id: text("retailer_id"),
  retailer_name: text("retailer_name"),
  fsn: text("fsn"),
  category: text("category"),
  vertical: text("vertical"),
  brand: text("brand"),
  product_title: text("product_title"),
  ean: text("ean"),
  style_code: text("style_code"),
  isbn: text("isbn"),
  publisher: text("publisher"),
  hsn: text("hsn"),
  model_id: text("model_id"),
  last_calculated_at: text("last_calculated_at"),
  sale_date: timestamp("sale_date"),
  sale_quantity: integer("sale_quantity"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Insert schemas for Flipkart Grocery
export const insertFlipkartSecondarySalesItemSchema = createInsertSchema(scFlipkartJm2Month).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types for Flipkart Grocery
export type FlipkartSecondarySalesItem = typeof scFlipkartJm2Month.$inferSelect;
export type InsertFlipkartSecondarySalesItem = z.infer<typeof insertFlipkartSecondarySalesItemSchema>;

// Jio Mart Sale Secondary Sales Tables - Jivo Mart
export const scJioMartSaleJmDaily = pgTable("SC_JioMartSale_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  shipment_number: text("shipment_number"),
  fulfillment_type: text("fulfillment_type"),
  shipment_created_at: timestamp("shipment_created_at"),
  shipment_status: text("shipment_status"),
  fulfiller_name: text("fulfiller_name"),
  accepted_at: timestamp("accepted_at"),
  product_title: text("product_title"),
  ean: text("ean"),
  sku: text("sku"),
  qty: integer("qty"),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  promotion_amt: decimal("promotion_amt", { precision: 10, scale: 2 }),
  shipping_charge: decimal("shipping_charge", { precision: 10, scale: 2 }),
  item_total: decimal("item_total", { precision: 10, scale: 2 }),
  payment_method_used: text("payment_method_used"),
  tracking_code: text("tracking_code"),
  shipping_agent_code: text("shipping_agent_code"),
  invoice_id: text("invoice_id"),
  acceptance_tat_date_time: timestamp("acceptance_tat_date_time"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const scJioMartSaleJmRange = pgTable("SC_JioMartSale_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  shipment_number: text("shipment_number"),
  fulfillment_type: text("fulfillment_type"),
  shipment_created_at: timestamp("shipment_created_at"),
  shipment_status: text("shipment_status"),
  fulfiller_name: text("fulfiller_name"),
  accepted_at: timestamp("accepted_at"),
  product_title: text("product_title"),
  ean: text("ean"),
  sku: text("sku"),
  qty: integer("qty"),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  promotion_amt: decimal("promotion_amt", { precision: 10, scale: 2 }),
  shipping_charge: decimal("shipping_charge", { precision: 10, scale: 2 }),
  item_total: decimal("item_total", { precision: 10, scale: 2 }),
  payment_method_used: text("payment_method_used"),
  tracking_code: text("tracking_code"),
  shipping_agent_code: text("shipping_agent_code"),
  invoice_id: text("invoice_id"),
  acceptance_tat_date_time: timestamp("acceptance_tat_date_time"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Insert schemas for Jio Mart Sale
export const insertJioMartSaleSecondarySalesItemSchema = createInsertSchema(scJioMartSaleJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types for Jio Mart Sale
export type JioMartSaleSecondarySalesItem = typeof scJioMartSaleJmDaily.$inferSelect;
export type InsertJioMartSaleSecondarySalesItem = z.infer<typeof insertJioMartSaleSecondarySalesItemSchema>;

// Jio Mart Cancel Secondary Sales Tables
export const scJioMartCancelJmDaily = pgTable("SC_JioMartCancel_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  shipment_number: text("shipment_number"),
  ean: text("ean"),
  sku: text("sku"),
  product: text("product"),
  invoice_id: text("invoice_id"),
  invoice_amount: decimal("invoice_amount", { precision: 10, scale: 2 }),
  quantity: integer("quantity"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  status: text("status"),
  reason: text("reason"),
  payment_method: text("payment_method"),
  fulfiller_name: text("fulfiller_name"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const scJioMartCancelJmRange = pgTable("SC_JioMartCancel_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  shipment_number: text("shipment_number"),
  ean: text("ean"),
  sku: text("sku"),
  product: text("product"),
  invoice_id: text("invoice_id"),
  invoice_amount: decimal("invoice_amount", { precision: 10, scale: 2 }),
  quantity: integer("quantity"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  status: text("status"),
  reason: text("reason"),
  payment_method: text("payment_method"),
  fulfiller_name: text("fulfiller_name"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Insert schemas for Jio Mart Cancel
export const insertJioMartCancelSecondarySalesItemSchema = createInsertSchema(scJioMartCancelJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types for Jio Mart Cancel
export type JioMartCancelSecondarySalesItem = typeof scJioMartCancelJmDaily.$inferSelect;
export type InsertJioMartCancelSecondarySalesItem = z.infer<typeof insertJioMartCancelSecondarySalesItemSchema>;

// BigBasket Secondary Sales Tables
export const scBigBasketJmDaily = pgTable("SC_BigBasket_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  date_range: text("date_range"),
  source_city_name: text("source_city_name"),
  brand_name: text("brand_name"),
  top_slug: text("top_slug"),
  mid_slug: text("mid_slug"),
  leaf_slug: text("leaf_slug"),
  source_sku_id: text("source_sku_id"),
  sku_description: text("sku_description"),
  sku_weight: text("sku_weight"),
  total_quantity: decimal("total_quantity", { precision: 10, scale: 2 }),
  total_mrp: decimal("total_mrp", { precision: 10, scale: 2 }),
  total_sales: decimal("total_sales", { precision: 10, scale: 2 }),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const scBigBasketJmRange = pgTable("SC_BigBasket_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  date_range: text("date_range"),
  source_city_name: text("source_city_name"),
  brand_name: text("brand_name"),
  top_slug: text("top_slug"),
  mid_slug: text("mid_slug"),
  leaf_slug: text("leaf_slug"),
  source_sku_id: text("source_sku_id"),
  sku_description: text("sku_description"),
  sku_weight: text("sku_weight"),
  total_quantity: decimal("total_quantity", { precision: 10, scale: 2 }),
  total_mrp: decimal("total_mrp", { precision: 10, scale: 2 }),
  total_sales: decimal("total_sales", { precision: 10, scale: 2 }),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Insert schemas for BigBasket
export const insertBigBasketSecondarySalesItemSchema = createInsertSchema(scBigBasketJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types for BigBasket
export type BigBasketSecondarySalesItem = typeof scBigBasketJmDaily.$inferSelect;
export type InsertBigBasketSecondarySalesItem = z.infer<typeof insertBigBasketSecondarySalesItemSchema>;



// Jio Mart Inventory Tables
export const invJioMartJmDaily = pgTable("INV_JioMart_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  rfc_id: text("rfc_id"),
  rfc_name: text("rfc_name"),
  sku_id: text("sku_id").notNull(),
  title: text("title"),
  category: text("category"),
  product_status: text("product_status"),
  last_updated_at: timestamp("last_updated_at"),
  total_sellable_inv: integer("total_sellable_inv"),
  total_unsellable_inv: integer("total_unsellable_inv"),
  fc_dmg_inv: integer("fc_dmg_inv"),
  lsp_dmg_inv: integer("lsp_dmg_inv"),
  cust_dmg_inv: integer("cust_dmg_inv"),
  recvd_dmg: integer("recvd_dmg"),
  expired_inv: integer("expired_inv"),
  other_unsellable_inv: integer("other_unsellable_inv"),
  mtd_fwd_intransit: integer("mtd_fwd_intransit"),
  mtd_delvd_cust: integer("mtd_delvd_cust"),
  mtd_ret_intransit: integer("mtd_ret_intransit"),
  mtd_order_count: integer("mtd_order_count"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const invJioMartJmRange = pgTable("INV_JioMart_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  rfc_id: text("rfc_id"),
  rfc_name: text("rfc_name"),
  sku_id: text("sku_id").notNull(),
  title: text("title"),
  category: text("category"),
  product_status: text("product_status"),
  last_updated_at: timestamp("last_updated_at"),
  total_sellable_inv: integer("total_sellable_inv"),
  total_unsellable_inv: integer("total_unsellable_inv"),
  fc_dmg_inv: integer("fc_dmg_inv"),
  lsp_dmg_inv: integer("lsp_dmg_inv"),
  cust_dmg_inv: integer("cust_dmg_inv"),
  recvd_dmg: integer("recvd_dmg"),
  expired_inv: integer("expired_inv"),
  other_unsellable_inv: integer("other_unsellable_inv"),
  mtd_fwd_intransit: integer("mtd_fwd_intransit"),
  mtd_delvd_cust: integer("mtd_delvd_cust"),
  mtd_ret_intransit: integer("mtd_ret_intransit"),
  mtd_order_count: integer("mtd_order_count"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Insert schemas for Jio Mart Inventory
export const insertJioMartInventoryItemSchema = createInsertSchema(invJioMartJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types for Jio Mart Inventory
export type JioMartInventoryItem = typeof invJioMartJmDaily.$inferSelect;
export type InsertJioMartInventoryItem = z.infer<typeof insertJioMartInventoryItemSchema>;

// Blinkit Inventory Tables
export const invBlinkitJmDaily = pgTable("INV_Blinkit_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  sku_id: text("sku_id").notNull(),
  product_name: text("product_name"),
  category: text("category"),
  subcategory: text("subcategory"),
  brand: text("brand"),
  size: text("size"),
  unit: text("unit"),
  stock_on_hand: integer("stock_on_hand"),
  reserved_quantity: integer("reserved_quantity"),
  available_quantity: integer("available_quantity"),
  inbound_quantity: integer("inbound_quantity"),
  outbound_quantity: integer("outbound_quantity"),
  damaged_quantity: integer("damaged_quantity"),
  expired_quantity: integer("expired_quantity"),
  last_updated_at: timestamp("last_updated_at"),
  warehouse_location: text("warehouse_location"),
  supplier_name: text("supplier_name"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const invBlinkitJmRange = pgTable("INV_Blinkit_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  sku_id: text("sku_id").notNull(),
  product_name: text("product_name"),
  category: text("category"),
  subcategory: text("subcategory"),
  brand: text("brand"),
  size: text("size"),
  unit: text("unit"),
  stock_on_hand: integer("stock_on_hand"),
  reserved_quantity: integer("reserved_quantity"),
  available_quantity: integer("available_quantity"),
  inbound_quantity: integer("inbound_quantity"),
  outbound_quantity: integer("outbound_quantity"),
  damaged_quantity: integer("damaged_quantity"),
  expired_quantity: integer("expired_quantity"),
  last_updated_at: timestamp("last_updated_at"),
  warehouse_location: text("warehouse_location"),
  supplier_name: text("supplier_name"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// FlipKart Inventory Tables
export const invFlipkartJmDaily = pgTable("INV_FlipKart_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  warehouseId: varchar("warehouseId", { length: 100 }),
  sku: varchar("sku", { length: 200 }),
  title: text("title"),
  listingId: varchar("listingId", { length: 100 }),
  fsn: varchar("fsn", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  flipkartSellingPrice: decimal("flipkartSellingPrice", { precision: 10, scale: 2 }),
  liveOnWebsite: integer("liveOnWebsite"),
  sales7D: integer("sales7D"),
  sales14D: integer("sales14D"),
  sales30D: integer("sales30D"),
  sales60D: integer("sales60D"),
  sales90D: integer("sales90D"),
  b2bScheduled: integer("b2bScheduled"),
  transfersScheduled: integer("transfersScheduled"),
  b2bShipped: integer("b2bShipped"),
  transfersShipped: integer("transfersShipped"),
  b2bReceiving: integer("b2bReceiving"),
  transfersReceiving: integer("transfersReceiving"),
  reservedForOrdersAndRecalls: integer("reservedForOrdersAndRecalls"),
  reservedForInternalProcessing: integer("reservedForInternalProcessing"),
  returnsProcessing: integer("returnsProcessing"),
  ordersToDispatch: integer("ordersToDispatch"),
  recallsToDispatch: integer("recallsToDispatch"),
  damaged: integer("damaged"),
  qcReject: integer("qcReject"),
  catalogReject: integer("catalogReject"),
  returnsReject: integer("returnsReject"),
  sellerReturnReject: integer("sellerReturnReject"),
  miscellaneous: integer("miscellaneous"),
  lengthCm: decimal("lengthCm", { precision: 8, scale: 6 }),
  breadthCm: decimal("breadthCm", { precision: 8, scale: 6 }),
  heightCm: decimal("heightCm", { precision: 8, scale: 6 }),
  weightKg: decimal("weightKg", { precision: 8, scale: 3 }),
  fulfilmentType: text("fulfilmentType"),
  fAssuredBadge: varchar("fAssuredBadge", { length: 10 }),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const invFlipkartJmRange = pgTable("INV_FlipKart_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  warehouseId: varchar("warehouseId", { length: 100 }),
  sku: varchar("sku", { length: 200 }),
  title: text("title"),
  listingId: varchar("listingId", { length: 100 }),
  fsn: varchar("fsn", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  flipkartSellingPrice: decimal("flipkartSellingPrice", { precision: 10, scale: 2 }),
  liveOnWebsite: integer("liveOnWebsite"),
  sales7D: integer("sales7D"),
  sales14D: integer("sales14D"),
  sales30D: integer("sales30D"),
  sales60D: integer("sales60D"),
  sales90D: integer("sales90D"),
  b2bScheduled: integer("b2bScheduled"),
  transfersScheduled: integer("transfersScheduled"),
  b2bShipped: integer("b2bShipped"),
  transfersShipped: integer("transfersShipped"),
  b2bReceiving: integer("b2bReceiving"),
  transfersReceiving: integer("transfersReceiving"),
  reservedForOrdersAndRecalls: integer("reservedForOrdersAndRecalls"),
  reservedForInternalProcessing: integer("reservedForInternalProcessing"),
  returnsProcessing: integer("returnsProcessing"),
  ordersToDispatch: integer("ordersToDispatch"),
  recallsToDispatch: integer("recallsToDispatch"),
  damaged: integer("damaged"),
  qcReject: integer("qcReject"),
  catalogReject: integer("catalogReject"),
  returnsReject: integer("returnsReject"),
  sellerReturnReject: integer("sellerReturnReject"),
  miscellaneous: integer("miscellaneous"),
  lengthCm: decimal("lengthCm", { precision: 8, scale: 6 }),
  breadthCm: decimal("breadthCm", { precision: 8, scale: 6 }),
  heightCm: decimal("heightCm", { precision: 8, scale: 6 }),
  weightKg: decimal("weightKg", { precision: 8, scale: 3 }),
  fulfilmentType: text("fulfilmentType"),
  fAssuredBadge: varchar("fAssuredBadge", { length: 10 }),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Amazon Inventory Tables - JM (Jivo Mart)
export const invAmazonJmDaily = pgTable("INV_Amazon_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  asin: text("asin").notNull(),
  product_name: text("product_name"),
  sku: text("sku"),
  fnsku: text("fnsku"),
  category: text("category"),
  brand: text("brand"),
  size: text("size"),
  unit: text("unit"),
  warehouse_location: text("warehouse_location"),
  condition: text("condition"),
  fulfillment_channel: text("fulfillment_channel"),
  units_available: integer("units_available"),
  reserved_quantity: integer("reserved_quantity"),
  inbound_quantity: integer("inbound_quantity"),
  researching_quantity: integer("researching_quantity"),
  unfulfillable_quantity: integer("unfulfillable_quantity"),
  supplier_name: text("supplier_name"),
  cost_per_unit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  total_value: decimal("total_value", { precision: 10, scale: 2 }),
  last_updated_at: timestamp("last_updated_at"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const invAmazonJmRange = pgTable("INV_Amazon_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  asin: text("asin").notNull(),
  product_name: text("product_name"),
  sku: text("sku"),
  fnsku: text("fnsku"),
  category: text("category"),
  brand: text("brand"),
  size: text("size"),
  unit: text("unit"),
  warehouse_location: text("warehouse_location"),
  condition: text("condition"),
  fulfillment_channel: text("fulfillment_channel"),
  units_available: integer("units_available"),
  reserved_quantity: integer("reserved_quantity"),
  inbound_quantity: integer("inbound_quantity"),
  researching_quantity: integer("researching_quantity"),
  unfulfillable_quantity: integer("unfulfillable_quantity"),
  supplier_name: text("supplier_name"),
  cost_per_unit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  total_value: decimal("total_value", { precision: 10, scale: 2 }),
  last_updated_at: timestamp("last_updated_at"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Amazon Inventory Tables - JW (Jivo Wellness)
export const invAmazonJwDaily = pgTable("INV_Amazon_JW_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  asin: text("asin").notNull(),
  product_name: text("product_name"),
  sku: text("sku"),
  fnsku: text("fnsku"),
  category: text("category"),
  brand: text("brand"),
  size: text("size"),
  unit: text("unit"),
  warehouse_location: text("warehouse_location"),
  condition: text("condition"),
  fulfillment_channel: text("fulfillment_channel"),
  units_available: integer("units_available"),
  reserved_quantity: integer("reserved_quantity"),
  inbound_quantity: integer("inbound_quantity"),
  researching_quantity: integer("researching_quantity"),
  unfulfillable_quantity: integer("unfulfillable_quantity"),
  supplier_name: text("supplier_name"),
  cost_per_unit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  total_value: decimal("total_value", { precision: 10, scale: 2 }),
  last_updated_at: timestamp("last_updated_at"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const invAmazonJwRange = pgTable("INV_Amazon_JW_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  asin: text("asin").notNull(),
  product_name: text("product_name"),
  sku: text("sku"),
  fnsku: text("fnsku"),
  category: text("category"),
  brand: text("brand"),
  size: text("size"),
  unit: text("unit"),
  warehouse_location: text("warehouse_location"),
  condition: text("condition"),
  fulfillment_channel: text("fulfillment_channel"),
  units_available: integer("units_available"),
  reserved_quantity: integer("reserved_quantity"),
  inbound_quantity: integer("inbound_quantity"),
  researching_quantity: integer("researching_quantity"),
  unfulfillable_quantity: integer("unfulfillable_quantity"),
  supplier_name: text("supplier_name"),
  cost_per_unit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  total_value: decimal("total_value", { precision: 10, scale: 2 }),
  last_updated_at: timestamp("last_updated_at"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Insert schemas for Blinkit Inventory
export const insertBlinkitInventoryItemSchema = createInsertSchema(invBlinkitJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Insert schemas for Amazon Inventory
export const insertAmazonInventoryItemSchema = createInsertSchema(invAmazonJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types for Blinkit Inventory
export type BlinkitInventoryItem = typeof invBlinkitJmDaily.$inferSelect;
export type InsertBlinkitInventoryItem = z.infer<typeof insertBlinkitInventoryItemSchema>;

// Types for Amazon Inventory
export type AmazonInventoryItem = typeof invAmazonJmDaily.$inferSelect;
export type InsertAmazonInventoryItem = z.infer<typeof insertAmazonInventoryItemSchema>;

// Inventory Swiggy JM Daily
export const invSwiggyJmDaily = pgTable("INV_Swiggy_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  storage_type: text("storage_type"),
  facility_name: text("facility_name"),
  city: text("city"),
  sku_code: text("sku_code"),
  sku_description: text("sku_description"),
  l1_category: text("l1_category"),
  l2_category: text("l2_category"),
  shelf_life_days: integer("shelf_life_days"),
  business_category: text("business_category"),
  days_on_hand: integer("days_on_hand"),
  potential_gmv_loss: decimal("potential_gmv_loss", { precision: 10, scale: 2 }),
  open_pos: text("open_pos"),
  open_po_quantity: integer("open_po_quantity"),
  warehouse_qty_available: integer("warehouse_qty_available"),
  last_updated_at: timestamp("last_updated_at"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Inventory Swiggy JM Range
export const invSwiggyJmRange = pgTable("INV_Swiggy_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  storage_type: text("storage_type"),
  facility_name: text("facility_name"),
  city: text("city"),
  sku_code: text("sku_code"),
  sku_description: text("sku_description"),
  l1_category: text("l1_category"),
  l2_category: text("l2_category"),
  shelf_life_days: integer("shelf_life_days"),
  business_category: text("business_category"),
  days_on_hand: integer("days_on_hand"),
  potential_gmv_loss: decimal("potential_gmv_loss", { precision: 10, scale: 2 }),
  open_pos: text("open_pos"),
  open_po_quantity: integer("open_po_quantity"),
  warehouse_qty_available: integer("warehouse_qty_available"),
  last_updated_at: timestamp("last_updated_at"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Insert schemas for Swiggy Inventory
export const insertSwiggyInventoryItemSchema = createInsertSchema(invSwiggyJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types for Swiggy Inventory
export type SwiggyInventoryItem = typeof invSwiggyJmDaily.$inferSelect;
export type InsertSwiggyInventoryItem = z.infer<typeof insertSwiggyInventoryItemSchema>;

// Insert schemas for FlipKart Inventory
export const insertFlipkartInventoryDailySchema = createInsertSchema(invFlipkartJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertFlipkartInventoryRangeSchema = createInsertSchema(invFlipkartJmRange).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types for FlipKart Inventory
export type FlipkartInventoryDaily = typeof invFlipkartJmDaily.$inferSelect;
export type InsertFlipkartInventoryDaily = z.infer<typeof insertFlipkartInventoryDailySchema>;
export type FlipkartInventoryRange = typeof invFlipkartJmRange.$inferSelect;
export type InsertFlipkartInventoryRange = z.infer<typeof insertFlipkartInventoryRangeSchema>;

// Zepto Inventory Tables
export const invZeptoJmDaily = pgTable("INV_Zepto_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  city: varchar("city", { length: 100 }),
  sku_name: text("sku_name"),
  sku_code: varchar("sku_code", { length: 200 }),
  ean: varchar("ean", { length: 50 }),
  sku_category: varchar("sku_category", { length: 100 }),
  sku_sub_category: varchar("sku_sub_category", { length: 100 }),
  brand_name: varchar("brand_name", { length: 100 }),
  manufacturer_name: varchar("manufacturer_name", { length: 200 }),
  manufacturer_id: varchar("manufacturer_id", { length: 100 }),
  units: integer("units"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const invZeptoJmRange = pgTable("INV_Zepto_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  city: varchar("city", { length: 100 }),
  sku_name: text("sku_name"),
  sku_code: varchar("sku_code", { length: 200 }),
  ean: varchar("ean", { length: 50 }),
  sku_category: varchar("sku_category", { length: 100 }),
  sku_sub_category: varchar("sku_sub_category", { length: 100 }),
  brand_name: varchar("brand_name", { length: 100 }),
  manufacturer_name: varchar("manufacturer_name", { length: 200 }),
  manufacturer_id: varchar("manufacturer_id", { length: 100 }),
  units: integer("units"),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Zepto Inventory Insert Schemas
export const insertZeptoInventoryDailySchema = createInsertSchema(invZeptoJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertZeptoInventoryRangeSchema = createInsertSchema(invZeptoJmRange).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types for Zepto Inventory
export type ZeptoInventoryDaily = typeof invZeptoJmDaily.$inferSelect;
export type InsertZeptoInventoryDaily = z.infer<typeof insertZeptoInventoryDailySchema>;
export type ZeptoInventoryRange = typeof invZeptoJmRange.$inferSelect;
export type InsertZeptoInventoryRange = z.infer<typeof insertZeptoInventoryRangeSchema>;

// BigBasket Inventory Tables
export const invBigBasketJmDaily = pgTable("INV_BigBasket_JM_Daily", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  report_date: timestamp("report_date").notNull(),
  city: text("city"),
  sku_id: text("sku_id"),
  brand_name: text("brand_name"),
  sku_name: text("sku_name"),
  sku_weight: text("sku_weight"),
  sku_pack_type: text("sku_pack_type"),
  sku_description: text("sku_description"),
  top_category_name: text("top_category_name"),
  mid_category_name: text("mid_category_name"),
  leaf_category_name: text("leaf_category_name"),
  soh: decimal("soh", { precision: 10, scale: 2 }),
  soh_value: decimal("soh_value", { precision: 10, scale: 2 }),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const invBigBasketJmRange = pgTable("INV_BigBasket_JM_Range", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  city: text("city"),
  sku_id: text("sku_id"),
  brand_name: text("brand_name"),
  sku_name: text("sku_name"),
  sku_weight: text("sku_weight"),
  sku_pack_type: text("sku_pack_type"),
  sku_description: text("sku_description"),
  top_category_name: text("top_category_name"),
  mid_category_name: text("mid_category_name"),
  leaf_category_name: text("leaf_category_name"),
  soh: decimal("soh", { precision: 10, scale: 2 }),
  soh_value: decimal("soh_value", { precision: 10, scale: 2 }),
  attachment_path: text("attachment_path"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Insert schemas for BigBasket Inventory
export const insertBigBasketInventoryDailySchema = createInsertSchema(invBigBasketJmDaily).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertBigBasketInventoryRangeSchema = createInsertSchema(invBigBasketJmRange).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types for BigBasket Inventory
export type BigBasketInventoryDaily = typeof invBigBasketJmDaily.$inferSelect;
export type InsertBigBasketInventoryDaily = z.infer<typeof insertBigBasketInventoryDailySchema>;
export type BigBasketInventoryRange = typeof invBigBasketJmRange.$inferSelect;
export type InsertBigBasketInventoryRange = z.infer<typeof insertBigBasketInventoryRangeSchema>;


