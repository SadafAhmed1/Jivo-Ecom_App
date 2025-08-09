import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPfPoSchema, insertPfOrderItemsSchema, insertFlipkartGroceryPoHeaderSchema, insertFlipkartGroceryPoLinesSchema } from "@shared/schema";
import { z } from "zod";
import { seedTestData } from "./seed-data";
import { parseFlipkartGroceryPO, parseZeptoPO, parseCityMallPO, parseBlinkitPO } from "./csv-parser";
import { parseSwiggyPO } from "./swiggy-parser";
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

      const { header, lines } = parseBlinkitPO(req.file.buffer, "system");
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
      
      const zeptoPo = await storage.getZeptoPoById(id);
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

      // Try to detect vendor and parse accordingly
      const filename = req.file.originalname.toLowerCase();
      
      try {
        if (filename.includes('flipkart') || filename.includes('grocery')) {
          detectedVendor = "flipkart";
          parsedData = await parseFlipkartGroceryPO(req.file.buffer, uploadedBy);
        } else if (filename.includes('zepto')) {
          detectedVendor = "zepto";
          parsedData = parseZeptoPO(req.file.buffer.toString('utf-8'), uploadedBy);
        } else if (filename.includes('city') || filename.includes('mall')) {
          detectedVendor = "citymall";
          parsedData = await parseCityMallPO(req.file.buffer, uploadedBy);
        } else if (filename.includes('blinkit')) {
          detectedVendor = "blinkit";
          console.log("Processing Blinkit file with multiple POs...");
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
            { name: "flipkart", parser: parseFlipkartGroceryPO },
            { name: "zepto", parser: (buffer: Buffer, user: string) => parseZeptoPO(buffer.toString('utf-8'), user) },
            { name: "citymall", parser: parseCityMallPO },
            { name: "blinkit", parser: (buffer: Buffer, user: string) => {
              const result = parseBlinkitPO(buffer, user);
              // Convert multiple PO structure to single PO for fallback detection
              return result.poList.length > 0 ? result.poList[0] : { header: {}, lines: [] };
            } },
            { name: "swiggy", parser: parseSwiggyPO }
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
          const amount = parseFloat(line.total_amount || line.line_total || '0');
          return sum + amount;
        }, 0);

        // Clean header data for display
        let displayHeader = { ...parsedData.header };
        
        // Fix vendor_name display for Swiggy - if it contains payment terms or dates, set to null
        if (detectedVendor === "swiggy") {
          // Force vendor_name to null for Swiggy since the data is corrupted
          displayHeader.vendor_name = null;
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
        return res.status(400).json({ error: "po no is not available please check you upload po" });
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
          return res.status(400).json({ error: "po is already exist" });
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
          createdPo = await storage.createFlipkartGroceryPo(cleanHeader, cleanLines);
          break;
        case "zepto":
          createdPo = await storage.createZeptoPo(cleanHeader, cleanLines);
          break;
        case "citymall":
          createdPo = await storage.createCityMallPo(cleanHeader, cleanLines);
          break;
        case "blinkit":
          createdPo = await storage.createBlinkitPo(cleanHeader, cleanLines);
          break;
        case "swiggy":
          createdPo = await storage.createSwiggyPo(cleanHeader, cleanLines);
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

  const httpServer = createServer(app);
  return httpServer;
}
