import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { callSpGetItemDetails } from "./sqlserver";

import { insertPfPoSchema, insertPfOrderItemsSchema, insertFlipkartGroceryPoHeaderSchema, insertFlipkartGroceryPoLinesSchema, insertDistributorMstSchema, insertDistributorPoSchema, insertDistributorOrderItemsSchema } from "@shared/schema";
import { z } from "zod";
import { seedTestData } from "./seed-data";
import { parseFlipkartGroceryPO, parseZeptoPO, parseCityMallPO, parseBlinkitPO } from "./csv-parser";
import { parseSwiggyPO } from "./swiggy-parser";
import { parseBigBasketPO } from "./bigbasket-parser";
import { parseZomatoPO } from "./zomato-parser";
import { parseDealsharePO } from "./dealshare-parser";
import { parseAmazonSecondarySales } from "./amazon-secondary-sales-parser";
import { parseZeptoSecondaryData } from "./zepto-secondary-sales-parser";
import { parseBlinkitSecondarySalesFile } from "./blinkit-secondary-sales-parser";
import { parseSwiggySecondaryData } from "./swiggy-secondary-sales-parser";
import { parseJioMartSaleSecondarySales } from "./jiomartsale-secondary-sales-parser";
import { parseJioMartCancelSecondarySales } from "./jiomartcancel-secondary-sales-parser";
import { parseBigBasketSecondarySales } from "./bigbasket-secondary-sales-parser";
import { parseFlipkartSecondaryData } from "./flipkart-parser";
import { parseJioMartInventoryCsv } from "./jiomart-inventory-parser";
import { parseBlinkitInventoryCsv } from "./blinkit-inventory-parser";
import { parseAmazonInventoryFile } from "./amazon-inventory-parser";
import { parseFlipkartInventoryCSV } from "./flipkart-inventory-parser";
import { parseZeptoInventory } from "./zepto-inventory-parser";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { 
  scAmJwDaily, scAmJwRange, scAmJmDaily, scAmJmRange,
  scZeptoJmDaily, scZeptoJmRange, 
  scBlinkitJmDaily, scBlinkitJmRange,
  scSwiggyJmDaily, scSwiggyJmRange,
  scJioMartSaleJmDaily, scJioMartSaleJmRange,
  scJioMartCancelJmDaily, scJioMartCancelJmRange,
  scBigBasketJmDaily, scBigBasketJmRange,
  scFlipkartJm2Month, scFlipkartChirag2Month,
  invJioMartJmDaily, invJioMartJmRange,
  invBlinkitJmDaily, invBlinkitJmRange,
  invFlipkartJmDaily, invFlipkartJmRange
} from "@shared/schema";

import multer from 'multer';
import crypto from "crypto";

// Utility function to create dates without timezone conversion issues
function createDateFromYMDString(dateString: string): Date {
  if (!dateString) return new Date();
  // For HTML date inputs that return YYYY-MM-DD, create date in UTC to avoid timezone shifts
  return new Date(dateString + 'T00:00:00.000Z');
}

function createEndDateFromYMDString(dateString: string): Date {
  if (!dateString) return new Date();
  // For end dates, set to end of day in UTC
  return new Date(dateString + 'T23:59:59.999Z');
}

const createPoSchema = z.object({
  po: insertPfPoSchema.extend({
    order_date: z.string().transform(str => new Date(str)),
    expiry_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
    appointment_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
  }),
  items: z.array(insertPfOrderItemsSchema)
});

const updatePoSchema = z.object({
  po: insertPfPoSchema.partial().extend({
    order_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
    expiry_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
    appointment_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
  }),
  items: z.array(insertPfOrderItemsSchema).optional()
});

const createFlipkartGroceryPoSchema = z.object({
  header: insertFlipkartGroceryPoHeaderSchema.extend({
    order_date: z.string().transform(str => new Date(str)),
    po_expiry_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
  }),
  lines: z.array(insertFlipkartGroceryPoLinesSchema.extend({
    required_by_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
  }))
});

const updateFlipkartGroceryPoSchema = z.object({
  header: insertFlipkartGroceryPoHeaderSchema.partial().extend({
    order_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
    po_expiry_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
  }),
  lines: z.array(insertFlipkartGroceryPoLinesSchema.extend({
    required_by_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
  })).optional()
});

// Distributor PO schemas
const createDistributorPoSchema = z.object({
  header: insertDistributorPoSchema.extend({
    order_date: z.string().transform(str => new Date(str)),
    expiry_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
    appointment_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
  }),
  items: z.array(insertDistributorOrderItemsSchema)
});

const updateDistributorPoSchema = z.object({
  header: insertDistributorPoSchema.partial().extend({
    order_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
    expiry_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
    appointment_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
  }),
  items: z.array(insertDistributorOrderItemsSchema).optional()
});

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Import crypto for file hashing
import crypto from 'crypto';

export async function registerRoutes(app: Express): Promise<Server> {
  // Platform routes
  app.get("/api/platforms", async (_req, res) => {
    try {
      const platforms = await storage.getAllPlatforms();
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });

  app.post("/api/platforms", async (req, res) => {
    try {
      const platform = await storage.createPlatform(req.body);
      res.status(201).json(platform);
    } catch (error) {
      res.status(500).json({ message: "Failed to create platform" });
    }
  });

  // SAP Items routes
  app.get("/api/sap-items", async (_req, res) => {
    try {
      const items = await storage.getAllSapItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SAP items" });
    }
  });

  app.post("/api/sap-items", async (req, res) => {
    try {
      const item = await storage.createSapItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create SAP item" });
    }
  });

  // Get all SAP items from API table
  app.get("/api/sap-items-api", async (req, res) => {
    try {
      const items = await storage.getAllSapItemsApi();
      res.json(items);
    } catch (error) {
      console.error("Error fetching SAP items from API:", error);
      res.status(500).json({ error: "Failed to fetch SAP items from API" });
    }
  });

  // Sync SAP items from SQL Server API
  app.post("/api/sap-items-api/sync", async (req, res) => {
    try {
      console.log("Starting SAP items sync from SQL Server...");
      
      // Call the SQL Server stored procedure
      const sqlServerItems = await callSpGetItemDetails();
      console.log(`Retrieved ${sqlServerItems.length} items from SQL Server`);

      // Transform SQL Server data to match our schema
      const transformedItems = sqlServerItems.map((item: any) => ({
        itemcode: item.ItemCode || item.itemcode,
        itemname: item.ItemName || item.itemname,
        type: item.Type || item.type,
        itemgroup: item.ItemGroup || item.itemgroup,
        variety: item.Variety || item.variety,
        subgroup: item.SubGroup || item.subgroup,
        brand: item.Brand || item.brand,
        uom: item.UOM || item.uom,
        taxrate: item.TaxRate || item.taxrate,
        unitsize: item.UnitSize || item.unitsize,
        is_litre: item.IsLitre || item.is_litre || false,
        case_pack: item.CasePack || item.case_pack
      }));

      // Sync to database
      const syncedCount = await storage.syncSapItemsFromApi(transformedItems);
      
      console.log(`Successfully synced ${syncedCount} SAP items`);
      res.json({ 
        success: true, 
        message: `Successfully synced ${syncedCount} SAP items from SQL Server database`,
        count: syncedCount 
      });
    } catch (error) {
      console.error("Error syncing SAP items:", error);
      
      // Check if it's a connection error
      if (error instanceof Error && error.message.includes('Failed to connect')) {
        res.status(503).json({ 
          error: "SQL Server Connection Failed", 
          details: `Unable to connect to SQL Server at 103.89.44.240:1433. Please check if the server is accessible and VPN connection is active.`,
          suggestion: "Contact your IT administrator to verify SQL Server connectivity from this environment."
        });
      } else {
        res.status(500).json({ 
          error: "Failed to sync SAP items", 
          details: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }
  });

  // Platform Items routes
  app.get("/api/platform-items", async (req, res) => {
    try {
      const { platformId, search } = req.query;
      const items = await storage.getPlatformItems(
        platformId ? parseInt(platformId as string) : undefined,
        search as string
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platform items" });
    }
  });

  // Distributors API
  app.get("/api/distributors", async (req, res) => {
    try {
      const distributors = await storage.getAllDistributors();
      res.json(distributors);
    } catch (error) {
      console.error("Error fetching distributors:", error);
      res.status(500).json({ error: "Failed to fetch distributors" });
    }
  });

  app.post("/api/platform-items", async (req, res) => {
    try {
      const item = await storage.createPlatformItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create platform item" });
    }
  });

  // PO routes
  app.get("/api/pos", async (_req, res) => {
    try {
      const pos = await storage.getAllPos();
      res.json(pos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch POs" });
    }
  });

  app.get("/api/pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const po = await storage.getPoById(id);
      if (!po) {
        return res.status(404).json({ message: "PO not found" });
      }
      res.json(po);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PO" });
    }
  });

  app.post("/api/pos", async (req, res) => {
    try {
      const validatedData = createPoSchema.parse(req.body);
      const po = await storage.createPo(validatedData.po, validatedData.items);
      res.status(201).json(po);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create PO" });
    }
  });

  app.put("/api/pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updatePoSchema.parse(req.body);
      const po = await storage.updatePo(id, validatedData.po, validatedData.items);
      res.json(po);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update PO" });
    }
  });

  app.delete("/api/pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePo(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PO" });
    }
  });

  // Order Items routes
  app.get("/api/order-items", async (_req, res) => {
    try {
      const orderItems = await storage.getAllOrderItems();
      res.json(orderItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });

  app.patch("/api/order-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updatedItem = await storage.updateOrderItemStatus(id, status);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating order item status:", error);
      res.status(500).json({ message: "Failed to update order item status" });
    }
  });

  // CSV parsing endpoint
  app.post("/api/parse-flipkart-csv", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const uploadedBy = req.body.uploadedBy || 'system';
      
      const parsedData = parseFlipkartGroceryPO(csvContent, uploadedBy);
      res.json(parsedData);
    } catch (error) {
      console.error('CSV parsing error:', error);
      res.status(500).json({ message: "Failed to parse CSV file" });
    }
  });

  // Flipkart Grocery PO routes
  app.get("/api/flipkart-grocery-pos", async (_req, res) => {
    try {
      const pos = await storage.getAllFlipkartGroceryPos();
      res.json(pos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Flipkart grocery POs" });
    }
  });

  app.get("/api/flipkart-grocery-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const po = await storage.getFlipkartGroceryPoById(id);
      if (!po) {
        return res.status(404).json({ message: "Flipkart grocery PO not found" });
      }
      res.json(po);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Flipkart grocery PO" });
    }
  });

  app.post("/api/flipkart-grocery-pos", async (req, res) => {
    try {
      const validatedData = createFlipkartGroceryPoSchema.parse(req.body);
      const po = await storage.createFlipkartGroceryPo(validatedData.header, validatedData.lines);
      res.status(201).json(po);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create Flipkart grocery PO" });
    }
  });

  app.put("/api/flipkart-grocery-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateFlipkartGroceryPoSchema.parse(req.body);
      const po = await storage.updateFlipkartGroceryPo(id, validatedData.header, validatedData.lines);
      res.json(po);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update Flipkart grocery PO" });
    }
  });

  app.delete("/api/flipkart-grocery-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFlipkartGroceryPo(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete Flipkart grocery PO" });
    }
  });

  app.get("/api/flipkart-grocery-pos/:id/lines", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lines = await storage.getFlipkartGroceryPoLines(id);
      res.json(lines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Flipkart grocery PO lines" });
    }
  });

  // Seed data endpoint (only for development)
  app.post("/api/seed-test-data", async (_req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ message: "Seed endpoint not available in production" });
    }
    
    try {
      const result = await seedTestData();
      if (result.success) {
        res.json({ message: "Test data seeded successfully" });
      } else {
        res.status(500).json({ message: "Failed to seed test data", error: result.error });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to seed test data" });
    }
  });

  // Zepto PO Routes
  app.get("/api/zepto-pos", async (req, res) => {
    try {
      const pos = await storage.getAllZeptoPos();
      res.json(pos);
    } catch (error) {
      console.error("Error fetching Zepto POs:", error);
      res.status(500).json({ error: "Failed to fetch POs" });
    }
  });

  app.get("/api/zepto-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const po = await storage.getZeptoPOById(id);
      
      if (!po) {
        return res.status(404).json({ error: "PO not found" });
      }
      
      res.json(po);
    } catch (error) {
      console.error("Error fetching Zepto PO:", error);
      res.status(500).json({ error: "Failed to fetch PO" });
    }
  });

  app.post("/api/parse-zepto-csv", async (req, res) => {
    try {
      const { csvContent } = req.body;
      
      if (!csvContent) {
        return res.status(400).json({ error: "CSV content is required" });
      }
      
      const parsedData = parseZeptoPO(csvContent, "system");
      res.json(parsedData);
    } catch (error) {
      console.error("Error parsing Zepto CSV:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to parse CSV" });
    }
  });

  app.post("/api/zepto-pos", async (req, res) => {
    try {
      const { header, lines } = req.body;
      
      if (!header || !lines) {
        return res.status(400).json({ error: "Header and lines are required" });
      }
      
      const createdPo = await storage.createZeptoPo(header, lines);
      res.status(201).json(createdPo);
    } catch (error) {
      console.error("Error creating Zepto PO:", error);
      res.status(500).json({ error: "Failed to create PO" });
    }
  });

  app.put("/api/zepto-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { header, lines } = req.body;
      
      const updatedPo = await storage.updateZeptoPo(id, header, lines);
      res.json(updatedPo);
    } catch (error) {
      console.error("Error updating Zepto PO:", error);
      res.status(500).json({ error: "Failed to update PO" });
    }
  });

  app.delete("/api/zepto-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteZeptoPo(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Zepto PO:", error);
      res.status(500).json({ error: "Failed to delete PO" });
    }
  });

  // City Mall CSV parsing endpoint
  app.post("/api/parse-city-mall-csv", upload.single("csvFile"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const csvContent = req.file.buffer.toString("utf-8");
      const parsedData = parseCityMallPO(csvContent, "system");
      res.json(parsedData);
    } catch (error) {
      console.error("Error parsing City Mall CSV:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to parse CSV" });
    }
  });

  app.get("/api/city-mall-pos", async (req, res) => {
    try {
      const cityMallPos = await storage.getAllCityMallPos();
      res.json(cityMallPos);
    } catch (error) {
      console.error("Error fetching City Mall POs:", error);
      res.status(500).json({ error: "Failed to fetch City Mall POs" });
    }
  });

  app.get("/api/city-mall-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const cityMallPo = await storage.getCityMallPoById(id);
      if (!cityMallPo) {
        return res.status(404).json({ error: "City Mall PO not found" });
      }
      
      res.json(cityMallPo);
    } catch (error) {
      console.error("Error fetching City Mall PO:", error);
      res.status(500).json({ error: "Failed to fetch City Mall PO" });
    }
  });

  app.post("/api/city-mall-pos", async (req, res) => {
    try {
      const { header, lines } = req.body;
      
      if (!header || !lines) {
        return res.status(400).json({ error: "Header and lines are required" });
      }
      
      const createdPo = await storage.createCityMallPo(header, lines);
      res.status(201).json(createdPo);
    } catch (error) {
      console.error("Error creating City Mall PO:", error);
      res.status(500).json({ error: "Failed to create PO" });
    }
  });

  app.put("/api/city-mall-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { header, lines } = req.body;
      
      const updatedPo = await storage.updateCityMallPo(id, header, lines);
      res.json(updatedPo);
    } catch (error) {
      console.error("Error updating City Mall PO:", error);
      res.status(500).json({ error: "Failed to update PO" });
    }
  });

  app.delete("/api/city-mall-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCityMallPo(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting City Mall PO:", error);
      res.status(500).json({ error: "Failed to delete PO" });
    }
  });

  // Blinkit PO upload and management endpoints
  app.post("/api/blinkit-po/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = parseBlinkitPO(req.file.buffer, "system");
      // Use the first PO from the list for single upload
      const { header, lines } = result.poList[0];
      const createdPo = await storage.createBlinkitPo(header, lines);
      
      res.status(201).json({
        message: "Blinkit PO uploaded successfully",
        po: createdPo,
        totalItems: lines.length
      });
    } catch (error) {
      console.error("Error uploading Blinkit PO:", error);
      res.status(500).json({ 
        error: "Failed to process file", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/blinkit-pos", async (_req, res) => {
    try {
      const pos = await storage.getAllBlinkitPos();
      res.json(pos);
    } catch (error) {
      console.error("Error fetching Blinkit POs:", error);
      res.status(500).json({ error: "Failed to fetch Blinkit POs" });
    }
  });

  app.get("/api/blinkit-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const blinkitPo = await storage.getBlinkitPoById(id);
      if (!blinkitPo) {
        return res.status(404).json({ error: "Blinkit PO not found" });
      }
      
      res.json(blinkitPo);
    } catch (error) {
      console.error("Error fetching Blinkit PO:", error);
      res.status(500).json({ error: "Failed to fetch Blinkit PO" });
    }
  });

  app.post("/api/blinkit-pos", async (req, res) => {
    try {
      const { header, lines } = req.body;
      
      if (!header || !lines) {
        return res.status(400).json({ error: "Header and lines are required" });
      }
      
      const createdPo = await storage.createBlinkitPo(header, lines);
      res.status(201).json(createdPo);
    } catch (error) {
      console.error("Error creating Blinkit PO:", error);
      res.status(500).json({ error: "Failed to create PO" });
    }
  });

  app.put("/api/blinkit-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { header, lines } = req.body;
      
      const updatedPo = await storage.updateBlinkitPo(id, header, lines);
      res.json(updatedPo);
    } catch (error) {
      console.error("Error updating Blinkit PO:", error);
      res.status(500).json({ error: "Failed to update PO" });
    }
  });

  app.delete("/api/blinkit-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlinkitPo(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Blinkit PO:", error);
      res.status(500).json({ error: "Failed to delete PO" });
    }
  });

  // Swiggy PO routes
  app.get("/api/swiggy-pos", async (req, res) => {
    try {
      const pos = await storage.getAllSwiggyPos();
      res.json(pos);
    } catch (error) {
      console.error("Error fetching Swiggy POs:", error);
      res.status(500).json({ error: "Failed to fetch POs" });
    }
  });

  app.get("/api/swiggy-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const po = await storage.getSwiggyPoById(id);
      if (!po) {
        return res.status(404).json({ error: "PO not found" });
      }
      res.json(po);
    } catch (error) {
      console.error("Error fetching Swiggy PO:", error);
      res.status(500).json({ error: "Failed to fetch PO" });
    }
  });

  app.post("/api/swiggy-pos/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const uploadedBy = "system"; // In a real app, this would come from authentication
      const { header, lines } = await parseSwiggyPO(req.file.buffer, uploadedBy);
      
      const createdPo = await storage.createSwiggyPo(header, lines);
      res.status(201).json(createdPo);
    } catch (error) {
      console.error("Error uploading Swiggy PO:", error);
      res.status(500).json({ error: "Failed to upload and process file" });
    }
  });

  app.post("/api/swiggy-pos", async (req, res) => {
    try {
      const { header, lines } = req.body;
      
      if (!header || !lines) {
        return res.status(400).json({ error: "Header and lines are required" });
      }
      
      const createdPo = await storage.createSwiggyPo(header, lines);
      res.status(201).json(createdPo);
    } catch (error) {
      console.error("Error creating Swiggy PO:", error);
      res.status(500).json({ error: "Failed to create PO" });
    }
  });

  app.put("/api/swiggy-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { header, lines } = req.body;
      
      const updatedPo = await storage.updateSwiggyPo(id, header);
      res.json(updatedPo);
    } catch (error) {
      console.error("Error updating Swiggy PO:", error);
      res.status(500).json({ error: "Failed to update PO" });
    }
  });

  app.delete("/api/swiggy-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSwiggyPo(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Swiggy PO:", error);
      res.status(500).json({ error: "Failed to delete PO" });
    }
  });

  // Zepto PO management endpoints
  app.get("/api/zepto-pos", async (_req, res) => {
    try {
      const pos = await storage.getAllZeptoPos();
      res.json(pos);
    } catch (error) {
      console.error("Error fetching Zepto POs:", error);
      res.status(500).json({ error: "Failed to fetch Zepto POs" });
    }
  });

  app.get("/api/zepto-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const zeptoPo = await storage.getZeptoPOById(id);
      if (!zeptoPo) {
        return res.status(404).json({ error: "Zepto PO not found" });
      }
      
      res.json(zeptoPo);
    } catch (error) {
      console.error("Error fetching Zepto PO:", error);
      res.status(500).json({ error: "Failed to fetch Zepto PO" });
    }
  });

  app.put("/api/zepto-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { header, lines } = req.body;
      
      const updatedPo = await storage.updateZeptoPo(id, header, lines);
      res.json(updatedPo);
    } catch (error) {
      console.error("Error updating Zepto PO:", error);
      res.status(500).json({ error: "Failed to update PO" });
    }
  });

  app.delete("/api/zepto-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteZeptoPo(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Zepto PO:", error);
      res.status(500).json({ error: "Failed to delete PO" });
    }
  });

  // Unified PO upload and preview routes
  app.post("/api/po/preview", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const uploadedBy = "system";
      let parsedData;
      let detectedVendor = "";

      // Check platform parameter first, then try to detect vendor from filename
      const platformParam = req.body.platform || req.query.platform;
      const filename = req.file.originalname.toLowerCase();
      
      try {
        // Use platform parameter if provided
        if (platformParam === "blinkit") {
          detectedVendor = "blinkit";
          console.log("Processing Blinkit file with multiple POs (platform param)...");
          const blinkitResult = parseBlinkitPO(req.file.buffer, uploadedBy);
          console.log("Found", blinkitResult.poList.length, "POs in Blinkit file");
          // Return the multiple POs structure for Blinkit
          return res.json({
            poList: blinkitResult.poList.map(po => ({
              header: po.header,
              lines: po.lines,
              totalItems: po.lines.length,
              totalQuantity: po.header.total_quantity,
              totalAmount: po.lines.reduce((sum, line) => sum + parseFloat(line.total_amount || '0'), 0).toFixed(2)
            })),
            detectedVendor: 'blinkit',
            totalPOs: blinkitResult.poList.length
          });
        } else if (platformParam === "flipkart") {
          detectedVendor = "flipkart";
          parsedData = await parseFlipkartGroceryPO(req.file.buffer.toString('utf-8'), uploadedBy);
        } else if (platformParam === "zepto") {
          detectedVendor = "zepto";
          parsedData = parseZeptoPO(req.file.buffer.toString('utf-8'), uploadedBy);
        } else if (platformParam === "citymall") {
          detectedVendor = "citymall";
          parsedData = await parseCityMallPO(req.file.buffer.toString('utf-8'), uploadedBy, filename);
        } else if (platformParam === "swiggy") {
          detectedVendor = "swiggy";
          parsedData = await parseSwiggyPO(req.file.buffer, uploadedBy);
        } else if (platformParam === "bigbasket") {
          detectedVendor = "bigbasket";
          parsedData = await parseBigBasketPO(req.file.buffer, uploadedBy);
        } else if (platformParam === "zomato") {
          detectedVendor = "zomato";
          parsedData = await parseZomatoPO(req.file.buffer, uploadedBy);
        } else if (platformParam === "dealshare") {
          detectedVendor = "dealshare";
          parsedData = await parseDealsharePO(req.file.buffer, uploadedBy);
        }
        // Fallback to filename detection if platform param not provided or recognized
        else if (filename.includes('flipkart') || filename.includes('grocery')) {
          detectedVendor = "flipkart";
          parsedData = await parseFlipkartGroceryPO(req.file.buffer.toString('utf-8'), uploadedBy);
        } else if (filename.includes('zepto')) {
          detectedVendor = "zepto";
          parsedData = parseZeptoPO(req.file.buffer.toString('utf-8'), uploadedBy);
        } else if (filename.includes('city') || filename.includes('mall')) {
          detectedVendor = "citymall";
          parsedData = await parseCityMallPO(req.file.buffer.toString('utf-8'), uploadedBy, filename);
        } else if (filename.includes('blinkit')) {
          detectedVendor = "blinkit";
          console.log("Processing Blinkit file with multiple POs (filename detection)...");
          try {
            const blinkitResult = parseBlinkitPO(req.file.buffer, uploadedBy);
            console.log("Found", blinkitResult.poList.length, "POs in Blinkit file");
            // Return the multiple POs structure for Blinkit
            return res.json({
              poList: blinkitResult.poList.map(po => ({
                header: po.header,
                lines: po.lines,
                totalItems: po.lines.length,
                totalQuantity: po.header.total_quantity,
                totalAmount: po.lines.reduce((sum, line) => sum + parseFloat(line.total_amount || '0'), 0).toFixed(2)
              })),
              detectedVendor: 'blinkit',
              totalPOs: blinkitResult.poList.length
            });
          } catch (blinkitError) {
            console.error("Blinkit parsing failed:", blinkitError);
            throw blinkitError; // Re-throw to fall through to fallback parsers
          }
        } else if (filename.includes('swiggy') || filename.includes('soty')) {
          detectedVendor = "swiggy";
          parsedData = await parseSwiggyPO(req.file.buffer, uploadedBy);
        } else {
          // Try different parsers until one works
          const parsers = [
            { name: "flipkart", parser: (buffer: Buffer, user: string) => parseFlipkartGroceryPO(buffer.toString('utf-8'), user) },
            { name: "zepto", parser: (buffer: Buffer, user: string) => parseZeptoPO(buffer.toString('utf-8'), user) },
            { name: "citymall", parser: (buffer: Buffer, user: string) => parseCityMallPO(buffer.toString('utf-8'), user, filename) },
            { name: "blinkit", parser: (buffer: Buffer, user: string) => {
              const result = parseBlinkitPO(buffer, user);
              // Convert multiple PO structure to single PO for fallback detection
              return result.poList.length > 0 ? result.poList[0] : { header: {}, lines: [] };
            } },
            { name: "swiggy", parser: (buffer: Buffer, user: string) => parseSwiggyPO(buffer, user) }
          ];

          for (const { name, parser } of parsers) {
            try {
              parsedData = await parser(req.file.buffer, uploadedBy);
              detectedVendor = name;
              break;
            } catch (error) {
              // Continue to next parser
            }
          }

          if (!parsedData) {
            throw new Error("Unable to parse file format");
          }
        }

        const totalQuantity = parsedData.lines.reduce((sum: number, line: any) => sum + (line.quantity || 0), 0);
        const totalAmount = parsedData.lines.reduce((sum: number, line: any) => {
          const amount = parseFloat(line.total_amount || line.line_total || line.total_value || '0');
          return sum + amount;
        }, 0);

        // Clean header data for display
        let displayHeader = { ...parsedData.header };
        
        // Fix vendor_name display for Swiggy - if it contains payment terms or dates, set to null
        if (detectedVendor === "swiggy") {
          // Force vendor_name to null for Swiggy since the data is corrupted
          displayHeader = { ...displayHeader, vendor_name: null };
        }

        res.json({
          header: displayHeader,
          lines: parsedData.lines,
          detectedVendor: detectedVendor,
          totalItems: parsedData.lines.length,
          totalQuantity: totalQuantity,
          totalAmount: totalAmount.toFixed(2)
        });

      } catch (parseError) {
        console.error("Error parsing file:", parseError);
        res.status(400).json({ error: "Failed to parse file. Please check the format." });
      }

    } catch (error) {
      console.error("Error previewing PO:", error);
      res.status(500).json({ error: "Failed to preview file" });
    }
  });

  app.post("/api/po/import/:vendor", async (req, res) => {
    try {
      const vendor = req.params.vendor;
      const { header, lines, poList } = req.body;

      // Helper function to safely convert dates
      const safeConvertDate = (dateValue: any): Date | null => {
        if (!dateValue) return null;
        if (dateValue instanceof Date) return dateValue;
        if (typeof dateValue === 'string') {
          const parsed = Date.parse(dateValue);
          return isNaN(parsed) ? null : new Date(parsed);
        }
        return null;
      };

      console.log("Import request data:", { 
        vendor, 
        hasPoList: !!poList, 
        hasHeader: !!header, 
        hasLines: !!lines,
        bodyKeys: Object.keys(req.body)
      });
      
      // Handle Blinkit multi-PO structure
      if (vendor === "blinkit" && poList && Array.isArray(poList)) {
        const importResults = [];
        
        for (const po of poList) {
          try {
            // Check if PO number exists
            if (!po.header?.po_number) {
              importResults.push({ 
                po_number: "Unknown", 
                status: "failed", 
                error: "PO number is not available" 
              });
              continue;
            }

            // Check for duplicate PO numbers
            try {
              const existingPo = await storage.getBlinkitPoByNumber(po.header.po_number);
              if (existingPo) {
                importResults.push({ 
                  po_number: po.header.po_number, 
                  status: "failed", 
                  error: "PO already exists" 
                });
                continue;
              }
            } catch (error) {
              // Continue if duplicate check method doesn't exist
            }

            // Clean and convert dates
            const cleanHeader = { ...po.header };
            const dateFields = ['order_date', 'po_expiry_date', 'po_date', 'po_release_date', 'expected_delivery_date'];
            dateFields.forEach(field => {
              if (cleanHeader[field]) {
                cleanHeader[field] = safeConvertDate(cleanHeader[field]);
              }
            });

            // Clean lines data
            const cleanLines = po.lines.map((line: any) => {
              const cleanLine = { ...line };
              const lineDateFields = ['required_by_date', 'po_expiry_date', 'delivery_date'];
              lineDateFields.forEach(field => {
                if (cleanLine[field]) {
                  cleanLine[field] = safeConvertDate(cleanLine[field]);
                }
              });
              return cleanLine;
            });

            // Create the PO
            const createdPo = await storage.createBlinkitPo(cleanHeader, cleanLines);
            importResults.push({ 
              po_number: po.header.po_number, 
              status: "success", 
              id: createdPo.id 
            });

          } catch (error) {
            console.error(`Error importing PO ${po.header?.po_number}:`, error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            importResults.push({ 
              po_number: po.header?.po_number || "Unknown", 
              status: "failed", 
              error: errorMessage
            });
          }
        }

        return res.status(201).json({ 
          message: `Imported ${importResults.filter(r => r.status === 'success').length} of ${poList.length} POs`, 
          results: importResults 
        });
      }

      // Handle single PO structure (existing logic)
      if (!header || !lines) {
        return res.status(400).json({ error: "Header and lines are required" });
      }

      // Check if PO number exists
      if (!header.po_number) {
        return res.status(400).json({ error: "PO number is not available. Please check your uploaded PO file." });
      }

      // Check for duplicate PO numbers
      let existingPo;
      try {
        switch (vendor) {
          case "flipkart":
            existingPo = await storage.getFlipkartGroceryPoByNumber(header.po_number);
            break;
          case "zepto":
            existingPo = await storage.getZeptoPoByNumber(header.po_number);
            break;
          case "citymall":
            existingPo = await storage.getCityMallPoByNumber(header.po_number);
            break;
          case "blinkit":
            existingPo = await storage.getBlinkitPoByNumber(header.po_number);
            break;
          case "swiggy":
            existingPo = await storage.getSwiggyPoByNumber(header.po_number);
            break;
        }
        
        if (existingPo) {
          return res.status(400).json({ error: "PO already exists" });
        }
      } catch (error) {
        // If the method doesn't exist, continue - it means no duplicate check is implemented yet
      }

      // Clean and convert dates to proper Date objects
      const cleanHeader = { ...header };
      
      // Convert all possible date fields
      const dateFields = ['order_date', 'po_expiry_date', 'po_date', 'po_release_date', 'expected_delivery_date', 'appointment_date', 'expiry_date'];
      dateFields.forEach(field => {
        if (cleanHeader[field]) {
          cleanHeader[field] = safeConvertDate(cleanHeader[field]);
        }
      });

      // Clean lines data
      const cleanLines = lines.map((line: any) => {
        const cleanLine = { ...line };
        const lineDateFields = ['required_by_date', 'po_expiry_date', 'delivery_date'];
        lineDateFields.forEach(field => {
          if (cleanLine[field]) {
            cleanLine[field] = safeConvertDate(cleanLine[field]);
          }
        });
        return cleanLine;
      });

      let createdPo;

      switch (vendor) {
        case "flipkart":
          try {
            createdPo = await storage.createFlipkartGroceryPo(cleanHeader, cleanLines);
          } catch (error: any) {
            if (error.code === '23505' && error.constraint?.includes('po_number_unique')) {
              return res.status(409).json({ 
                error: `PO ${cleanHeader.po_number} already exists in Flipkart records`,
                type: 'duplicate_po'
              });
            }
            throw error;
          }
          break;
        case "zepto":
          try {
            createdPo = await storage.createZeptoPo(cleanHeader, cleanLines);
          } catch (error: any) {
            if (error.code === '23505' && error.constraint?.includes('po_number_unique')) {
              return res.status(409).json({ 
                error: `PO ${cleanHeader.po_number} already exists in Zepto records`,
                type: 'duplicate_po'
              });
            }
            throw error;
          }
          break;
        case "citymall":
          try {
            createdPo = await storage.createCityMallPo(cleanHeader, cleanLines);
          } catch (error: any) {
            if (error.code === '23505' && error.constraint?.includes('po_number_unique')) {
              return res.status(409).json({ 
                error: `PO ${cleanHeader.po_number} already exists in City Mall records`,
                type: 'duplicate_po'
              });
            }
            throw error;
          }
          break;
        case "blinkit":
          try {
            createdPo = await storage.createBlinkitPo(cleanHeader, cleanLines);
          } catch (error: any) {
            if (error.code === '23505' && error.constraint?.includes('po_number_unique')) {
              return res.status(409).json({ 
                error: `PO ${cleanHeader.po_number} already exists in Blinkit records`,
                type: 'duplicate_po'
              });
            }
            throw error;
          }
          break;
        case "swiggy":
          try {
            createdPo = await storage.createSwiggyPo(cleanHeader, cleanLines);
          } catch (error: any) {
            if (error.code === '23505' && error.constraint?.includes('po_number_unique')) {
              return res.status(409).json({ 
                error: `PO ${cleanHeader.po_number} already exists in Swiggy records`,
                type: 'duplicate_po'
              });
            }
            throw error;
          }
          break;
        case "bigbasket":
          try {
            createdPo = await storage.createBigbasketPo(cleanHeader, cleanLines);
          } catch (error: any) {
            if (error.code === '23505' && error.constraint === 'bigbasket_po_header_po_number_unique') {
              return res.status(409).json({ 
                error: `PO ${cleanHeader.po_number} already exists in BigBasket records`,
                type: 'duplicate_po'
              });
            }
            throw error;
          }
          break;
        case "zomato":
          try {
            createdPo = await storage.createZomatoPo(cleanHeader, cleanLines);
          } catch (error: any) {
            if (error.code === '23505' && error.constraint?.includes('po_number_unique')) {
              return res.status(409).json({ 
                error: `PO ${cleanHeader.po_number} already exists in Zomato records`,
                type: 'duplicate_po'
              });
            }
            throw error;
          }
          break;
        case "dealshare":
          try {
            // Clean dates for Dealshare
            const dealshareHeader = { ...cleanHeader };
            const dateFields = ['po_created_date', 'po_delivery_date', 'po_expiry_date'];
            dateFields.forEach(field => {
              if (dealshareHeader[field]) {
                dealshareHeader[field] = safeConvertDate(dealshareHeader[field]);
              }
            });
            
            createdPo = await storage.createDealsharePo(dealshareHeader, cleanLines);
          } catch (error: any) {
            console.error("Dealshare import error:", error);
            if (error.code === '23505' && error.constraint?.includes('po_number_unique')) {
              return res.status(409).json({ 
                error: `PO ${cleanHeader.po_number} already exists in Dealshare records`,
                type: 'duplicate_po'
              });
            }
            throw error;
          }
          break;
        default:
          return res.status(400).json({ error: "Unsupported vendor" });
      }

      res.status(201).json(createdPo);
    } catch (error) {
      console.error("Error importing PO:", error);
      res.status(500).json({ error: "Failed to import PO data" });
    }
  });

  // Distributor routes
  app.get("/api/distributors", async (_req, res) => {
    try {
      const distributors = await storage.getAllDistributors();
      res.json(distributors);
    } catch (error) {
      console.error("Error fetching distributors:", error);
      res.status(500).json({ message: "Failed to fetch distributors" });
    }
  });

  app.post("/api/distributors", async (req, res) => {
    try {
      const validatedData = insertDistributorMstSchema.parse(req.body);
      const distributor = await storage.createDistributor(validatedData);
      res.status(201).json(distributor);
    } catch (error) {
      console.error("Error creating distributor:", error);
      res.status(500).json({ message: "Failed to create distributor" });
    }
  });

  app.get("/api/distributors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const distributor = await storage.getDistributorById(id);
      if (!distributor) {
        return res.status(404).json({ message: "Distributor not found" });
      }
      res.json(distributor);
    } catch (error) {
      console.error("Error fetching distributor:", error);
      res.status(500).json({ message: "Failed to fetch distributor" });
    }
  });

  app.put("/api/distributors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDistributorMstSchema.partial().parse(req.body);
      const distributor = await storage.updateDistributor(id, validatedData);
      res.json(distributor);
    } catch (error) {
      console.error("Error updating distributor:", error);
      res.status(500).json({ message: "Failed to update distributor" });
    }
  });

  app.delete("/api/distributors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDistributor(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting distributor:", error);
      res.status(500).json({ message: "Failed to delete distributor" });
    }
  });

  // Distributor PO routes
  app.get("/api/distributor-pos", async (_req, res) => {
    try {
      const pos = await storage.getAllDistributorPos();
      res.json(pos);
    } catch (error) {
      console.error("Error fetching distributor POs:", error);
      res.status(500).json({ message: "Failed to fetch distributor POs" });
    }
  });

  app.post("/api/distributor-pos", async (req, res) => {
    try {
      const validatedData = createDistributorPoSchema.parse(req.body);
      const po = await storage.createDistributorPo(validatedData.header, validatedData.items);
      res.status(201).json(po);
    } catch (error) {
      console.error("Error creating distributor PO:", error);
      res.status(500).json({ message: "Failed to create distributor PO" });
    }
  });

  app.get("/api/distributor-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const po = await storage.getDistributorPoById(id);
      if (!po) {
        return res.status(404).json({ message: "Distributor PO not found" });
      }
      res.json(po);
    } catch (error) {
      console.error("Error fetching distributor PO:", error);
      res.status(500).json({ message: "Failed to fetch distributor PO" });
    }
  });

  app.put("/api/distributor-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateDistributorPoSchema.parse(req.body);
      const po = await storage.updateDistributorPo(id, validatedData.header, validatedData.items);
      res.json(po);
    } catch (error) {
      console.error("Error updating distributor PO:", error);
      res.status(500).json({ message: "Failed to update distributor PO" });
    }
  });

  app.delete("/api/distributor-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDistributorPo(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting distributor PO:", error);
      res.status(500).json({ message: "Failed to delete distributor PO" });
    }
  });

  // Distributor Order Items routes
  app.get("/api/distributor-order-items", async (_req, res) => {
    try {
      const items = await storage.getAllDistributorOrderItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching distributor order items:", error);
      res.status(500).json({ message: "Failed to fetch distributor order items" });
    }
  });

  // Zomato PO routes
  app.get("/api/zomato-pos", async (_req, res) => {
    try {
      const pos = await storage.getAllZomatoPos();
      res.json(pos);
    } catch (error) {
      console.error("Error fetching Zomato POs:", error);
      res.status(500).json({ message: "Failed to fetch Zomato POs" });
    }
  });

  app.get("/api/zomato-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const po = await storage.getZomatoPoById(id);
      if (!po) {
        return res.status(404).json({ message: "Zomato PO not found" });
      }
      res.json(po);
    } catch (error) {
      console.error("Error fetching Zomato PO:", error);
      res.status(500).json({ message: "Failed to fetch Zomato PO" });
    }
  });

  // Dealshare PO routes
  app.get("/api/dealshare-pos", async (_req, res) => {
    try {
      const pos = await storage.getAllDealsharePos();
      res.json(pos);
    } catch (error) {
      console.error("Error fetching Dealshare POs:", error);
      res.status(500).json({ message: "Failed to fetch Dealshare POs" });
    }
  });

  app.get("/api/dealshare-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const po = await storage.getDealsharePoById(id);
      if (!po) {
        return res.status(404).json({ message: "Dealshare PO not found" });
      }
      res.json(po);
    } catch (error) {
      console.error("Error fetching Dealshare PO:", error);
      res.status(500).json({ message: "Failed to fetch Dealshare PO" });
    }
  });

  app.post("/api/dealshare-pos", async (req, res) => {
    try {
      const { header, items } = req.body;
      
      if (!header || !items) {
        return res.status(400).json({ error: "Header and items are required" });
      }
      
      const createdPo = await storage.createDealsharePo(header, items);
      res.status(201).json(createdPo);
    } catch (error) {
      console.error("Error creating Dealshare PO:", error);
      res.status(500).json({ error: "Failed to create PO" });
    }
  });

  app.put("/api/dealshare-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { header, items } = req.body;
      
      const updatedPo = await storage.updateDealsharePo(id, header, items);
      res.json(updatedPo);
    } catch (error) {
      console.error("Error updating Dealshare PO:", error);
      res.status(500).json({ error: "Failed to update PO" });
    }
  });

  app.delete("/api/dealshare-pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDealsharePo(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Dealshare PO:", error);
      res.status(500).json({ error: "Failed to delete PO" });
    }
  });

  // Secondary Sales Routes
  app.get("/api/secondary-sales", async (req, res) => {
    try {
      const { platform, businessUnit } = req.query;
      const sales = await storage.getAllSecondarySales(
        platform as string, 
        businessUnit as string
      );
      res.json(sales);
    } catch (error) {
      console.error("Error fetching secondary sales:", error);
      res.status(500).json({ error: "Failed to fetch secondary sales" });
    }
  });

  app.get("/api/secondary-sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSecondarySalesById(id);
      
      if (!sale) {
        return res.status(404).json({ error: "Secondary sales record not found" });
      }
      
      res.json(sale);
    } catch (error) {
      console.error("Error fetching secondary sales:", error);
      res.status(500).json({ error: "Failed to fetch secondary sales" });
    }
  });

  // Secondary Sales Preview Route
  app.post("/api/secondary-sales/preview", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { platform, businessUnit, periodType, startDate, endDate } = req.body;
      
      if (!platform || !businessUnit || !periodType) {
        return res.status(400).json({ error: "Platform, business unit, and period type are required" });
      }

      if (!["amazon", "zepto", "blinkit", "swiggy", "jiomartsale", "jiomartcancel", "bigbasket", "flipkart-grocery"].includes(platform)) {
        return res.status(400).json({ error: "Supported platforms: amazon, zepto, blinkit, swiggy, jiomartsale, jiomartcancel, bigbasket, flipkart-grocery" });
      }

      // Update business unit validation for Flipkart
      if (platform === "flipkart-grocery") {
        if (!["jivo-mart", "chirag"].includes(businessUnit)) {
          return res.status(400).json({ error: "Business unit for Flipkart Grocery must be either jivo-mart or chirag" });
        }
      } else if (!["jivo-wellness", "jivo-mart"].includes(businessUnit)) {
        return res.status(400).json({ error: "Business unit must be either jivo-wellness or jivo-mart" });
      }

      // Update period type validation for Flipkart
      if (platform === "flipkart-grocery") {
        if (!["2-month"].includes(periodType)) {
          return res.status(400).json({ error: "Period type for Flipkart Grocery must be 2-month" });
        }
      } else if (!["daily", "date-range"].includes(periodType)) {
        return res.status(400).json({ error: "Period type must be either daily or date-range" });
      }

      let parsedData;

      try {
        if (platform === "amazon") {
          parsedData = parseAmazonSecondarySales(
            req.file.buffer, 
            platform, 
            businessUnit, 
            periodType,
            startDate,
            endDate
          );
        } else if (platform === "zepto") {
          const reportDate = periodType === "daily" ? new Date(startDate) : new Date();
          const periodStart = periodType === "date-range" ? new Date(startDate) : undefined;
          const periodEnd = periodType === "date-range" ? new Date(endDate) : undefined;
          
          const parseResult = await parseZeptoSecondaryData(
            req.file.buffer.toString('utf8'),
            reportDate,
            periodStart,
            periodEnd
          );
          
          if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error });
          }
          
          parsedData = {
            platform,
            businessUnit,
            periodType,
            reportDate,
            periodStart,
            periodEnd,
            totalItems: parseResult.totalItems || 0,
            items: parseResult.data || [],
            summary: {
              totalRecords: parseResult.totalItems || 0,
              totalSalesValue: parseResult.data?.reduce((sum, item) => sum + (parseFloat(item.gmv || '0') || 0), 0) || 0,
              uniqueProducts: new Set(parseResult.data?.map(item => item.sku_name).filter(Boolean)).size,
              dateRange: periodType === "date-range" ? `${startDate} to ${endDate}` : startDate
            }
          };
        } else if (platform === "blinkit") {
          const reportDate = periodType === "daily" ? new Date(startDate) : new Date();
          const periodStart = periodType === "date-range" ? new Date(startDate) : undefined;
          const periodEnd = periodType === "date-range" ? new Date(endDate) : undefined;
          
          const parsedResult = parseBlinkitSecondarySalesFile(
            req.file.buffer,
            req.file.originalname || 'blinkit-sales.csv',
            businessUnit,
            periodType,
            periodType === "daily" ? startDate : undefined,
            periodType === "date-range" ? startDate : undefined,
            periodType === "date-range" ? endDate : undefined
          );
          
          parsedData = {
            platform,
            businessUnit,
            periodType,
            reportDate,
            periodStart,
            periodEnd,
            totalItems: parsedResult.totalItems,
            items: parsedResult.items,
            summary: {
              totalRecords: parsedResult.totalItems,
              totalSalesValue: parsedResult.summary?.totalSalesValue || 0,
              uniqueProducts: parsedResult.summary?.uniqueProducts || 0,
              dateRange: periodType === "date-range" ? `${startDate} to ${endDate}` : startDate
            }
          };
        } else if (platform === "swiggy") {
          const reportDate = periodType === "daily" ? new Date(startDate) : new Date();
          const periodStart = periodType === "date-range" ? new Date(startDate) : undefined;
          const periodEnd = periodType === "date-range" ? new Date(endDate) : undefined;
          
          const parseResult = await parseSwiggySecondaryData(
            req.file.buffer.toString('utf8'),
            reportDate,
            periodStart,
            periodEnd
          );
          
          if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error });
          }
          
          parsedData = {
            platform,
            businessUnit,
            periodType,
            reportDate,
            periodStart,
            periodEnd,
            totalItems: parseResult.totalItems || 0,
            items: parseResult.data || [],
            summary: {
              totalRecords: parseResult.totalItems || 0,
              totalSalesValue: parseResult.data?.reduce((sum, item) => sum + (parseFloat(item.gmv || '0') || 0), 0) || 0,
              uniqueProducts: new Set(parseResult.data?.map(item => item.product_name).filter(Boolean)).size,
              dateRange: periodType === "date-range" ? `${startDate} to ${endDate}` : startDate
            }
          };
        } else if (platform === "jiomartsale") {
          const { parseJioMartSaleSecondarySales } = await import("./jiomartsale-secondary-sales-parser");
          
          parsedData = parseJioMartSaleSecondarySales(
            req.file.buffer,
            platform,
            businessUnit,
            periodType,
            startDate,
            endDate
          );
        } else if (platform === "jiomartcancel") {
          const { parseJioMartCancelSecondarySales } = await import("./jiomartcancel-secondary-sales-parser");
          
          parsedData = parseJioMartCancelSecondarySales(
            req.file.buffer,
            platform,
            businessUnit,
            periodType,
            startDate,
            endDate
          );
        } else if (platform === "bigbasket") {
          parsedData = parseBigBasketSecondarySales(
            req.file.buffer,
            platform,
            businessUnit,
            periodType,
            startDate,
            endDate
          );
        } else if (platform === "flipkart-grocery") {
          parsedData = parseFlipkartSecondaryData(req.file.buffer, periodType, businessUnit, startDate, endDate);
        }

        if (!parsedData) {
          return res.status(400).json({ error: "Unsupported platform" });
        }

        // Handle different data structures for different platforms
        const dataItems = platform === "flipkart-grocery" ? parsedData.data : parsedData.items;
        if (!dataItems || dataItems.length === 0) {
          return res.status(400).json({ error: "No valid sales data found in file" });
        }

        res.json({
          platform: parsedData.platform,
          businessUnit: parsedData.businessUnit,
          periodType: parsedData.periodType,
          reportDate: parsedData.reportDate,
          periodStart: parsedData.periodStart,
          periodEnd: parsedData.periodEnd,
          totalItems: parsedData.totalItems,
          summary: parsedData.summary,
          items: platform === "flipkart-grocery" ? parsedData.data : parsedData.items // Send all items for preview
        });

      } catch (parseError: any) {
        console.error("Parse error:", parseError);
        return res.status(400).json({ 
          error: "Failed to parse file", 
          details: parseError.message 
        });
      }

    } catch (error) {
      console.error("Error in secondary sales preview:", error);
      res.status(500).json({ error: "Failed to preview secondary sales file" });
    }
  });

  // Helper function to generate file hash
  function generateFileHash(buffer: Buffer, filename: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    hash.update(filename);
    return hash.digest('hex');
  }

  // Helper function to track file upload
  async function trackFileUpload(fileHash: string, filename: string, platform: string, businessUnit: string, periodType: string, uploadType: string, fileSize: number): Promise<void> {
    try {
      const { fileUploadTracking } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      
      // Check if this exact combination already exists
      const existing = await db.select().from(fileUploadTracking)
        .where(and(
          eq(fileUploadTracking.file_hash, fileHash),
          eq(fileUploadTracking.platform, platform),
          eq(fileUploadTracking.business_unit, businessUnit),
          eq(fileUploadTracking.period_type, periodType),
          eq(fileUploadTracking.upload_type, uploadType)
        ))
        .limit(1);
      
      // Only insert if this exact combination doesn't exist
      if (existing.length === 0) {
        await db.insert(fileUploadTracking).values({
          file_hash: fileHash,
          original_filename: filename,
          platform: platform,
          business_unit: businessUnit,
          period_type: periodType,
          upload_type: uploadType,
          file_size: fileSize,
          uploader_info: 'system'
        });
      }
    } catch (error) {
      console.error("Error tracking file upload:", error);
      // Don't throw - file tracking is not critical to upload success
    }
  }

  // Helper function to check for duplicate inventory files
  async function checkForDuplicateInventoryFile(fileHash: string, platform: string, businessUnit: string, periodType: string): Promise<boolean> {
    try {
      const { fileUploadTracking } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      
      // Check for duplicates if it's the exact same import combination
      const existingFile = await db.select().from(fileUploadTracking)
        .where(and(
          eq(fileUploadTracking.file_hash, fileHash),
          eq(fileUploadTracking.platform, platform),
          eq(fileUploadTracking.business_unit, businessUnit),
          eq(fileUploadTracking.period_type, periodType),
          eq(fileUploadTracking.upload_type, 'inventory')
        ))
        .limit(1);
      
      return existingFile.length > 0;
    } catch (error) {
      console.error("Error checking for duplicate inventory file:", error);
      return false; // If check fails, allow upload to proceed
    }
  }

  // Helper function to check for duplicate files
  async function checkForDuplicateFile(fileHash: string, platform: string, businessUnit: string, periodType: string): Promise<boolean> {
    try {
      let table;
      const tableName = getTableName(platform, businessUnit, periodType);
      
      // Import the schema for the appropriate table
      const { 
        scAmJwDaily, scAmJwRange, scAmJmDaily, scAmJmRange,
        scZeptoJmDaily, scZeptoJmRange,
        scBlinkitJmDaily, scBlinkitJmRange,
        scSwiggyJmDaily, scSwiggyJmRange,
        scJioMartSaleJmDaily, scJioMartSaleJmRange,
        scJioMartCancelJmDaily, scJioMartCancelJmRange,
        scBigBasketJmDaily, scBigBasketJmRange
      } = await import("@shared/schema");
      
      // Select the appropriate table based on platform and period type
      switch (tableName) {
        case "SC_Amazon_JW_Daily":
          table = scAmJwDaily;
          break;
        case "SC_Amazon_JW_Range":
          table = scAmJwRange;
          break;
        case "SC_Amazon_JM_Daily":
          table = scAmJmDaily;
          break;
        case "SC_Amazon_JM_Range":
          table = scAmJmRange;
          break;
        case "SC_Zepto_JM_Daily":
          table = scZeptoJmDaily;
          break;
        case "SC_Zepto_JM_Range":
          table = scZeptoJmRange;
          break;
        case "SC_Blinkit_JM_Daily":
          table = scBlinkitJmDaily;
          break;
        case "SC_Blinkit_JM_Range":
          table = scBlinkitJmRange;
          break;
        case "SC_Swiggy_JM_Daily":
          table = scSwiggyJmDaily;
          break;
        case "SC_Swiggy_JM_Range":
          table = scSwiggyJmRange;
          break;
        case "SC_JioMartSale_JM_Daily":
          table = scJioMartSaleJmDaily;
          break;
        case "SC_JioMartSale_JM_Range":
          table = scJioMartSaleJmRange;
          break;
        case "SC_JioMartCancel_JM_Daily":
          table = scJioMartCancelJmDaily;
          break;
        case "SC_JioMartCancel_JM_Range":
          table = scJioMartCancelJmRange;
          break;
        case "SC_BigBasket_JM_Daily":
          table = scBigBasketJmDaily;
          break;
        case "SC_BigBasket_JM_Range":
          table = scBigBasketJmRange;
          break;
        default:
          return false;
      }
      
      // Check if any record exists with the same file hash in attachment_path
      const { like, isNotNull, and } = await import("drizzle-orm");
      const existingRecords = await db.select().from(table).where(
        and(
          isNotNull(table.attachment_path),
          like(table.attachment_path, `%${fileHash}%`)
        )
      ).limit(1);
      
      return existingRecords.length > 0;
    } catch (error) {
      console.error("Error checking for duplicate file:", error);
      return false;
    }
  }

  // Helper function to get table name
  function getTableName(platform: string, businessUnit: string, periodType: string): string {
    const platformMap: Record<string, string> = {
      "amazon": "Amazon",
      "zepto": "Zepto", 
      "blinkit": "Blinkit",
      "swiggy": "Swiggy",
      "jiomartsale": "JioMartSale",
      "jiomartcancel": "JioMartCancel",
      "bigbasket": "BigBasket"
    };
    
    const businessUnitMap: Record<string, string> = {
      "jivo-wellness": "JW",
      "jivo-mart": "JM"
    };
    
    const periodTypeMap: Record<string, string> = {
      "daily": "Daily",
      "date-range": "Range"
    };
    
    return `SC_${platformMap[platform]}_${businessUnitMap[businessUnit]}_${periodTypeMap[periodType]}`;
  }

  // Secondary Sales Import Route
  app.post("/api/secondary-sales/import/:platform", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { platform } = req.params;
      const { businessUnit, periodType, startDate, endDate } = req.body;
      
      if (!platform || !businessUnit || !periodType) {
        return res.status(400).json({ error: "Platform, business unit, and period type are required" });
      }

      if (!["amazon", "zepto", "blinkit", "swiggy", "jiomartsale", "jiomartcancel", "bigbasket", "flipkart-grocery"].includes(platform)) {
        return res.status(400).json({ error: "Supported platforms: amazon, zepto, blinkit, swiggy, jiomartsale, jiomartcancel, bigbasket, flipkart-grocery" });
      }

      // Update business unit validation for Flipkart
      if (platform === "flipkart-grocery") {
        if (!["jivo-mart", "chirag"].includes(businessUnit)) {
          return res.status(400).json({ error: "Business unit for Flipkart Grocery must be either jivo-mart or chirag" });
        }
      } else if (!["jivo-wellness", "jivo-mart"].includes(businessUnit)) {
        return res.status(400).json({ error: "Business unit must be either jivo-wellness or jivo-mart" });
      }

      // Update period type validation for Flipkart
      if (platform === "flipkart-grocery") {
        if (!["2-month"].includes(periodType)) {
          return res.status(400).json({ error: "Period type for Flipkart Grocery must be 2-month" });
        }
      } else if (!["daily", "date-range"].includes(periodType)) {
        return res.status(400).json({ error: "Period type must be either daily or date-range" });
      }

      if (periodType === "date-range" && (!startDate || !endDate) && platform !== "flipkart-grocery") {
        return res.status(400).json({ error: "Start date and end date are required for date-range period type" });
      }

      // Generate file hash for duplicate detection
      const fileHash = generateFileHash(req.file.buffer, req.file.originalname || 'unknown');
      
      // Note: We don't check for duplicates in preview - users should be able to preview any file

      let parsedData;

      // Upload file to object storage first
      let attachmentPath = null;
      try {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        
        // Upload the file
        const uploadResponse = await fetch(uploadURL, {
          method: 'PUT',
          body: req.file.buffer,
          headers: {
            'Content-Type': req.file.mimetype
          }
        });
        
        if (uploadResponse.ok) {
          attachmentPath = objectStorageService.normalizeObjectEntityPath(uploadURL) + `?hash=${fileHash}`;
        }
      } catch (uploadError) {
        console.error("Error uploading file to object storage:", uploadError);
        // Continue without attachment if upload fails
      }

      try {
        if (platform === "amazon") {
          parsedData = parseAmazonSecondarySales(
            req.file.buffer, 
            platform, 
            businessUnit, 
            periodType,
            startDate,
            endDate,
            attachmentPath || undefined
          );
        } else if (platform === "zepto") {
          const reportDate = periodType === "daily" ? new Date(startDate) : new Date();
          const periodStart = periodType === "date-range" ? new Date(startDate) : undefined;
          const periodEnd = periodType === "date-range" ? new Date(endDate) : undefined;
          
          const parseResult = await parseZeptoSecondaryData(
            req.file.buffer.toString('utf8'),
            reportDate,
            periodStart,
            periodEnd
          );
          
          if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error });
          }
          
          // Add attachment path to all items
          const itemsWithAttachment = parseResult.data?.map(item => ({
            ...item,
            attachment_path: attachmentPath
          })) || [];
          
          parsedData = {
            platform,
            businessUnit,
            periodType,
            reportDate,
            periodStart,
            periodEnd,
            totalItems: parseResult.totalItems || 0,
            items: itemsWithAttachment,
            summary: {
              totalRecords: parseResult.totalItems || 0,
              totalSalesValue: parseResult.data?.reduce((sum: number, item: any) => sum + (parseFloat(item.gmv || '0') || 0), 0) || 0,
              uniqueProducts: new Set(parseResult.data?.map((item: any) => item.sku_name).filter(Boolean)).size,
              dateRange: periodType === "date-range" ? `${startDate} to ${endDate}` : startDate
            }
          };
        } else if (platform === "blinkit") {
          const reportDate = periodType === "daily" ? new Date(startDate) : new Date();
          const periodStart = periodType === "date-range" ? new Date(startDate) : undefined;
          const periodEnd = periodType === "date-range" ? new Date(endDate) : undefined;
          
          const parsedResult = parseBlinkitSecondarySalesFile(
            req.file.buffer,
            req.file.originalname || 'blinkit-sales.csv',
            businessUnit,
            periodType,
            periodType === "daily" ? startDate : undefined,
            periodType === "date-range" ? startDate : undefined,
            periodType === "date-range" ? endDate : undefined
          );
          
          // Add attachment path to all items
          const itemsWithAttachment = parsedResult.items.map(item => ({
            ...item,
            attachment_path: attachmentPath
          }));
          
          parsedData = {
            platform,
            businessUnit,
            periodType,
            reportDate,
            periodStart,
            periodEnd,
            totalItems: parsedResult.totalItems,
            items: itemsWithAttachment,
            summary: {
              totalRecords: parsedResult.totalItems,
              totalSalesValue: parsedResult.summary?.totalSalesValue || 0,
              uniqueProducts: parsedResult.summary?.uniqueProducts || 0,
              dateRange: periodType === "date-range" ? `${startDate} to ${endDate}` : startDate
            }
          };
        } else if (platform === "swiggy") {
          const reportDate = periodType === "daily" ? new Date(startDate) : new Date();
          const periodStart = periodType === "date-range" ? new Date(startDate) : undefined;
          const periodEnd = periodType === "date-range" ? new Date(endDate) : undefined;
          
          const parseResult = await parseSwiggySecondaryData(
            req.file.buffer.toString('utf8'),
            reportDate,
            periodStart,
            periodEnd
          );
          
          if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error });
          }
          
          // Add attachment path to all items
          const itemsWithAttachment = parseResult.data?.map(item => ({
            ...item,
            attachment_path: attachmentPath
          })) || [];
          
          parsedData = {
            platform,
            businessUnit,
            periodType,
            reportDate,
            periodStart,
            periodEnd,
            totalItems: parseResult.totalItems || 0,
            items: itemsWithAttachment,
            summary: {
              totalRecords: parseResult.totalItems || 0,
              totalSalesValue: parseResult.data?.reduce((sum: number, item: any) => sum + (parseFloat(item.gmv || '0') || 0), 0) || 0,
              uniqueProducts: new Set(parseResult.data?.map((item: any) => item.product_name).filter(Boolean)).size,
              dateRange: periodType === "date-range" ? `${startDate} to ${endDate}` : startDate
            }
          };
        } else if (platform === "jiomartsale") {
          const { parseJioMartSaleSecondarySales } = await import("./jiomartsale-secondary-sales-parser");
          
          const parsedResult = parseJioMartSaleSecondarySales(
            req.file.buffer,
            platform,
            businessUnit,
            periodType,
            startDate,
            endDate
          );
          
          // Add attachment path to all items
          const itemsWithAttachment = parsedResult.items.map(item => ({
            ...item,
            attachment_path: attachmentPath
          }));
          
          parsedData = {
            ...parsedResult,
            items: itemsWithAttachment
          };
        } else if (platform === "jiomartcancel") {
          const { parseJioMartCancelSecondarySales } = await import("./jiomartcancel-secondary-sales-parser");
          
          const parsedResult = parseJioMartCancelSecondarySales(
            req.file.buffer,
            platform,
            businessUnit,
            periodType,
            startDate,
            endDate
          );
          
          // Add attachment path to all items
          const itemsWithAttachment = parsedResult.items.map(item => ({
            ...item,
            attachment_path: attachmentPath
          }));
          
          parsedData = {
            ...parsedResult,
            items: itemsWithAttachment
          };
        } else if (platform === "bigbasket") {
          const parsedResult = parseBigBasketSecondarySales(
            req.file.buffer,
            platform,
            businessUnit,
            periodType,
            startDate,
            endDate
          );
          
          // Add attachment path to all items
          const itemsWithAttachment = parsedResult.items.map(item => ({
            ...item,
            attachment_path: attachmentPath
          }));
          
          parsedData = {
            ...parsedResult,
            items: itemsWithAttachment
          };
        } else if (platform === "flipkart-grocery") {
          parsedData = parseFlipkartSecondaryData(req.file.buffer, periodType, businessUnit, startDate, endDate);
          
          // Add attachment path to all items
          const itemsWithAttachment = parsedData.data.map(item => ({
            ...item,
            attachment_path: attachmentPath
          }));
          
          parsedData = {
            ...parsedData,
            data: itemsWithAttachment
          };
        }

        if (!parsedData) {
          return res.status(400).json({ error: "Unsupported platform" });
        }

        // Handle different data structures for different platforms
        const dataItems = platform === "flipkart-grocery" ? parsedData.data : parsedData.items;
        if (!dataItems || dataItems.length === 0) {
          return res.status(400).json({ error: "No valid sales data found in file" });
        }

        let insertedItems;
        let tableName;
        
        // Route to specific table based on platform, business unit and period type
        if (platform === "amazon") {
          if (businessUnit === "jivo-wellness" && periodType === "daily") {
            insertedItems = await storage.createScAmJwDaily(parsedData.items as any);
            tableName = "SC_AM_JW_Daily";
          } else if (businessUnit === "jivo-wellness" && periodType === "date-range") {
            insertedItems = await storage.createScAmJwRange(parsedData.items as any);
            tableName = "SC_AM_JW_Range";
          } else if (businessUnit === "jivo-mart" && periodType === "daily") {
            insertedItems = await storage.createScAmJmDaily(parsedData.items as any);
            tableName = "SC_AM_JM_Daily";
          } else if (businessUnit === "jivo-mart" && periodType === "date-range") {
            insertedItems = await storage.createScAmJmRange(parsedData.items as any);
            tableName = "SC_AM_JM_Range";
          }
        } else if (platform === "zepto") {
          // Ensure all date fields are properly formatted for Zepto
          const zeptoItemsWithDates = parsedData.items.map((item: any) => {
            // Parse dates safely with multiple fallbacks
            let itemDate = new Date();
            if (item.date) {
              let parsedDate = new Date(item.date);
              if (isNaN(parsedDate.getTime())) {
                parsedDate = new Date(item.date + 'T00:00:00.000Z');
              }
              if (isNaN(parsedDate.getTime()) && typeof item.date === 'string' && item.date.includes('-')) {
                const [day, month, year] = item.date.split('-');
                if (day && month && year) {
                  parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                }
              }
              if (!isNaN(parsedDate.getTime())) {
                itemDate = parsedDate;
              }
            }
            
            // Parse report date safely
            let reportDate = new Date();
            if ((parsedData as any).reportDate) {
              const parsedReportDate = new Date((parsedData as any).reportDate);
              if (!isNaN(parsedReportDate.getTime())) {
                reportDate = parsedReportDate;
              }
            }
            
            return {
              ...item,
              date: itemDate,
              report_date: reportDate
            };
          });

          if (businessUnit === "jivo-mart" && periodType === "daily") {
            insertedItems = await storage.createScZeptoJmDaily(zeptoItemsWithDates as any);
            tableName = "SC_Zepto_JM_Daily";
          } else if (businessUnit === "jivo-mart" && periodType === "date-range") {
            // For date-range, also add period fields
            const zeptoItemsWithPeriod = zeptoItemsWithDates.map(item => {
              let periodStart = new Date();
              let periodEnd = new Date();
              
              if ((parsedData as any).periodStart) {
                const parsedPeriodStart = new Date((parsedData as any).periodStart);
                if (!isNaN(parsedPeriodStart.getTime())) {
                  periodStart = parsedPeriodStart;
                }
              }
              
              if ((parsedData as any).periodEnd) {
                const parsedPeriodEnd = new Date((parsedData as any).periodEnd);
                if (!isNaN(parsedPeriodEnd.getTime())) {
                  periodEnd = parsedPeriodEnd;
                }
              }
              
              return {
                ...item,
                period_start: periodStart,
                period_end: periodEnd
              };
            });
            insertedItems = await storage.createScZeptoJmRange(zeptoItemsWithPeriod as any);
            tableName = "SC_Zepto_JM_Range";
          }
        } else if (platform === "blinkit") {
          // Convert date strings to Date objects for database insertion and add report_date
          const blinkitItemsWithDates = parsedData.items.map((item: any) => {
            // Parse the date more safely with multiple fallbacks
            let itemDate = new Date();
            if (item.date) {
              // Try multiple date parsing approaches
              let parsedDate = new Date(item.date);
              if (isNaN(parsedDate.getTime())) {
                // Try ISO format
                parsedDate = new Date(item.date + 'T00:00:00.000Z');
              }
              if (isNaN(parsedDate.getTime())) {
                // Try replacing dashes with slashes
                parsedDate = new Date(item.date.replace(/-/g, '/'));
              }
              if (!isNaN(parsedDate.getTime())) {
                itemDate = parsedDate;
              }
            }
            
            // Parse report date safely
            let reportDate = new Date();
            if ((parsedData as any).reportDate) {
              const parsedReportDate = new Date((parsedData as any).reportDate);
              if (!isNaN(parsedReportDate.getTime())) {
                reportDate = parsedReportDate;
              }
            }
            
            console.log('Processing item:', {
              originalDate: item.date,
              parsedDate: itemDate,
              reportDate: reportDate,
              itemId: item.item_id
            });
            
            return {
              item_id: item.item_id || null,
              item_name: item.item_name || null,
              manufacturer_id: item.manufacturer_id || null,
              manufacturer_name: item.manufacturer_name || null,
              city_id: item.city_id || null,
              city_name: item.city_name || null,
              category: item.category || null,
              date: itemDate,
              qty_sold: item.qty_sold ? parseFloat(item.qty_sold).toString() : null,
              mrp: item.mrp ? parseFloat(item.mrp).toString() : null,
              report_date: reportDate,
              attachment_path: null
            };
          });
          
          if (businessUnit === "jivo-mart" && periodType === "daily") {
            insertedItems = await storage.createScBlinkitJmDaily(blinkitItemsWithDates as any);
            tableName = "SC_Blinkit_JM_Daily";
          } else if (businessUnit === "jivo-mart" && periodType === "date-range") {
            // For date-range, also add period_start and period_end
            const blinkitItemsWithPeriod = blinkitItemsWithDates.map(item => {
              // Parse period dates safely
              let periodStart = new Date();
              let periodEnd = new Date();
              
              if ((parsedData as any).periodStart) {
                const parsedPeriodStart = new Date((parsedData as any).periodStart);
                if (!isNaN(parsedPeriodStart.getTime())) {
                  periodStart = parsedPeriodStart;
                }
              }
              
              if ((parsedData as any).periodEnd) {
                const parsedPeriodEnd = new Date((parsedData as any).periodEnd);
                if (!isNaN(parsedPeriodEnd.getTime())) {
                  periodEnd = parsedPeriodEnd;
                }
              }
              
              return {
                ...item,
                period_start: periodStart,
                period_end: periodEnd
              };
            });
            insertedItems = await storage.createScBlinkitJmRange(blinkitItemsWithPeriod as any);
            tableName = "SC_Blinkit_JM_Range";
          }
        } else if (platform === "swiggy") {
          if (businessUnit === "jivo-mart" && periodType === "daily") {
            insertedItems = await storage.createScSwiggyJmDaily(parsedData.items as any);
            tableName = "SC_Swiggy_JM_Daily";
          } else if (businessUnit === "jivo-mart" && periodType === "date-range") {
            insertedItems = await storage.createScSwiggyJmRange(parsedData.items as any);
            tableName = "SC_Swiggy_JM_Range";
          }
        } else if (platform === "jiomartsale") {
          // Process JioMartSale data with proper date handling
          const jioMartSaleItemsWithDates = (parsedData as any).items.map((item: any) => {
            // Parse report date safely
            let reportDate = new Date();
            if ((parsedData as any).reportDate) {
              const parsedReportDate = new Date((parsedData as any).reportDate);
              if (!isNaN(parsedReportDate.getTime())) {
                reportDate = parsedReportDate;
              }
            }

            // Parse date fields safely
            const parseJioMartDate = (dateStr: string): Date | null => {
              if (!dateStr || dateStr.trim() === '') return null;
              try {
                const cleanStr = dateStr.replace(/\s*\+\d{4}$/, ''); // Remove timezone
                const date = new Date(cleanStr);
                return isNaN(date.getTime()) ? null : date;
              } catch {
                return null;
              }
            };

            return {
              ...item,
              report_date: reportDate,
              shipment_created_at: parseJioMartDate(item.shipment_created_at),
              accepted_at: parseJioMartDate(item.accepted_at),
              acceptance_tat_date_time: parseJioMartDate(item.acceptance_tat_date_time)
            };
          });

          if (businessUnit === "jivo-mart" && periodType === "daily") {
            insertedItems = await storage.createScJioMartSaleJmDaily(jioMartSaleItemsWithDates as any);
            tableName = "SC_JioMartSale_JM_Daily";
          } else if (businessUnit === "jivo-mart" && periodType === "date-range") {
            // For date-range, also add period fields
            const jioMartSaleItemsWithPeriod = jioMartSaleItemsWithDates.map(item => {
              let periodStart = new Date();
              let periodEnd = new Date();
              
              if ((parsedData as any).periodStart) {
                const parsedPeriodStart = new Date((parsedData as any).periodStart);
                if (!isNaN(parsedPeriodStart.getTime())) {
                  periodStart = parsedPeriodStart;
                }
              }
              
              if ((parsedData as any).periodEnd) {
                const parsedPeriodEnd = new Date((parsedData as any).periodEnd);
                if (!isNaN(parsedPeriodEnd.getTime())) {
                  periodEnd = parsedPeriodEnd;
                }
              }
              
              return {
                ...item,
                period_start: periodStart,
                period_end: periodEnd
              };
            });
            insertedItems = await storage.createScJioMartSaleJmRange(jioMartSaleItemsWithPeriod as any);
            tableName = "SC_JioMartSale_JM_Range";
          }
        } else if (platform === "jiomartcancel") {
          // Process JioMartCancel data with proper date handling
          const jioMartCancelItemsWithDates = (parsedData as any).items.map((item: any) => {
            // Parse report date safely
            let reportDate = new Date();
            if ((parsedData as any).reportDate) {
              const parsedReportDate = new Date((parsedData as any).reportDate);
              if (!isNaN(parsedReportDate.getTime())) {
                reportDate = parsedReportDate;
              }
            }

            return {
              ...item,
              report_date: reportDate
            };
          });

          if (businessUnit === "jivo-mart" && periodType === "daily") {
            insertedItems = await storage.createScJioMartCancelJmDaily(jioMartCancelItemsWithDates as any);
            tableName = "SC_JioMartCancel_JM_Daily";
          } else if (businessUnit === "jivo-mart" && periodType === "date-range") {
            // For date-range, also add period fields
            const jioMartCancelItemsWithPeriod = jioMartCancelItemsWithDates.map(item => {
              let periodStart = new Date();
              let periodEnd = new Date();
              
              if ((parsedData as any).periodStart) {
                const parsedPeriodStart = new Date((parsedData as any).periodStart);
                if (!isNaN(parsedPeriodStart.getTime())) {
                  periodStart = parsedPeriodStart;
                }
              }
              
              if ((parsedData as any).periodEnd) {
                const parsedPeriodEnd = new Date((parsedData as any).periodEnd);
                if (!isNaN(parsedPeriodEnd.getTime())) {
                  periodEnd = parsedPeriodEnd;
                }
              }
              
              return {
                ...item,
                period_start: periodStart,
                period_end: periodEnd
              };
            });
            insertedItems = await storage.createScJioMartCancelJmRange(jioMartCancelItemsWithPeriod as any);
            tableName = "SC_JioMartCancel_JM_Range";
          }
        } else if (platform === "bigbasket") {
          if (businessUnit === "jivo-mart" && periodType === "daily") {
            // Add report_date to each BigBasket item
            const bigBasketItemsWithDates = parsedData.items.map((item: any) => ({
              ...item,
              report_date: parsedData.reportDate || new Date()
            }));
            insertedItems = await storage.createScBigBasketJmDaily(bigBasketItemsWithDates as any);
            tableName = "SC_BigBasket_JM_Daily";
          } else if (businessUnit === "jivo-mart" && periodType === "date-range") {
            // Add report_date and period fields for date-range
            const bigBasketItemsWithDates = parsedData.items.map((item: any) => {
              let periodStart = new Date();
              let periodEnd = new Date();
              
              if ((parsedData as any).periodStart) {
                const parsedPeriodStart = new Date((parsedData as any).periodStart);
                if (!isNaN(parsedPeriodStart.getTime())) {
                  periodStart = parsedPeriodStart;
                }
              }
              
              if ((parsedData as any).periodEnd) {
                const parsedPeriodEnd = new Date((parsedData as any).periodEnd);
                if (!isNaN(parsedPeriodEnd.getTime())) {
                  periodEnd = parsedPeriodEnd;
                }
              }
              
              return {
                ...item,
                report_date: parsedData.reportDate || new Date(),
                period_start: periodStart,
                period_end: periodEnd
              };
            });
            insertedItems = await storage.createScBigBasketJmRange(bigBasketItemsWithDates as any);
            tableName = "SC_BigBasket_JM_Range";
          }
        } else if (platform === "flipkart-grocery") {
          // Ensure all data fields are properly formatted for Flipkart
          const flipkartItemsWithDates = parsedData.data.map((item: any) => {
            return {
              tenant_id: item.tenantId,
              retailer_name: item.retailerName,
              retailer_code: item.retailerCode,
              fsn: item.fsn,
              product_name: item.productName,
              category: item.category,
              sub_category: item.subCategory,
              brand: item.brand,
              mrp: item.mrp ? parseFloat(item.mrp) : null,
              selling_price: item.sellingPrice ? parseFloat(item.sellingPrice) : null,
              total_sales_qty: item.totalSalesQty ? parseInt(item.totalSalesQty) : null,
              total_sales_value: item.totalSalesValue ? parseFloat(item.totalSalesValue) : null,
              sales_data: JSON.stringify(item.salesData || {}),
              period_start: parsedData.periodStart ? new Date(parsedData.periodStart) : null,
              period_end: parsedData.periodEnd ? new Date(parsedData.periodEnd) : null,
              report_date: parsedData.reportDate ? new Date(parsedData.reportDate) : new Date(),
              period_type: periodType,
              business_unit: businessUnit,
              file_hash: fileHash,
              uploaded_at: new Date(),
              attachment_path: attachmentPath
            };
          });
          
          // Insert data into Flipkart tables based on business unit
          if (flipkartItemsWithDates && flipkartItemsWithDates.length > 0) {
            const { scFlipkartJm2Month, scFlipkartChirag2Month } = await import("@shared/schema");
            const flipkartTable = businessUnit === "chirag" ? scFlipkartChirag2Month : scFlipkartJm2Month;
            insertedItems = await db.insert(flipkartTable).values(flipkartItemsWithDates).returning();
            tableName = businessUnit === "chirag" ? "SC_FlipKart_CHIRAG_2Month" : "SC_FlipKart_JM_2Month";
          }
        }

        if (!insertedItems) {
          return res.status(400).json({ error: "Invalid platform, business unit and period type combination" });
        }

        res.status(201).json({
          success: true,
          platform: parsedData.platform,
          businessUnit: parsedData.businessUnit,
          periodType: parsedData.periodType,
          tableName,
          totalItems: insertedItems.length,
          summary: parsedData.summary,
          reportDate: parsedData.reportDate,
          periodStart: parsedData.periodStart,
          periodEnd: parsedData.periodEnd
        });

      } catch (parseError: any) {
        console.error("Parse error:", parseError);
        return res.status(400).json({ 
          error: "Failed to parse file", 
          details: parseError.message 
        });
      }

    } catch (error: any) {
      console.error("Error importing secondary sales:", error);
      if (error.message && error.message.includes("unique")) {
        res.status(409).json({ error: "Secondary sales data already exists" });
      } else {
        res.status(500).json({ error: "Failed to import secondary sales data" });
      }
    }
  });

  app.put("/api/secondary-sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { header, items } = req.body;
      
      const updatedSale = await storage.updateSecondarySales(id, header, items);
      res.json(updatedSale);
    } catch (error) {
      console.error("Error updating secondary sales:", error);
      res.status(500).json({ error: "Failed to update secondary sales" });
    }
  });

  app.delete("/api/secondary-sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSecondarySales(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting secondary sales:", error);
      res.status(500).json({ error: "Failed to delete secondary sales" });
    }
  });

  // Inventory Management Routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const { platform, businessUnit } = req.query;
      const inventory = await storage.getAllInventory(
        platform as string, 
        businessUnit as string
      );
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inventoryItem = await storage.getInventoryById(id);
      
      if (!inventoryItem) {
        return res.status(404).json({ error: "Inventory record not found" });
      }
      
      res.json(inventoryItem);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Inventory Preview Route
  app.post("/api/inventory/preview", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { platform, businessUnit, periodType, reportDate, periodStart, periodEnd, fileHash } = req.body;
      
      console.log("DEBUG: Inventory preview request for platform:", platform);
      console.log("DEBUG: Full request body:", req.body);
      
      if (!platform || !businessUnit || !periodType) {
        return res.status(400).json({ error: "Platform, business unit, and period type are required" });
      }

      if (!["jiomart", "blinkit", "amazon", "swiggy", "flipkart", "zepto", "bigbasket"].includes(platform)) {
        console.log("DEBUG: Platform not supported:", platform, "- supported platforms:", ["jiomart", "blinkit", "amazon", "swiggy", "flipkart", "zepto", "bigbasket"]);
        return res.status(400).json({ error: "Currently only Jio Mart, Blinkit, Amazon, Swiggy, FlipKart, Zepto, and BigBasket inventory are supported" });
      }

      if (platform === "amazon") {
        if (!["jm", "jw"].includes(businessUnit)) {
          return res.status(400).json({ error: "Business unit must be jm (Jivo Mart) or jw (Jivo Wellness) for Amazon" });
        }
      } else {
        if (businessUnit !== "jm") {
          return res.status(400).json({ error: "Business unit must be jm (Jivo Mart)" });
        }
      }

      if (!["daily", "range"].includes(periodType)) {
        return res.status(400).json({ error: "Period type must be either daily or range" });
      }

      // Preview should always be allowed - no duplicate checking for preview

      // Store the file for attachment
      const attachmentPath = `uploads/${Date.now()}_${req.file.originalname}`;

      let parsedData;

      try {
        if (platform === "jiomart") {
          parsedData = await parseJioMartInventoryCsv(
            req.file.buffer.toString('utf8'),
            businessUnit,
            periodType,
            reportDate,
            periodStart,
            periodEnd
          );
          
          // Add attachment path to all items
          const itemsWithAttachment = parsedData.items.map(item => ({
            ...item,
            attachment_path: attachmentPath
          }));
          
          parsedData = {
            ...parsedData,
            items: itemsWithAttachment
          };
        } else if (platform === "blinkit") {
          parsedData = await parseBlinkitInventoryCsv(
            req.file.buffer.toString('utf8'),
            businessUnit,
            periodType,
            reportDate ? new Date(reportDate) : new Date(),
            periodStart ? new Date(periodStart + 'T00:00:00.000Z') : null,
            periodEnd ? new Date(periodEnd + 'T23:59:59.999Z') : null
          );
          
          // Add attachment path to all items
          const itemsWithAttachment = parsedData.items.map(item => ({
            ...item,
            attachment_path: attachmentPath
          }));
          
          parsedData = {
            ...parsedData,
            items: itemsWithAttachment
          };
        } else if (platform === "amazon") {
          parsedData = await parseAmazonInventoryFile(
            req.file.buffer,
            req.file.originalname,
            businessUnit,
            periodType,
            reportDate ? new Date(reportDate) : new Date(),
            periodStart ? new Date(periodStart + 'T00:00:00.000Z') : null,
            periodEnd ? new Date(periodEnd + 'T23:59:59.999Z') : null
          );
          
          // Add attachment path to all items
          const itemsWithAttachment = parsedData.items.map(item => ({
            ...item,
            attachment_path: attachmentPath
          }));
          
          parsedData = {
            ...parsedData,
            items: itemsWithAttachment
          };
        } else if (platform === "swiggy") {
          console.log("Processing Swiggy inventory preview...");
          const { parseSwiggyInventoryCsv } = await import("./swiggy-inventory-parser");
          parsedData = parseSwiggyInventoryCsv(
            req.file.buffer.toString('utf8'),
            businessUnit,
            periodType,
            reportDate ? new Date(reportDate) : undefined,
            periodStart ? new Date(periodStart + 'T00:00:00.000Z') : undefined,
            periodEnd ? new Date(periodEnd + 'T23:59:59.999Z') : undefined
          );
          
          // Add attachment path to all items
          const itemsWithAttachment = parsedData.items.map(item => ({
            ...item,
            attachment_path: attachmentPath
          }));
          
          parsedData = {
            ...parsedData,
            items: itemsWithAttachment
          };
        } else if (platform === "flipkart") {
          console.log("Processing FlipKart inventory preview...");
          const flipkartItems = parseFlipkartInventoryCSV(
            req.file.buffer.toString('utf8'),
            attachmentPath,
            reportDate ? new Date(reportDate) : new Date()
          );

          parsedData = {
            platform: "FlipKart",
            businessUnit: businessUnit.toUpperCase(),
            periodType: periodType,
            reportDate: reportDate ? new Date(reportDate) : new Date(),
            totalItems: flipkartItems.length,
            items: flipkartItems,
            summary: {
              totalWarehouses: [...new Set(flipkartItems.map(item => item.warehouseId).filter(Boolean))].length,
              totalBrands: [...new Set(flipkartItems.map(item => item.brand).filter(Boolean))].length,
              totalLiveProducts: flipkartItems.filter(item => item.liveOnWebsite && item.liveOnWebsite > 0).length,
              totalSalesValue: flipkartItems.reduce((sum, item) => sum + (parseFloat(item.flipkartSellingPrice?.toString() || '0') * (item.sales30D || 0)), 0)
            }
          };
          
          console.log(`Successfully parsed ${flipkartItems.length} FlipKart inventory records`);
        } else if (platform === "zepto") {
          console.log("Processing Zepto inventory preview...");
          const zeptoResult = parseZeptoInventory(
            req.file.buffer.toString('utf8'),
            reportDate ? new Date(reportDate) : new Date(),
            periodStart,
            periodEnd
          );

          parsedData = {
            platform: "Zepto",
            businessUnit: businessUnit.toUpperCase(),
            periodType: periodType,
            reportDate: reportDate ? new Date(reportDate) : new Date(),
            totalItems: zeptoResult.summary.totalRecords,
            items: periodType === "daily" ? zeptoResult.dailyData : zeptoResult.rangeData,
            summary: {
              totalRecords: zeptoResult.summary.totalRecords,
              totalUnits: zeptoResult.summary.totalUnits,
              uniqueCities: zeptoResult.summary.uniqueCities,
              uniqueSKUs: zeptoResult.summary.uniqueSKUs
            }
          };
          
          console.log(`Successfully parsed ${zeptoResult.summary.totalRecords} Zepto inventory records`);
        } else if (platform === "bigbasket") {
          console.log("Processing BigBasket inventory preview...");
          const { parseBigBasketInventoryCsv } = await import('./bigbasket-inventory-parser');
          const bigbasketItems = parseBigBasketInventoryCsv(req.file.buffer.toString('utf8'));

          const summary = {
            totalProducts: bigbasketItems.length,
            totalSOH: bigbasketItems.reduce((sum, item) => sum + item.soh, 0),
            totalSOHValue: bigbasketItems.reduce((sum, item) => sum + item.soh_value, 0),
            uniqueCities: new Set(bigbasketItems.map(item => item.city)).size,
            uniqueBrands: new Set(bigbasketItems.map(item => item.brand_name)).size
          };

          parsedData = {
            platform: "BigBasket",
            businessUnit: businessUnit.toUpperCase(),
            periodType: periodType,
            reportDate: reportDate ? new Date(reportDate) : new Date(),
            totalItems: bigbasketItems.length,
            items: bigbasketItems.map(item => ({ ...item, attachment_path: attachmentPath })),
            summary
          };

          console.log(`Successfully parsed ${bigbasketItems.length} BigBasket inventory records`);
        }

        if (!parsedData) {
          return res.status(400).json({ error: "Unsupported platform" });
        }

        if (!parsedData.items || parsedData.items.length === 0) {
          return res.status(400).json({ error: "No valid inventory data found in file" });
        }

        res.json(parsedData);

      } catch (parseError: any) {
        console.error("Parse error:", parseError);
        return res.status(400).json({ 
          error: "Failed to parse inventory file", 
          details: parseError.message 
        });
      }

    } catch (error: any) {
      console.error("Error previewing inventory:", error);
      res.status(500).json({ error: "Failed to preview inventory data" });
    }
  });

  // Inventory File Import Route
  app.post("/api/inventory/import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { platform, businessUnit, periodType, startDate, endDate, fileHash } = req.body;

      if (!platform || !businessUnit || !periodType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!["daily", "range"].includes(periodType)) {
        return res.status(400).json({ error: "Period type must be either daily or range" });
      }

      // Check for duplicate file if hash is provided
      if (fileHash) {
        const isDuplicate = await checkForDuplicateInventoryFile(fileHash, platform, businessUnit, periodType);
        if (isDuplicate) {
          return res.status(409).json({ 
            error: "Duplicate Import Detected", 
            message: `This exact file has already been imported for ${platform.charAt(0).toUpperCase() + platform.slice(1)} ${businessUnit.toUpperCase()} ${periodType} inventory. The data is already in your database. You can preview the file or upload a different file.`,
            details: {
              platform: platform.charAt(0).toUpperCase() + platform.slice(1),
              businessUnit: businessUnit.toUpperCase(),
              periodType: periodType.charAt(0).toUpperCase() + periodType.slice(1),
              fileHash: fileHash.substring(0, 8) + "...",
              uploadType: "Inventory Import",
              suggestion: "Try uploading a different file or switch to a different period type"
            }
          });
        }
      }

      // Store the file for attachment
      const attachmentPath = `uploads/${Date.now()}_${req.file.originalname}`;

      let parsedData;
      const reportDate = new Date();
      // Fix timezone issue: Create dates without timezone conversion
      const periodStart = startDate ? createDateFromYMDString(startDate) : null;
      const periodEnd = endDate ? createEndDateFromYMDString(endDate) : null;

      try {
        if (platform === "jiomart") {
          parsedData = await parseJioMartInventoryCsv(
            req.file.buffer.toString('utf8'),
            businessUnit,
            periodType,
            reportDate,
            periodStart,
            periodEnd
          );
        } else if (platform === "blinkit") {
          parsedData = await parseBlinkitInventoryCsv(
            req.file.buffer.toString('utf8'),
            businessUnit,
            periodType,
            reportDate,
            periodStart,
            periodEnd
          );
        } else if (platform === "amazon") {
          parsedData = await parseAmazonInventoryFile(
            req.file.buffer,
            req.file.originalname,
            businessUnit,
            periodType,
            reportDate,
            periodStart,
            periodEnd
          );
        } else if (platform === "swiggy") {
          console.log("Processing Swiggy inventory file...");
          const { parseSwiggyInventoryCsv } = await import("./swiggy-inventory-parser");
          parsedData = parseSwiggyInventoryCsv(
            req.file.buffer.toString('utf8'),
            businessUnit,
            periodType,
            reportDate,
            periodStart,
            periodEnd
          );
          console.log("Swiggy parsing completed, data:", parsedData ? 'Success' : 'Failed');
        } else if (platform === "flipkart") {
          console.log("Processing FlipKart inventory file...");
          const flipkartItems = parseFlipkartInventoryCSV(
            req.file.buffer.toString('utf8'),
            attachmentPath,
            reportDate
          );

          parsedData = {
            platform: "FlipKart",
            businessUnit: businessUnit.toUpperCase(),
            periodType: periodType,
            reportDate: reportDate,
            totalItems: flipkartItems.length,
            items: flipkartItems
          };
          console.log("FlipKart parsing completed, data:", parsedData ? 'Success' : 'Failed');
        } else if (platform === "zepto") {
          console.log("Processing Zepto inventory file...");
          const zeptoResult = parseZeptoInventory(
            req.file.buffer.toString('utf8'),
            reportDate,
            periodStart || undefined,
            periodEnd || undefined
          );

          parsedData = {
            platform: "Zepto", 
            businessUnit: businessUnit.toUpperCase(),
            periodType: periodType,
            reportDate: reportDate,
            totalItems: zeptoResult.summary.totalRecords,
            items: periodType === "daily" ? zeptoResult.dailyData : zeptoResult.rangeData
          };
          console.log("Zepto parsing completed, data:", parsedData ? 'Success' : 'Failed');
        } else if (platform === "bigbasket") {
          console.log("Processing BigBasket inventory file...");
          const { parseBigBasketInventoryCsv } = await import('./bigbasket-inventory-parser');
          const bigbasketItems = parseBigBasketInventoryCsv(req.file.buffer.toString('utf8'));

          const summary = {
            totalProducts: bigbasketItems.length,
            totalSOH: bigbasketItems.reduce((sum, item) => sum + item.soh, 0),
            totalSOHValue: bigbasketItems.reduce((sum, item) => sum + item.soh_value, 0),
            uniqueCities: new Set(bigbasketItems.map(item => item.city)).size,
            uniqueBrands: new Set(bigbasketItems.map(item => item.brand_name)).size
          };

          parsedData = {
            platform: "BigBasket", 
            businessUnit: businessUnit.toUpperCase(),
            periodType: periodType,
            reportDate: reportDate,
            totalItems: bigbasketItems.length,
            items: bigbasketItems,
            summary
          };
          console.log("BigBasket parsing completed, data:", parsedData ? 'Success' : 'Failed');
        }

        if (!parsedData) {
          return res.status(400).json({ error: "Unsupported platform" });
        }

        if (!parsedData.items || parsedData.items.length === 0) {
          return res.status(400).json({ error: "No valid inventory data found in file" });
        }

        let insertedItems;
        let tableName;

        // Process inventory data with proper date handling
        const inventoryItemsWithDates = parsedData.items.map((item: any) => {
          // Parse last_updated_at date safely
          let lastUpdatedAt = null;
          if (item.last_updated_at) {
            const parsedDate = new Date(item.last_updated_at);
            if (!isNaN(parsedDate.getTime())) {
              lastUpdatedAt = parsedDate;
            }
          }

          return {
            ...item,
            last_updated_at: lastUpdatedAt,
            report_date: periodType === "daily" ? reportDate : undefined,
            period_start: periodStart,
            period_end: periodEnd,
            attachment_path: attachmentPath
          };
        });

        if (platform === "jiomart" && businessUnit === "jm" && periodType === "daily") {
          insertedItems = await storage.createInventoryJioMartJmDaily(inventoryItemsWithDates as any);
          tableName = "INV_JioMart_JM_Daily";
        } else if (platform === "jiomart" && businessUnit === "jm" && periodType === "range") {
          insertedItems = await storage.createInventoryJioMartJmRange(inventoryItemsWithDates as any);
          tableName = "INV_JioMart_JM_Range";
        } else if (platform === "blinkit" && businessUnit === "jm" && periodType === "daily") {
          insertedItems = await storage.createInventoryBlinkitJmDaily(inventoryItemsWithDates as any);
          tableName = "INV_Blinkit_JM_Daily";
        } else if (platform === "blinkit" && businessUnit === "jm" && periodType === "range") {
          insertedItems = await storage.createInventoryBlinkitJmRange(inventoryItemsWithDates as any);
          tableName = "INV_Blinkit_JM_Range";
        } else if (platform === "amazon" && businessUnit === "jm" && periodType === "daily") {
          insertedItems = await storage.createInventoryAmazonJmDaily(inventoryItemsWithDates as any);
          tableName = "INV_Amazon_JM_Daily";
        } else if (platform === "amazon" && businessUnit === "jm" && periodType === "range") {
          insertedItems = await storage.createInventoryAmazonJmRange(inventoryItemsWithDates as any);
          tableName = "INV_Amazon_JM_Range";
        } else if (platform === "amazon" && businessUnit === "jw" && periodType === "daily") {
          insertedItems = await storage.createInventoryAmazonJwDaily(inventoryItemsWithDates as any);
          tableName = "INV_Amazon_JW_Daily";
        } else if (platform === "amazon" && businessUnit === "jw" && periodType === "range") {
          insertedItems = await storage.createInventoryAmazonJwRange(inventoryItemsWithDates as any);
          tableName = "INV_Amazon_JW_Range";
        } else if (platform === "swiggy" && businessUnit === "jm" && periodType === "daily") {
          insertedItems = await storage.createInventorySwiggyJmDaily(inventoryItemsWithDates as any);
          tableName = "INV_Swiggy_JM_Daily";
        } else if (platform === "swiggy" && businessUnit === "jm" && periodType === "range") {
          insertedItems = await storage.createInventorySwiggyJmRange(inventoryItemsWithDates as any);
          tableName = "INV_Swiggy_JM_Range";
        } else if (platform === "flipkart" && businessUnit === "jm" && periodType === "daily") {
          insertedItems = await storage.createInventoryFlipkartJmDaily(inventoryItemsWithDates as any);
          tableName = "INV_FlipKart_JM_Daily";
        } else if (platform === "flipkart" && businessUnit === "jm" && periodType === "range") {
          insertedItems = await storage.createInventoryFlipkartJmRange(inventoryItemsWithDates as any);
          tableName = "INV_FlipKart_JM_Range";
        } else if (platform === "zepto" && businessUnit === "jm" && periodType === "daily") {
          insertedItems = await storage.createInventoryZeptoJmDaily(inventoryItemsWithDates as any);
          tableName = "INV_Zepto_JM_Daily";
        } else if (platform === "zepto" && businessUnit === "jm" && periodType === "range") {
          insertedItems = await storage.createInventoryZeptoJmRange(inventoryItemsWithDates as any);
          tableName = "INV_Zepto_JM_Range";
        } else if (platform === "bigbasket" && businessUnit === "jm" && periodType === "daily") {
          insertedItems = await storage.createInventoryBigBasketJmDaily(inventoryItemsWithDates as any);
          tableName = "INV_BigBasket_JM_Daily";
        } else if (platform === "bigbasket" && businessUnit === "jm" && periodType === "range") {
          insertedItems = await storage.createInventoryBigBasketJmRange(inventoryItemsWithDates as any);
          tableName = "INV_BigBasket_JM_Range";
        }

        if (!insertedItems) {
          return res.status(400).json({ error: "Invalid business unit and period type combination" });
        }

        // Track successful file upload if hash is provided
        if (fileHash) {
          await trackFileUpload(
            fileHash, 
            req.file.originalname, 
            platform, 
            businessUnit, 
            periodType, 
            'inventory', 
            req.file.size
          );
        }

        res.status(201).json({
          success: true,
          platform,
          businessUnit,
          periodType,
          targetTable: tableName,
          importedCount: insertedItems.length,
          summary: parsedData.summary,
          reportDate: reportDate.toISOString(),
          periodStart: periodStart?.toISOString(),
          periodEnd: periodEnd?.toISOString()
        });

      } catch (parseError: any) {
        console.error("Parse error:", parseError);
        return res.status(400).json({ 
          error: "Failed to process inventory data", 
          details: parseError.message 
        });
      }

    } catch (error: any) {
      console.error("Error importing inventory:", error);
      if (error.message && error.message.includes("unique")) {
        res.status(409).json({ error: "Duplicate inventory data detected" });
      } else {
        res.status(500).json({ error: "Failed to import inventory data" });
      }
    }
  });

  // Legacy Inventory Import Route (for data object)
  app.post("/api/inventory/import/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      const { data, attachment_path } = req.body;

      if (!data || !data.items || data.items.length === 0) {
        return res.status(400).json({ error: "No data to import" });
      }

      if (platform !== "jiomart") {
        return res.status(400).json({ error: "Currently only Jio Mart inventory is supported" });
      }

      let insertedItems;
      let tableName;

      try {
        // Process inventory data with proper date handling
        const inventoryItemsWithDates = data.items.map((item: any) => {
          // Parse last_updated_at date safely
          let lastUpdatedAt = null;
          if (item.last_updated_at) {
            const parsedDate = new Date(item.last_updated_at);
            if (!isNaN(parsedDate.getTime())) {
              lastUpdatedAt = parsedDate;
            }
          }

          // Parse report date for daily, period dates for range
          let reportDate = new Date();
          let periodStart = null;
          let periodEnd = null;

          if (data.periodType === "daily" && data.reportDate) {
            const parsedReportDate = new Date(data.reportDate);
            if (!isNaN(parsedReportDate.getTime())) {
              reportDate = parsedReportDate;
            }
          } else if (data.periodType === "range") {
            if (data.periodStart) {
              const parsedPeriodStart = new Date(data.periodStart);
              if (!isNaN(parsedPeriodStart.getTime())) {
                periodStart = parsedPeriodStart;
              }
            }
            if (data.periodEnd) {
              const parsedPeriodEnd = new Date(data.periodEnd);
              if (!isNaN(parsedPeriodEnd.getTime())) {
                periodEnd = parsedPeriodEnd;
              }
            }
          }

          return {
            ...item,
            last_updated_at: lastUpdatedAt,
            report_date: data.periodType === "daily" ? reportDate : undefined,
            period_start: periodStart,
            period_end: periodEnd,
            attachment_path: attachment_path || item.attachment_path
          };
        });

        if (data.businessUnit === "jm" && data.periodType === "daily") {
          insertedItems = await storage.createInventoryJioMartJmDaily(inventoryItemsWithDates as any);
          tableName = "INV_JioMart_JM_Daily";
        } else if (data.businessUnit === "jm" && data.periodType === "range") {
          insertedItems = await storage.createInventoryJioMartJmRange(inventoryItemsWithDates as any);
          tableName = "INV_JioMart_JM_Range";
        }

        if (!insertedItems) {
          return res.status(400).json({ error: "Invalid business unit and period type combination" });
        }

        res.status(201).json({
          success: true,
          platform: data.platform,
          businessUnit: data.businessUnit,
          periodType: data.periodType,
          tableName,
          totalItems: insertedItems.length,
          summary: data.summary,
          reportDate: data.reportDate,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd
        });

      } catch (parseError: any) {
        console.error("Parse error:", parseError);
        return res.status(400).json({ 
          error: "Failed to process inventory data", 
          details: parseError.message 
        });
      }

    } catch (error: any) {
      console.error("Error importing inventory:", error);
      if (error.message && error.message.includes("unique")) {
        res.status(409).json({ error: "Duplicate inventory data detected" });
      } else {
        res.status(500).json({ error: "Failed to import inventory data" });
      }
    }
  });

  app.put("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { header, items } = req.body;
      
      const updatedInventory = await storage.updateInventory(id, header, items);
      res.json(updatedInventory);
    } catch (error) {
      console.error("Error updating inventory:", error);
      res.status(500).json({ error: "Failed to update inventory" });
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInventory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inventory:", error);
      res.status(500).json({ error: "Failed to delete inventory" });
    }
  });

  // Object Storage routes
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof (await import("./objectStorage")).ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // SQL Query endpoints
  app.get('/api/sql-query/tables', async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);
      
      const tables = result.rows.map((row: any) => row.table_name);
      res.json(tables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      res.status(500).json({ error: 'Failed to fetch database tables' });
    }
  });

  app.post('/api/sql-query/execute', async (req, res) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query is required and must be a string' });
      }

      // Security: Only allow SELECT statements
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery.startsWith('select')) {
        return res.status(400).json({ 
          error: 'Only SELECT statements are allowed for security reasons' 
        });
      }

      // Prevent dangerous keywords
      const dangerousKeywords = ['drop', 'delete', 'update', 'insert', 'alter', 'create', 'truncate'];
      for (const keyword of dangerousKeywords) {
        if (trimmedQuery.includes(keyword)) {
          return res.status(400).json({ 
            error: `Query contains forbidden keyword: ${keyword.toUpperCase()}` 
          });
        }
      }

      const startTime = performance.now();
      const result = await db.execute(sql.raw(query));
      const executionTime = Math.round(performance.now() - startTime);

      // Format results for frontend consumption
      const columns = result.fields ? result.fields.map(field => field.name) : [];
      const rows = result.rows.map(row => 
        columns.map(col => row[col] ?? null)
      );

      res.json({
        columns,
        rows,
        rowCount: result.rows.length,
        executionTime
      });

    } catch (error: any) {
      console.error('SQL Query execution error:', error);
      res.status(400).json({ 
        error: error.message || 'Query execution failed' 
      });
    }
  });

  // Claude Code API endpoints
  app.post('/api/claude-code/query', async (req, res) => {
    try {
      const { claudeCodeWrapper } = await import('./claude-code-wrapper');
      const { prompt, workingDirectory, timeout, allowedTools, model } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required and must be a string' });
      }

      const result = await claudeCodeWrapper.executeQuery(prompt, {
        workingDirectory,
        timeout: timeout || 30000,
        allowedTools,
        model
      });

      res.json(result);
    } catch (error: any) {
      console.error('Claude Code query error:', error);
      res.status(500).json({ 
        error: 'Failed to execute Claude Code query',
        details: error.message 
      });
    }
  });

  app.get('/api/claude-code/status', async (req, res) => {
    try {
      const { claudeCodeWrapper } = await import('./claude-code-wrapper');
      const status = await claudeCodeWrapper.getAuthStatus();
      res.json({ status });
    } catch (error: any) {
      console.error('Claude Code status error:', error);
      res.status(500).json({ 
        error: 'Failed to check Claude Code status',
        details: error.message 
      });
    }
  });

  app.get('/api/claude-code/setup', async (req, res) => {
    try {
      const { claudeCodeWrapper } = await import('./claude-code-wrapper');
      const instructions = claudeCodeWrapper.getSetupInstructions();
      res.json({ instructions });
    } catch (error: any) {
      console.error('Claude Code setup error:', error);
      res.status(500).json({ 
        error: 'Failed to get setup instructions',
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  

  
  return httpServer;
}
