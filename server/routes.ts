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

import multer from 'multer';

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

      if (!["amazon"].includes(platform)) {
        return res.status(400).json({ error: "Only Amazon platform is supported" });
      }

      if (!["jivo-wellness", "jivo-mart"].includes(businessUnit)) {
        return res.status(400).json({ error: "Business unit must be either jivo-wellness or jivo-mart" });
      }

      if (!["daily", "date-range"].includes(periodType)) {
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
        }

        if (!parsedData) {
          return res.status(400).json({ error: "Unsupported platform" });
        }

        if (!parsedData.items || parsedData.items.length === 0) {
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
          items: parsedData.items.slice(0, 10) // Preview first 10 items
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

      if (!["amazon"].includes(platform)) {
        return res.status(400).json({ error: "Only Amazon platform is supported" });
      }

      if (!["jivo-wellness", "jivo-mart"].includes(businessUnit)) {
        return res.status(400).json({ error: "Business unit must be either jivo-wellness or jivo-mart" });
      }

      if (!["daily", "date-range"].includes(periodType)) {
        return res.status(400).json({ error: "Period type must be either daily or date-range" });
      }

      if (periodType === "date-range" && (!startDate || !endDate)) {
        return res.status(400).json({ error: "Start date and end date are required for date-range period type" });
      }

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
          attachmentPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
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
        }

        if (!parsedData) {
          return res.status(400).json({ error: "Unsupported platform" });
        }

        if (!parsedData.items || parsedData.items.length === 0) {
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

  const httpServer = createServer(app);
  return httpServer;
}
