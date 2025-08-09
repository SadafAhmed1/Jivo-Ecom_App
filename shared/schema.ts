import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, serial } from "drizzle-orm/pg-core";
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

// Item Management Table
export const itemMaster = pgTable("item_master", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  itemCode: varchar("item_code", { length: 50 }).notNull().unique(),
  itemName: text("item_name").notNull(),
  itmsGrpNam: varchar("itms_grp_nam", { length: 100 }),
  uType: varchar("u_type", { length: 50 }),
  variety: varchar("variety", { length: 100 }),
  subGroup: varchar("sub_group", { length: 100 }),
  uBrand: varchar("u_brand", { length: 100 }),
  uom: varchar("uom", { length: 20 }),
  unitSize: decimal("unit_size", { precision: 10, scale: 6 }),
  uIsLitre: varchar("u_is_litre", { length: 1 }),
  uTaxRate: decimal("u_tax_rate", { precision: 5, scale: 2 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Insert schema for item master - make all fields strings for form handling
export const insertItemMasterSchema = createInsertSchema(itemMaster).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
}).extend({
  unitSize: z.string().optional(),
  uTaxRate: z.string().optional()
});

// Types for item master
export type ItemMaster = typeof itemMaster.$inferSelect;
export type InsertItemMaster = z.infer<typeof insertItemMasterSchema>;

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
