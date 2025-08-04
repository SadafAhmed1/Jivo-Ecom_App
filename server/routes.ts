import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPfPoSchema, insertPfOrderItemsSchema } from "@shared/schema";
import { z } from "zod";
import { seedTestData } from "./seed-data";

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

  const httpServer = createServer(app);
  return httpServer;
}
