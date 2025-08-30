import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { callSpGetItemDetails, callSpGetItemNames } from "./sqlserver";
import { sqlServerService } from "./sql-service";
import { setupAuth } from "./auth";
import { 
  createPurchaseOrderAgent,
  getPlatformsAgent,
  getDistributorsAgent,
  searchPlatformItemsAgent,
  getOrderAnalyticsAgent,
  healthCheckAgent,
  validatePOAgent
} from "./agent-routes";
import {
  sqlHealthCheck,
  getSqlStatus,
  getItemDetails,
  getHanaItems,
  searchHanaItems,
  searchItems,
  getPlatformItems,
  executeQuery,
  executeStoredProcedure,
  getTableInfo,
  getPerformanceStats
} from "./sql-routes";
import {
  testHanaConnection,
  testStoredProcedure,
  getHanaItems as getHanaItemsTest,
  searchHanaItems as searchHanaItemsTest,
  executeRawProcedure
} from "./hana-test-routes";

import { insertPfPoSchema, insertPfOrderItemsSchema, insertFlipkartGroceryPoHeaderSchema, insertFlipkartGroceryPoLinesSchema, insertDistributorMstSchema, insertDistributorPoSchema, insertDistributorOrderItemsSchema, insertPoMasterSchema, insertPoLinesSchema, distributors } from "@shared/schema";
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
import { sql, eq } from "drizzle-orm";
import { pfPo, poMaster } from "@shared/schema";
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

// Unified PO Master schema for the new system
const createPoMasterSchema = z.object({
  master: insertPoMasterSchema.extend({
    po_date: z.string().transform(str => new Date(str)),
    expiry_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
    appointment_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
    platform_id: z.number(),
  }),
  lines: z.array(insertPoLinesSchema)
});

const updatePoMasterSchema = z.object({
  master: insertPoMasterSchema.partial().extend({
    po_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
    expiry_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
    appointment_date: z.string().optional().transform(str => str ? new Date(str) : undefined),
    platform_id: z.number().optional(),
  }),
  lines: z.array(insertPoLinesSchema).optional()
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
  // Setup authentication first
  setupAuth(app);
  // Platform routes
  app.get("/api/platforms", async (_req, res) => {
    try {
      const platforms = await storage.getAllPlatforms();
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });

  // Get dispatch locations from po_master table dispatch_from column
  app.get("/api/dispatch-locations", async (_req, res) => {
    try {
      const locations = await storage.getUniqueDispatchLocations();
      // Return unique dispatch locations from existing POs
      const dispatchLocations = locations.map((location, index) => ({
        id: index + 1,
        name: location
      }));
      res.json(dispatchLocations);
    } catch (error) {
      console.error("Error fetching dispatch locations:", error);
      res.status(500).json({ message: "Failed to fetch dispatch locations" });
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

  // Get item details - SIMPLIFIED: Use local items table only
  app.get("/api/item-details", async (req, res) => {
    console.log("=== API /api/item-details called ===");
    console.log("Query params:", req.query);
    try {
      const { itemName, itemCode } = req.query;
      console.log("Getting item details for:", { itemName, itemCode });
      
      let localItem: any = null;
      
      // First try to find by itemcode if provided
      if (itemCode && typeof itemCode === 'string') {
        localItem = await storage.getItemByCode(itemCode);
        console.log("Search by itemcode result:", localItem ? "Found" : "Not found");
      }
      
      // If not found by code and itemName provided, search by name
      if (!localItem && itemName && typeof itemName === 'string') {
        localItem = await storage.getItemByName(itemName);
        console.log("Search by itemname result:", localItem ? "Found" : "Not found");
      }
      
      // Convert to expected format for backward compatibility
      let itemDetails: any[] = [];
      if (localItem) {
        itemDetails = [{
          ItemCode: localItem.itemcode,
          ItemName: localItem.itemname,
          ItmsGrpNam: localItem.itmsgrpnam || localItem.ItemGroup || null,
          U_TYPE: localItem.u_type || null,
          U_Variety: localItem.u_variety || null,
          U_Sub_Group: localItem.u_sub_group || null,
          U_Brand: localItem.u_brand || null,
          InvntryUom: localItem.invntryuom || null,
          U_Tax_Rate: localItem.u_tax_rate?.toString() || null,
          U_IsLitre: localItem.u_islitre || 'N',
          SalPackUn: localItem.salpackun || null,
          // Additional fields that might be expected
          ItemGroup: localItem.itmsgrpnam,
          SubGroup: localItem.u_sub_group,
          Brand: localItem.u_brand,
          UnitOfMeasure: localItem.invntryuom,
          UOM: localItem.invntryuom,
          TaxRate: localItem.u_tax_rate ? parseFloat(localItem.u_tax_rate) : null,
          CasePack: localItem.salpackun,
          IsLitre: localItem.u_islitre === 'Y'
        }];
        console.log("Successfully formatted item details");
      }
      
      res.json(itemDetails);
    } catch (error: any) {
      console.error("Error in /api/item-details:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all item names for search - SIMPLIFIED: Use local items table only
  app.get("/api/item-names", async (req, res) => {
    console.log("=== API /api/item-names called ===");
    try {
      const { search } = req.query;
      console.log("Search term:", search);
      
      let filteredItems: any[] = [];
      
      if (search && typeof search === 'string' && search.length >= 2) {
        // Search in PostgreSQL items table
        console.log("Searching in PostgreSQL items table...");
        const localItems = await storage.searchItems(search);
        console.log(`Found ${localItems.length} items in local database`);
        
        // Convert to expected format for backward compatibility
        filteredItems = localItems.map(item => ({
          ItemName: item.itemname,
          ItemCode: item.itemcode
        }));
      } else {
        // For short queries, return empty array or get recent items
        if (search && typeof search === 'string' && search.length > 0) {
          filteredItems = [];
        } else {
          // Get some recent items if no search term
          const recentItems = await storage.getAllItems();
          filteredItems = recentItems.slice(0, 50).map(item => ({
            ItemName: item.itemname,
            ItemCode: item.itemcode
          }));
        }
      }
      
      // Apply additional filtering and scoring if needed
      if (search && typeof search === 'string' && search.length > 0) {
        const searchTerm = search.toLowerCase().trim();
        const searchWords = searchTerm.split(/\s+/);
        
        filteredItems = filteredItems
          .filter(item => item.ItemName && item.ItemName.trim())
          .map(item => {
            const itemName = item.ItemName.toLowerCase();
            let score = 0;
            
            // Exact match gets highest score
            if (itemName === searchTerm) {
              score = 1000;
            }
            // Starts with search term gets high score
            else if (itemName.startsWith(searchTerm)) {
              score = 800;
            }
            // All words found gets good score
            else if (searchWords.every(word => itemName.includes(word))) {
              score = 600;
              // Bonus for consecutive words
              if (itemName.includes(searchTerm)) {
                score += 100;
              }
            }
            // Some words found
            else {
              const foundWords = searchWords.filter(word => itemName.includes(word));
              score = (foundWords.length / searchWords.length) * 400;
            }
            
            // Boost shorter names (more likely to be relevant)
            if (score > 0) {
              const lengthBonus = Math.max(0, 50 - itemName.length);
              score += lengthBonus;
            }
            
            return { ...item, searchScore: score };
          })
          .filter(item => item.searchScore > 0)
          .sort((a, b) => b.searchScore - a.searchScore)
          .slice(0, 15); // Limit to 15 best results
      }
      
      console.log("Retrieved item names:", filteredItems?.length || 0, "items");
      res.json(filteredItems);
    } catch (error: any) {
      console.error("Error in /api/item-names:", error);
      res.status(500).json({ error: error.message });
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

  // New dynamic dropdown endpoints
  app.get("/api/states", async (_req, res) => {
    try {
      const states = await storage.getAllStates();
      res.json(states);
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ error: "Failed to fetch states" });
    }
  });

  app.get("/api/districts/:stateId", async (req, res) => {
    try {
      const stateId = parseInt(req.params.stateId);
      if (isNaN(stateId)) {
        return res.status(400).json({ error: "Invalid state ID" });
      }
      const districts = await storage.getDistrictsByStateId(stateId);
      res.json(districts);
    } catch (error) {
      console.error("Error fetching districts:", error);
      res.status(500).json({ error: "Failed to fetch districts" });
    }
  });

  // New cascading dropdown endpoints using master tables
  app.get("/api/regions", async (_req, res) => {
    try {
      console.log("🌍 API: /api/regions called");
      const regions = await storage.getAllRegions();
      console.log(`🌍 API: Returning ${regions.length} regions`);
      res.json(regions);
    } catch (error) {
      console.error("❌ API: Error fetching regions:", error);
      res.status(500).json({ error: "Failed to fetch regions" });
    }
  });

  app.get("/api/states/by-region/:regionId", async (req, res) => {
    try {
      console.log(`🏛️ API: /api/states/by-region/${req.params.regionId} called`);
      const regionId = parseInt(req.params.regionId);
      
      if (isNaN(regionId)) {
        console.log("❌ API: Invalid region ID provided");
        return res.status(400).json({ error: "Invalid region ID" });
      }
      
      console.log(`🏛️ API: Fetching states for region ID: ${regionId}`);
      const states = await storage.getStatesByRegion(regionId);
      console.log(`🏛️ API: Returning ${states.length} states for region ${regionId}`);
      res.json(states);
    } catch (error) {
      console.error("❌ API: Error fetching states by region:", error);
      res.status(500).json({ error: "Failed to fetch states by region" });
    }
  });

  app.get("/api/districts/by-state/:stateId", async (req, res) => {
    try {
      console.log(`🏘️ API: /api/districts/by-state/${req.params.stateId} called`);
      const stateId = parseInt(req.params.stateId);
      
      if (isNaN(stateId)) {
        console.log("❌ API: Invalid state ID provided");
        return res.status(400).json({ error: "Invalid state ID" });
      }
      
      console.log(`🏘️ API: Fetching districts for state ID: ${stateId}`);
      const districts = await storage.getDistrictsByStateIdFromMaster(stateId);
      console.log(`🏘️ API: Returning ${districts.length} districts for state ${stateId}`);
      res.json(districts);
    } catch (error) {
      console.error("❌ API: Error fetching districts by state:", error);
      res.status(500).json({ error: "Failed to fetch districts by state" });
    }
  });

  // Status endpoints
  app.get("/api/statuses", async (_req, res) => {
    try {
      const statuses = await storage.getAllStatuses();
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      res.status(500).json({ error: "Failed to fetch statuses" });
    }
  });

  app.get("/api/status-items", async (_req, res) => {
    try {
      const statusItems = await storage.getAllStatusItems();
      res.json(statusItems);
    } catch (error) {
      console.error("Error fetching status items:", error);
      res.status(500).json({ error: "Failed to fetch status items" });
    }
  });

  // Items endpoints
  app.get("/api/items", async (req, res) => {
    try {
      const { search, platform } = req.query;
      
      if (search && typeof search === 'string') {
        // If search query provided, search items
        const items = await storage.searchItems(search);
        res.json(items);
      } else {
        // Otherwise return all items
        const items = await storage.getAllItems();
        res.json(items);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.get("/api/items/search", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const items = await storage.searchItems(query);
      res.json(items);
    } catch (error) {
      console.error("Error searching items:", error);
      res.status(500).json({ error: "Failed to search items" });
    }
  });

  // SAP Items API routes
  app.get("/api/sap-items-api", async (_req, res) => {
    try {
      // Get all items from the items table to show in SAP sync
      const items = await storage.getAllItems();
      
      console.log(`📊 SAP Sync: Found ${items.length} items in database`);
      
      // Transform items to match the SapItem interface expected by frontend
      const sapItems = items.map((item, index) => ({
        id: index + 1, // Use index as id if not available
        itemcode: item.itemcode || item.ItemCode || '',
        itemname: item.itemname || item.ItemName || '',
        type: item.u_type || item.type || '',
        itemgroup: item.itmsgrpnam || item.itemgroup || '',
        brand: item.u_brand || item.brand || '',
        uom: item.invntryuom || item.uom || 'PCS',
        last_synced: item.updated_at || item.created_at || new Date().toISOString(),
        created_at: item.created_at || new Date().toISOString()
      }));
      
      console.log(`✅ SAP Sync: Returning ${sapItems.length} formatted items`);
      res.json(sapItems);
    } catch (error) {
      console.error("Error fetching SAP items:", error);
      res.status(500).json({ error: "Failed to fetch SAP items" });
    }
  });

  app.post("/api/sap-items-api/sync", async (_req, res) => {
    try {
      // Get all current items from the database
      const items = await storage.getAllItems();
      const count = items.length;
      
      console.log(`🔄 SAP Sync initiated: ${count} items found in database`);
      
      // If no items, return a message to indicate database needs population
      if (count === 0) {
        res.json({
          success: true,
          message: "No items found in database. Please import items first.",
          count: 0
        });
      } else {
        res.json({
          success: true,
          message: `Successfully synced ${count} items from database`,
          count: count
        });
      }
    } catch (error) {
      console.error("Error syncing SAP items:", error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Failed to sync SAP items",
        count: 0
      });
    }
  });

  // Create new PF item
  // Check for duplicate PF items
  app.get("/api/pf-items/check-duplicate", async (req, res) => {
    try {
      const { pf_id, pf_itemcode, pf_itemname } = req.query;
      
      if (!pf_id) {
        return res.status(400).json({ 
          error: "Platform ID is required",
          message: "Please provide pf_id" 
        });
      }
      
      const result = await storage.checkPFItemDuplicates({
        pf_id: parseInt(pf_id as string),
        pf_itemcode: pf_itemcode as string || '',
        pf_itemname: pf_itemname as string || ''
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error checking PF item duplicates:", error);
      res.status(500).json({ 
        error: "Failed to check duplicates",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/pf-items", async (req, res) => {
    try {
      const { pf_id, pf_itemcode, pf_itemname, sap_id } = req.body;
      
      // Validate required fields
      if (!pf_id || !pf_itemcode || !pf_itemname || !sap_id) {
        return res.status(400).json({ 
          error: "All fields are required",
          message: "Please provide pf_id, pf_itemcode, pf_itemname, and sap_id" 
        });
      }
      
      const newItem = await storage.createPFItem({
        pf_id: parseInt(pf_id),
        pf_itemcode, 
        pf_itemname,
        sap_id
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating PF item:", error);
      res.status(500).json({ 
        error: "Failed to create PF item",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get PF items for search dropdown
  app.get("/api/pf-items", async (req, res) => {
    try {
      const { search } = req.query;
      
      if (search && typeof search === 'string' && search.length >= 2) {
        const pfItems = await storage.searchPFItems(search);
        
        // Return items in format expected by the dropdown
        const formattedItems = pfItems.map(item => ({
          ItemName: item.pf_itemname,
          ItemCode: item.pf_itemcode,
          pf_id: item.pf_id,
          sap_id: item.sap_id,
          actual_itemcode: item.actual_itemcode, // Include actual item code from items table
          taxrate: item.taxrate || 0 // Include tax rate from items table
        }));
        
        res.json(formattedItems);
      } else {
        // Return empty array for short queries
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching PF items:", error);
      // Return empty array instead of error to prevent UI crashes
      res.json([]);
    }
  });

  app.get("/api/items/:itemcode", async (req, res) => {
    try {
      const { itemcode } = req.params;
      const item = await storage.getItemByCode(itemcode);
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  app.post("/api/items/sync", async (_req, res) => {
    try {
      console.log("=== Starting items sync from HANA ===");
      
      // Get items from HANA via stored procedure
      const hanaResult = await sqlServerService.getItemDetails();
      
      if (!hanaResult.success || !hanaResult.data) {
        console.warn("Failed to get items from HANA, using local data");
        return res.status(503).json({ 
          error: "HANA service unavailable", 
          syncedCount: 0 
        });
      }
      
      console.log(`Received ${hanaResult.data.length} items from HANA`);
      
      // Sync items to PostgreSQL
      const syncedCount = await storage.syncItemsFromHana(hanaResult.data);
      
      console.log(`Successfully synced ${syncedCount} items`);
      
      res.json({ 
        success: true, 
        message: `Successfully synced ${syncedCount} items from HANA`,
        syncedCount,
        totalHanaItems: hanaResult.data.length
      });
      
    } catch (error) {
      console.error("Error syncing items:", error);
      res.status(500).json({ error: "Failed to sync items from HANA" });
    }
  });

  // Migration endpoint to populate items table initially
  app.post("/api/migrate-items", async (_req, res) => {
    try {
      console.log("🔄 Starting complete items table migration from HANA...");
      
      // Clear existing items if any
      console.log("🧹 Clearing existing items table...");
      
      // Get all items from HANA via stored procedure
      console.log("📞 Calling SP_GET_ITEM_DETAILS stored procedure...");
      const hanaResult = await sqlServerService.getItemDetails();
      
      if (!hanaResult.success || !hanaResult.data) {
        console.error("❌ Failed to get items from HANA:", hanaResult.error);
        return res.status(503).json({ 
          success: false,
          error: "HANA service unavailable", 
          details: hanaResult.error
        });
      }
      
      console.log(`✅ Retrieved ${hanaResult.data.length} items from HANA`);
      console.log(`⏱️ Query execution time: ${hanaResult.executionTime}ms`);
      
      // Sync all items to PostgreSQL
      console.log("💾 Syncing all items to PostgreSQL items table...");
      const syncedCount = await storage.syncItemsFromHana(hanaResult.data);
      
      console.log(`🎉 Successfully synced ${syncedCount} items to PostgreSQL`);
      
      // Get sample items to show in response
      const sampleItems = await storage.getAllItems();
      const samples = sampleItems.slice(0, 5).map(item => ({
        itemcode: item.itemcode,
        itemname: item.itemname,
        brand: item.brand,
        itemgroup: item.itemgroup
      }));
      
      res.json({ 
        success: true, 
        message: `Items table migration completed successfully`,
        totalHanaItems: hanaResult.data.length,
        syncedCount,
        executionTimeMs: hanaResult.executionTime,
        sampleItems: samples,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("❌ Error during items table migration:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to populate items table",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/seed-status-tables", async (_req, res) => {
    try {
      await storage.seedStatusTables();
      res.json({ message: "Status tables seeded successfully" });
    } catch (error) {
      console.error("Error seeding status tables:", error);
      res.status(500).json({ error: "Failed to seed status tables" });
    }
  });

  app.post("/api/create-status-tables", async (_req, res) => {
    try {
      // Create tables with raw SQL
      await storage.createStatusTables();
      res.json({ message: "Status tables created and seeded successfully" });
    } catch (error) {
      console.error("Error creating status tables:", error);
      res.status(500).json({ error: "Failed to create status tables" });
    }
  });

  app.get("/api/check-tables", async (_req, res) => {
    try {
      const result = await storage.checkTableStructure();
      res.json(result);
    } catch (error) {
      console.error("Error checking tables:", error);
      res.status(500).json({ error: "Failed to check tables" });
    }
  });

  app.get("/api/distributors", async (_req, res) => {
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

  // Test route for POs without auth (development only)
  app.get("/api/test/pos", async (_req, res) => {
    try {
      console.log("🧪 Test route: Testing getAllPos function...");
      const pos = await storage.getAllPos();
      console.log("🧪 Test route: getAllPos returned", pos.length, "POs");
      res.json(pos);
    } catch (error) {
      console.error("🧪 Test route error:", error);
      res.status(500).json({ message: "Failed to fetch POs", error: error instanceof Error ? error.message : String(error) });
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
      
      // First try to get from po_master table (new structure)
      const poMaster = await storage.getPoMasterById(id);
      if (poMaster) {
        console.log("📋 Found PO in po_master table for ID:", id);
        console.log("📊 Raw poMaster data:", {
          id: poMaster.id,
          vendor_po_number: poMaster.vendor_po_number,
          platform_id: poMaster.platform_id,
          distributor_id: poMaster.distributor_id,
          state_id: poMaster.state_id,
          district_id: poMaster.district_id,
          region: poMaster.region,
          area: poMaster.area,
          po_date: poMaster.po_date,
          status_id: poMaster.status_id
        });
        console.log("🏢 Platform info:", poMaster.platform);
        console.log("🏪 Distributor info:", poMaster.distributor);
        console.log("🗺️ State info:", poMaster.state);
        console.log("🏘️ District info:", poMaster.district);
        console.log("📊 PO Lines count:", poMaster.poLines?.length || 0);
        console.log("📦 First few lines:", poMaster.poLines?.slice(0, 2));
        
        // Map the status IDs back to status names for the frontend
        const statusMap: Record<number, string> = {
          1: 'Open',
          2: 'Closed',
          3: 'Cancelled',
          4: 'Expired'
        };
        
        const lineStatusMap: Record<number, string> = {
          1: 'PENDING',
          2: 'INVOICED',
          3: 'DISPATCHED',
          4: 'DELIVERED',
          5: 'STOCK_ISSUE',
          6: 'PRICE_DIFF',
          7: 'MOV_ISSUE',
          8: 'CANCELLED',
          9: 'EXPIRED'
        };
        
        // Transform the data to match frontend expectations
        const transformedPo = {
          ...poMaster,
          // Map additional fields that frontend expects (these override the spread fields)
          po_number: poMaster.vendor_po_number,
          company: "JIVO MART",
          platform: poMaster.platform || { id: poMaster.platform_id },
          order_date: poMaster.po_date,
          serving_distributor: poMaster.distributor?.distributor_name || '',
          dispatch_from: poMaster.dispatch_from || '',
          region: poMaster.region || '',
          area: poMaster.area || '',
          state: poMaster.state?.statename || '',
          city: poMaster.district?.district || '',
          status: statusMap[poMaster.status_id] || 'Open',
          orderItems: poMaster.poLines?.map((line: any) => ({
            ...line,
            item_name: line.item_name || line.remark?.split(' - ')[0] || 'Unknown Item',
            platform_code: line.platform_code || line.platform_product_code_id,
            sap_code: line.sap_id || line.platform_product_code_id,
            quantity: parseInt(line.quantity || '0'),
            basic_amount: parseFloat(line.basic_amount || '0'),
            basic_rate: parseFloat(line.basic_amount || '0'),
            tax_percent: (() => {
              // Use original tax rate from items table (u_tax_rate column) if available
              if (line.original_tax_rate && parseFloat(line.original_tax_rate) > 0) {
                let taxRate = parseFloat(line.original_tax_rate);
                // If the tax rate is stored as decimal (0.18), convert to percentage (18)
                // If it's already a percentage (18), keep as is
                if (taxRate < 1) {
                  taxRate = taxRate * 100;
                  console.log(`🔍 Converting decimal tax rate from u_tax_rate: ${line.original_tax_rate} → ${taxRate}% for item ${line.item_name}`);
                } else {
                  console.log(`🔍 Using tax rate from u_tax_rate: ${taxRate}% for item ${line.item_name}`);
                }
                return taxRate;
              }
              // Fallback: calculate from tax amount and basic amount (less reliable)
              const taxAmount = parseFloat(line.tax || '0');
              const basicAmount = parseFloat(line.basic_amount || '0');
              if (basicAmount > 0 && taxAmount > 0) {
                const calculatedRate = (taxAmount / basicAmount) * 100;
                console.log(`⚠️ Calculating tax rate from amounts: ${calculatedRate.toFixed(2)}% for item ${line.item_name} (taxAmount: ${taxAmount}, basicAmount: ${basicAmount})`);
                return calculatedRate;
              }
              console.log(`❌ No tax rate found for item ${line.item_name}, defaulting to 0%`);
              return 0; // Default to 0% if we can't determine tax rate
            })(),
            gst_rate: line.tax || '0',
            landing_amount: parseFloat(line.landing_amount || '0'),
            landing_rate: line.landing_amount || '0',
            total_amount: parseFloat(line.total_amount || '0'),
            total_ltrs: parseFloat(line.total_liter || '0'),
            status: lineStatusMap[line.status] || 'PENDING',
            invoice_date: line.invoice_date,
            invoice_litre: parseFloat(line.invoice_litre || '0'),
            invoice_amount: parseFloat(line.invoice_amount || '0'),
            invoice_qty: parseFloat(line.invoice_qty || '0')
          })) || []
        };
        
        console.log("✅ Returning PO from po_master table with", transformedPo.orderItems.length, "items");
        console.log("📝 Response orderItems field exists:", !!transformedPo.orderItems);
        return res.json(transformedPo);
      }
      
      // Fall back to old structure if not found in new tables
      const po = await storage.getPoById(id);
      if (!po) {
        return res.status(404).json({ message: "PO not found" });
      }
      res.json(po);
    } catch (error) {
      console.error("Error fetching PO:", error);
      res.status(500).json({ message: "Failed to fetch PO" });
    }
  });

  // DEBUG: Get raw database data for understanding structure
  app.get("/api/pos/:id/raw", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rawData = await storage.getRawPoData(id);
      if (!rawData) {
        return res.status(404).json({ message: "PO not found" });
      }
      res.json(rawData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch raw PO data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/pos", async (req, res) => {
    console.log("🚀 HIT THE NEW PO ROUTE!");
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("Headers:", req.headers);
    console.log("Body keys:", Object.keys(req.body || {}));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    
    try {
      // Debug: Check if we have the expected data structure
      if (!req.body.master) {
        console.log("❌ Missing 'master' field in request body");
        console.log("Available fields:", Object.keys(req.body));
        return res.status(400).json({ 
          message: "Missing 'master' field in request body", 
          received: Object.keys(req.body),
          expected: ["master", "lines"]
        });
      }
      
      if (!req.body.lines) {
        console.log("❌ Missing 'lines' field in request body");
        return res.status(400).json({ 
          message: "Missing 'lines' field in request body", 
          received: Object.keys(req.body),
          expected: ["master", "lines"]
        });
      }
      
      console.log("✅ Request has correct structure");
      
      // Use existing po_master and po_lines tables
      const { master, lines } = req.body;
      console.log("✅ Using po_master and po_lines tables for creation");
      
      const createdPo = await storage.createPoInExistingTables(master, lines);
      res.status(201).json(createdPo);
    } catch (error) {
      console.error("❌ Error creating PO:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create purchase order", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/pos/:id", async (req, res) => {
    console.log("🚀 HIT THE PO UPDATE ROUTE!");
    console.log("ID:", req.params.id);
    console.log("Body keys:", Object.keys(req.body || {}));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    

    try {
      const id = parseInt(req.params.id);
      
      // Extract user info for logging
      const username = (req as any).user?.username || 'Unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
      const userAgent = req.get('User-Agent') || 'Unknown';
      const sessionId = req.sessionID || 'Unknown';
      
      // Check if this is the master/lines structure - use po_master and po_lines tables
      if (req.body.master && req.body.lines) {
        console.log("✅ Using po_master and po_lines tables for update");
        const { master, lines } = req.body;
        
        const updatedPo = await storage.updatePoInExistingTables(id, master, lines);
        
        // Log the PO update
        await storage.logEdit({
          username,
          action: 'UPDATE',
          tableName: 'po_master',
          recordId: id,
          fieldName: 'full_record',
          oldValue: 'Previous PO data',
          newValue: JSON.stringify(master),
          ipAddress,
          userAgent,
          sessionId
        });
        
        res.json(updatedPo);
      } else {
        // Fall back to direct pf_po structure
        console.log("⚠️ Using direct pf_po structure for update");
        const validatedData = updatePoSchema.parse(req.body);
        const po = await storage.updatePo(id, validatedData.po, validatedData.items);
        
        // Log the PO update
        await storage.logEdit({
          username,
          action: 'UPDATE',
          tableName: 'pf_po',
          recordId: id,
          fieldName: 'full_record',
          oldValue: 'Previous PO data',
          newValue: JSON.stringify(validatedData.po),
          ipAddress,
          userAgent,
          sessionId
        });
        
        res.json(po);
      }
    } catch (error) {
      console.error("❌ Error updating PO:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update purchase order", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Debug endpoint to check which table a PO exists in
  app.get("/api/debug/pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🔍 DEBUG: Checking which tables contain PO ID: ${id}`);
      
      const results: any = {
        id,
        tables: [],
        details: {}
      };
      
      // Check pf_po table
      try {
        const pfPoResult = await db.select().from(pfPo).where(eq(pfPo.id, id));
        if (pfPoResult.length > 0) {
          results.tables.push('pf_po');
          results.details.pf_po = pfPoResult[0];
          console.log(`✅ DEBUG: Found PO ${id} in pf_po:`, pfPoResult[0].po_number);
        }
      } catch (e) {
        console.log(`❌ DEBUG: Error checking pf_po:`, e);
      }
      
      // Check po_master table
      try {
        const poMasterResult = await db.select().from(poMaster).where(eq(poMaster.id, id));
        if (poMasterResult.length > 0) {
          results.tables.push('po_master');
          results.details.po_master = poMasterResult[0];
          console.log(`✅ DEBUG: Found PO ${id} in po_master:`, poMasterResult[0].vendor_po_number);
        }
      } catch (e) {
        console.log(`❌ DEBUG: Error checking po_master:`, e);
      }
      
      console.log(`🔍 DEBUG: PO ${id} found in tables:`, results.tables);
      res.json(results);
    } catch (error) {
      console.error(`❌ DEBUG: Error checking PO:`, error);
      res.status(500).json({ error: 'Debug check failed' });
    }
  });

  app.delete("/api/pos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🗑️ API: Starting PO deletion for ID: ${id}`);
      
      if (isNaN(id)) {
        console.error(`❌ API: Invalid PO ID: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid PO ID" });
      }

      // Get user info for logging
      const username = (req as any).user?.username || 'Unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
      const userAgent = req.get('User-Agent') || 'Unknown';
      const sessionId = req.sessionID || 'Unknown';
      
      console.log(`🔍 API: Delete request from user: ${username}, IP: ${ipAddress}`);
      
      // Try to delete from pf_po table first
      let deleted = false;
      let tableName = 'unknown';
      
      try {
        console.log(`🔍 API: Attempting to delete from pf_po table for ID: ${id}`);
        await storage.deletePo(id);
        deleted = true;
        tableName = 'pf_po';
        console.log(`✅ API: Successfully deleted PO from pf_po table with ID: ${id}`);
      } catch (pfPoError) {
        console.log(`ℹ️ API: PO ${id} not found in pf_po table, trying po_master table...`);
        
        try {
          console.log(`🔍 API: Attempting to delete from po_master table for ID: ${id}`);
          await storage.deletePoMaster(id);
          deleted = true;
          tableName = 'po_master';
          console.log(`✅ API: Successfully deleted PO from po_master table with ID: ${id}`);
        } catch (poMasterError) {
          console.log(`❌ API: PO ${id} not found in po_master table either`);
          console.log(`🔍 API: Checking if PO ${id} exists in other PO tables...`);
          
          // Try other specific PO tables
          const tableChecks = [
            { name: 'flipkart_grocery_po_header', deleteMethod: 'deleteFlipkartGroceryPo' },
            { name: 'zepto_po_header', deleteMethod: 'deleteZeptoPo' },
            { name: 'city_mall_po_header', deleteMethod: 'deleteCityMallPo' },
            { name: 'blinkit_po_header', deleteMethod: 'deleteBlinkitPo' },
            { name: 'swiggy_po_header', deleteMethod: 'deleteSwiggyPo' },
            { name: 'dealshare_po_header', deleteMethod: 'deleteDealsharePo' },
            { name: 'distributor_po', deleteMethod: 'deleteDistributorPo' }
          ];
          
          let foundInOtherTable = false;
          for (const table of tableChecks) {
            try {
              console.log(`🔍 API: Trying to delete from ${table.name} using ${table.deleteMethod}...`);
              await (storage as any)[table.deleteMethod](id);
              deleted = true;
              tableName = table.name;
              foundInOtherTable = true;
              console.log(`✅ API: Successfully deleted PO from ${table.name} with ID: ${id}`);
              break;
            } catch (tableError) {
              console.log(`ℹ️ API: PO ${id} not found in ${table.name}`);
            }
          }
          
          if (!foundInOtherTable) {
            console.error(`❌ API: PO ${id} not found in any table`);
            throw new Error(`PO with ID ${id} not found in any table`);
          }
        }
      }
      
      if (!deleted) {
        throw new Error(`Failed to delete PO with ID ${id}`);
      }
      
      // Log the deletion
      try {
        await storage.logEdit({
          username,
          action: 'DELETE',
          tableName,
          recordId: id,
          fieldName: 'po_deletion',
          oldValue: 'EXISTS',
          newValue: 'DELETED',
          ipAddress,
          userAgent,
          sessionId
        });
        console.log(`📝 API: Logged PO deletion for ID: ${id} from table: ${tableName}`);
      } catch (logError) {
        console.error(`⚠️ API: Failed to log PO deletion:`, logError);
        // Don't fail the deletion if logging fails
      }
      
      res.status(204).send();
    } catch (error) {
      console.error(`❌ API: Error deleting PO with ID ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to delete PO", 
        error: error instanceof Error ? error.message : String(error) 
      });
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
      
      // Convert decimal fields from string to number for frontend compatibility
      const formattedPO = {
        ...po,
        total_taxable_value: po.total_taxable_value ? parseFloat(po.total_taxable_value.toString()) : 0,
        total_tax_amount: po.total_tax_amount ? parseFloat(po.total_tax_amount.toString()) : 0,
        total_amount: po.total_amount ? parseFloat(po.total_amount.toString()) : 0,
      };
      
      res.json(formattedPO);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Flipkart grocery PO" });
    }
  });

  app.post("/api/flipkart-grocery-pos", async (req, res) => {
    try {
      const validatedData = createFlipkartGroceryPoSchema.parse(req.body);
      const po = await storage.createFlipkartGroceryPo(validatedData.header, validatedData.lines);
      
      // Fetch the created lines to return complete data
      const lines = await storage.getFlipkartGroceryPoLines(po.id);
      
      // Return the complete PO with lines
      res.status(201).json({ 
        ...po, 
        lines: lines.map(line => ({
          ...line,
          supplier_mrp: line.supplier_mrp ? parseFloat(line.supplier_mrp.toString()) : 0,
          supplier_price: line.supplier_price ? parseFloat(line.supplier_price.toString()) : 0,
          taxable_value: line.taxable_value ? parseFloat(line.taxable_value.toString()) : 0,
          igst_rate: line.igst_rate ? parseFloat(line.igst_rate.toString()) : 0,
          igst_amount_per_unit: line.igst_amount_per_unit ? parseFloat(line.igst_amount_per_unit.toString()) : 0,
          sgst_rate: line.sgst_rate ? parseFloat(line.sgst_rate.toString()) : 0,
          sgst_amount_per_unit: line.sgst_amount_per_unit ? parseFloat(line.sgst_amount_per_unit.toString()) : 0,
          cgst_rate: line.cgst_rate ? parseFloat(line.cgst_rate.toString()) : 0,
          cgst_amount_per_unit: line.cgst_amount_per_unit ? parseFloat(line.cgst_amount_per_unit.toString()) : 0,
          cess_rate: line.cess_rate ? parseFloat(line.cess_rate.toString()) : 0,
          cess_amount_per_unit: line.cess_amount_per_unit ? parseFloat(line.cess_amount_per_unit.toString()) : 0,
          tax_amount: line.tax_amount ? parseFloat(line.tax_amount.toString()) : 0,
          total_amount: line.total_amount ? parseFloat(line.total_amount.toString()) : 0,
          required_by_date: line.required_by_date ? new Date(line.required_by_date).toISOString().split('T')[0] : ""
        }))
      });
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
      
      // Convert decimal fields from string to number for frontend compatibility
      const formattedLines = lines.map(line => ({
        ...line,
        supplier_mrp: line.supplier_mrp ? parseFloat(line.supplier_mrp.toString()) : 0,
        supplier_price: line.supplier_price ? parseFloat(line.supplier_price.toString()) : 0,
        taxable_value: line.taxable_value ? parseFloat(line.taxable_value.toString()) : 0,
        igst_rate: line.igst_rate ? parseFloat(line.igst_rate.toString()) : 0,
        igst_amount_per_unit: line.igst_amount_per_unit ? parseFloat(line.igst_amount_per_unit.toString()) : 0,
        sgst_rate: line.sgst_rate ? parseFloat(line.sgst_rate.toString()) : 0,
        sgst_amount_per_unit: line.sgst_amount_per_unit ? parseFloat(line.sgst_amount_per_unit.toString()) : 0,
        cgst_rate: line.cgst_rate ? parseFloat(line.cgst_rate.toString()) : 0,
        cgst_amount_per_unit: line.cgst_amount_per_unit ? parseFloat(line.cgst_amount_per_unit.toString()) : 0,
        cess_rate: line.cess_rate ? parseFloat(line.cess_rate.toString()) : 0,
        cess_amount_per_unit: line.cess_amount_per_unit ? parseFloat(line.cess_amount_per_unit.toString()) : 0,
        tax_amount: line.tax_amount ? parseFloat(line.tax_amount.toString()) : 0,
        total_amount: line.total_amount ? parseFloat(line.total_amount.toString()) : 0,
        required_by_date: line.required_by_date ? new Date(line.required_by_date).toISOString().split('T')[0] : ""
      }));
      
      res.json(formattedLines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Flipkart grocery PO lines" });
    }
  });

  app.get("/api/flipkart-grocery-pos/lookup-by-po/:poNumber", async (req, res) => {
    try {
      const poNumber = decodeURIComponent(req.params.poNumber);
      const po = await storage.getFlipkartGroceryPoByNumber(poNumber);
      if (!po) {
        return res.status(404).json({ message: "Flipkart grocery PO not found" });
      }
      res.json(po);
    } catch (error) {
      console.error("Error looking up Flipkart grocery PO by number:", error);
      res.status(500).json({ message: "Failed to lookup Flipkart grocery PO" });
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
      
      // Fetch the created lines to return complete data
      const createdLines = await storage.getZeptoPoLines(createdPo.id);
      
      // Return the complete PO with lines
      res.status(201).json({ 
        ...createdPo, 
        lines: createdLines 
      });
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
      
      // Fetch the created lines to return complete data
      const createdLines = await storage.getCityMallPoLines(createdPo.id);
      
      // Return the complete PO with lines
      res.status(201).json({ 
        ...createdPo, 
        lines: createdLines 
      });
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
      
      // Fetch the created lines to return complete data
      const createdLines = await storage.getBlinkitPoLines(createdPo.id);
      
      // Return the complete PO with lines
      res.status(201).json({ 
        ...createdPo, 
        lines: createdLines 
      });
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
      
      // Fetch the created lines to return complete data
      const createdLines = await storage.getSwiggyPoLines(createdPo.id);
      
      // Return the complete PO with lines
      res.status(201).json({ 
        ...createdPo, 
        lines: createdLines 
      });
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
      let parsedData: any;
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
      
      // Validate vendor parameter
      if (!vendor) {
        return res.status(400).json({ error: "Vendor/platform parameter is required" });
      }
      
      // Log incoming data for debugging
      console.log("Import request:", {
        vendor,
        hasHeader: !!header,
        hasLines: !!lines,
        linesCount: lines?.length || 0,
        hasPoList: !!poList,
        poListCount: poList?.length || 0
      });

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

      // Convert all platform data to unified format and use po_master table
      const platformMap: Record<string, number> = {
        'blinkit': 1,     // Blinkit
        'swiggy': 2,      // Swiggy Instamart
        'zepto': 3,       // Zepto
        'flipkart': 4,    // Flipkart Grocery
        'zomato': 15,     // Zomato (using ID 15 from database)
        'amazon': 6,      // Amazon
        'citymall': 7,    // Citymall
        'dealshare': 8,   // Dealshare
        'bigbasket': 12   // BigBasket
      };

      // Create unified master data structure
      const masterData = {
        platform_id: platformMap[vendor] || 1, // Default to Blinkit if unknown
        po_number: cleanHeader.po_number,
        po_date: cleanHeader.po_date || cleanHeader.order_date || new Date(),
        expiry_date: cleanHeader.expiry_date || cleanHeader.po_expiry_date || null,
        appointment_date: cleanHeader.appointment_date || null,
        region: cleanHeader.region || 'DEFAULT',
        area: cleanHeader.area || cleanHeader.city || 'DEFAULT',
        state_id: null, // Will be populated if we have state mapping
        district_id: null, // Will be populated if we have district mapping
        dispatch_from: cleanHeader.dispatch_from || null,
        warehouse: cleanHeader.warehouse || null,
        created_by: null // Use NULL instead of 'IMPORT_SYSTEM' to avoid foreign key constraint
      };

      // Convert line items to unified format
      const linesData = cleanLines.map((line: any) => ({
        item_name: line.item_name || line.product_description || 'Unknown Item',
        platform_code: line.platform_code || line.item_code || line.sku,
        sap_code: line.sap_code || line.item_code || line.sku,
        quantity: line.quantity || line.ordered_quantity || 0,
        basic_amount: line.basic_amount || line.basic_rate || line.unit_rate || 0,
        tax_percent: line.tax_percent || line.gst_rate || 0,
        landing_amount: line.landing_amount || line.landing_rate || line.total_amount || 0,
        total_amount: line.total_amount || line.net_amount || 0,
        uom: line.uom || line.unit || 'PCS',
        total_ltrs: line.total_ltrs || line.total_litres || null,
        boxes: line.boxes || null
      }));

      let createdPo;
      try {
        // Use platform-specific methods to ensure data goes into both platform-specific AND consolidated tables
        if (vendor === 'flipkart') {
          createdPo = await storage.createFlipkartGroceryPo(cleanHeader, cleanLines);
        } else if (vendor === 'zepto') {
          console.log('📋 Creating Zepto PO:', cleanHeader.po_number);
          createdPo = await storage.createZeptoPo(cleanHeader, cleanLines);
        } else if (vendor === 'citymall') {
          createdPo = await storage.createCityMallPo(cleanHeader, cleanLines);
        } else if (vendor === 'blinkit') {
          createdPo = await storage.createBlinkitPo(cleanHeader, cleanLines);
        } else if (vendor === 'swiggy') {
          createdPo = await storage.createSwiggyPo(cleanHeader, cleanLines);
        } else if (vendor === 'bigbasket') {
          createdPo = await storage.createBigbasketPo(cleanHeader, cleanLines);
        } else if (vendor === 'zomato') {
          createdPo = await storage.createZomatoPo(cleanHeader, cleanLines);
        } else if (vendor === 'dealshare') {
          createdPo = await storage.createDealsharePo(cleanHeader, cleanLines);
        } else {
          // Fallback to unified po_master table for platforms without specific methods
          createdPo = await storage.createPoInExistingTables(masterData, linesData);
        }
      } catch (error: any) {
        if (error.code === '23505') {
          return res.status(409).json({ 
            error: `PO ${cleanHeader.po_number} already exists`,
            type: 'duplicate_po'
          });
        }
        throw error;
      }

      res.status(201).json(createdPo);
    } catch (error) {
      console.error("Error importing PO:", error);
      console.error("Error details:", {
        vendor: req.params.vendor,
        poNumber: req.body.header?.po_number,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      // Send more detailed error response
      const errorMessage = error instanceof Error ? error.message : "Failed to import PO data";
      res.status(500).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          vendor: req.params.vendor,
          poNumber: req.body.header?.po_number,
          errorType: error instanceof Error ? error.name : 'Unknown'
        } : undefined
      });
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

  app.get("/api/distributors/lookup/:name", async (req, res) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const distributor = await storage.getDistributorByName(name);
      if (!distributor) {
        return res.status(404).json({ message: "Distributor not found" });
      }
      res.json(distributor);
    } catch (error) {
      console.error("Error looking up distributor:", error);
      res.status(500).json({ message: "Failed to lookup distributor" });
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

  // Update distributor order item status
  app.patch("/api/distributor-order-items/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { status } = req.body;
      console.log(`🎯 PATCH /api/distributor-order-items/${itemId} - Status: ${status}`);

      if (!status) {
        console.log("❌ Status is required");
        return res.status(400).json({ error: "Status is required" });
      }

      await storage.updateDistributorOrderItemStatus(itemId, status);
      console.log(`✅ Successfully updated item ${itemId} status to ${status}`);
      res.json({ success: true, message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating distributor order item status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Bulk approve distributor order items
  app.patch("/api/distributor-order-items/bulk-approve", async (req, res) => {
    try {
      const { itemIds } = req.body;
      
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ error: "itemIds array is required" });
      }
      
      console.log(`📋 Bulk approving ${itemIds.length} distributor order items:`, itemIds);
      
      // Extract user info for logging
      const username = (req as any).user?.username || 'Unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
      const userAgent = req.get('User-Agent') || 'Unknown';
      const sessionId = req.sessionID || 'Unknown';
      
      // Update all items to CONFIRMED status
      let updatedCount = 0;
      for (const itemId of itemIds) {
        try {
          await storage.updateDistributorOrderItemStatus(itemId, 'CONFIRMED');
          updatedCount++;
          
          console.log(`✅ Approved item ${itemId} by ${username} from ${ipAddress}`);
        } catch (itemError) {
          console.error(`❌ Failed to approve item ${itemId}:`, itemError);
        }
      }
      
      console.log(`✅ Successfully approved ${updatedCount}/${itemIds.length} distributor order items`);
      
      res.json({ 
        success: true, 
        message: `Successfully approved ${updatedCount} of ${itemIds.length} items`,
        updatedCount: updatedCount
      });
    } catch (error) {
      console.error("❌ Bulk approval error:", error);
      res.status(500).json({ 
        error: "Failed to approve items", 
        details: error instanceof Error ? error.message : String(error)
      });
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

  // Attachment Routes for All Platforms
  
  // Generic attachment upload handler
  const uploadAttachment = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const platform = req.params.platform || 'general';
        const dir = `./uploads/${platform}`;
        require('fs').mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        cb(null, uniqueSuffix + '-' + file.originalname);
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Upload attachment for any platform
  app.post("/api/:platform/pos/:poId/attachments", uploadAttachment.single('file'), async (req, res) => {
    try {
      const { platform, poId } = req.params;
      const { description } = req.body;
      const userId = req.body.userId || 1; // Get from auth context in production
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const attachment = await storage.addAttachment(platform, parseInt(poId), {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: userId,
        description
      });

      res.json(attachment);
    } catch (error) {
      console.error(`Error uploading attachment for ${req.params.platform}:`, error);
      res.status(500).json({ error: "Failed to upload attachment" });
    }
  });

  // Get attachments for a PO
  app.get("/api/:platform/pos/:poId/attachments", async (req, res) => {
    try {
      const { platform, poId } = req.params;
      const attachments = await storage.getAttachments(platform, parseInt(poId));
      res.json(attachments);
    } catch (error) {
      console.error(`Error fetching attachments for ${req.params.platform}:`, error);
      res.status(500).json({ error: "Failed to fetch attachments" });
    }
  });

  // Delete attachment
  app.delete("/api/:platform/attachments/:id", async (req, res) => {
    try {
      const { platform, id } = req.params;
      await storage.deleteAttachment(platform, parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting attachment for ${req.params.platform}:`, error);
      res.status(500).json({ error: "Failed to delete attachment" });
    }
  });

  // Add comment to PO
  app.post("/api/:platform/pos/:poId/comments", async (req, res) => {
    try {
      const { platform, poId } = req.params;
      const { comment, userId } = req.body;
      
      if (!comment) {
        return res.status(400).json({ error: "Comment is required" });
      }

      const newComment = await storage.addComment(platform, parseInt(poId), {
        comment,
        createdBy: userId || 1 // Get from auth context in production
      });

      res.json(newComment);
    } catch (error) {
      console.error(`Error adding comment for ${req.params.platform}:`, error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // Get comments for a PO
  app.get("/api/:platform/pos/:poId/comments", async (req, res) => {
    try {
      const { platform, poId } = req.params;
      const comments = await storage.getComments(platform, parseInt(poId));
      res.json(comments);
    } catch (error) {
      console.error(`Error fetching comments for ${req.params.platform}:`, error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Delete comment
  app.delete("/api/:platform/comments/:id", async (req, res) => {
    try {
      const { platform, id } = req.params;
      await storage.deleteComment(platform, parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting comment for ${req.params.platform}:`, error);
      res.status(500).json({ error: "Failed to delete comment" });
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

      let parsedData: any;

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

      let parsedData: any;

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
          const itemsWithAttachment = parsedData.data.map((item: any) => ({
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
            const zeptoItemsWithPeriod = zeptoItemsWithDates.map((item: any) => {
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
            const blinkitItemsWithPeriod = blinkitItemsWithDates.map((item: any) => {
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
            const jioMartSaleItemsWithPeriod = jioMartSaleItemsWithDates.map((item: any) => {
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
            const jioMartCancelItemsWithPeriod = jioMartCancelItemsWithDates.map((item: any) => {
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

      let parsedData: any;

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
          const itemsWithAttachment = parsedData.items.map((item: any) => ({
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
          const itemsWithAttachment = parsedData.items.map((item: any) => ({
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
          const itemsWithAttachment = parsedData.items.map((item: any) => ({
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
          const itemsWithAttachment = parsedData.items.map((item: any) => ({
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
              totalWarehouses: Array.from(new Set(flipkartItems.map(item => item.warehouseId).filter(Boolean))).length,
              totalBrands: Array.from(new Set(flipkartItems.map(item => item.brand).filter(Boolean))).length,
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

      let parsedData: any;
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
            reportDate.toISOString(),
            periodStart ? periodStart.toISOString() : undefined,
            periodEnd ? periodEnd.toISOString() : undefined
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
            periodStart || undefined,
            periodEnd || undefined
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

  // Auto-populate endpoint for parameterized queries
  app.post('/api/auto-populate', async (req, res) => {
    try {
      const { uploadType, identifier, platform } = req.body;

      if (!uploadType || !identifier) {
        return res.status(400).json({ error: 'uploadType and identifier are required' });
      }

      let results: any[] = [];
      let source = '';

      // Clean and validate identifier
      const cleanIdentifier = identifier.toString().trim();
      if (!cleanIdentifier) {
        return res.status(400).json({ error: 'Invalid identifier' });
      }

      try {
        switch (uploadType) {
          case 'secondary-sales': {
            // Try different secondary sales tables
            const platforms = ['AM', 'Zepto', 'Blinkit', 'Swiggy', 'JioMart', 'BigBasket', 'Flipkart'];
            const timeframes = ['Daily', 'Range'];

            for (const plat of platforms) {
              if (platform && platform !== plat) continue;
              
              for (const timeframe of timeframes) {
                try {
                  const tableName = `SC_${plat}_JM_${timeframe}`;
                  const result = await db.execute(sql.raw(`
                    SELECT * FROM "${tableName}" 
                    WHERE order_id = '${cleanIdentifier}' 
                    OR sku = '${cleanIdentifier}' 
                    OR item_name ILIKE '%${cleanIdentifier}%'
                    LIMIT 5
                  `));
                  
                  if (result.rows.length > 0) {
                    results = result.rows;
                    source = tableName;
                    break;
                  }
                } catch (error) {
                  // Table might not exist, continue
                  continue;
                }
              }
              if (results.length > 0) break;
            }

            // Also try generic secondary_sales_header and secondary_sales_items
            if (results.length === 0) {
              try {
                const result = await db.execute(sql.raw(`
                  SELECT h.*, i.* FROM secondary_sales_header h
                  LEFT JOIN secondary_sales_items i ON h.id = i.header_id
                  WHERE h.order_id = '${cleanIdentifier}' 
                  OR i.sku = '${cleanIdentifier}' 
                  OR i.item_name ILIKE '%${cleanIdentifier}%'
                  LIMIT 5
                `));
                
                if (result.rows.length > 0) {
                  results = result.rows;
                  source = 'secondary_sales_header';
                }
              } catch (error) {
                console.warn('Failed to query secondary sales tables:', error);
              }
            }
            break;
          }

          case 'inventory': {
            // Try different inventory tables
            const platforms = ['FlipKart', 'JioMart', 'Blinkit'];
            const timeframes = ['Daily', 'Range'];

            for (const plat of platforms) {
              if (platform && platform !== plat) continue;
              
              for (const timeframe of timeframes) {
                try {
                  const tableName = `INV_${plat}_JM_${timeframe}`;
                  const result = await db.execute(sql.raw(`
                    SELECT * FROM "${tableName}" 
                    WHERE sku = '${cleanIdentifier}' 
                    OR product_name ILIKE '%${cleanIdentifier}%' 
                    OR listing_id = '${cleanIdentifier}'
                    LIMIT 5
                  `));
                  
                  if (result.rows.length > 0) {
                    results = result.rows;
                    source = tableName;
                    break;
                  }
                } catch (error) {
                  continue;
                }
              }
              if (results.length > 0) break;
            }
            break;
          }

          case 'po': {
            // Try poMaster and poLines first
            try {
              const result = await db.execute(sql.raw(`
                SELECT m.*, l.* FROM po_master m
                LEFT JOIN po_lines l ON m.id = l.po_id
                WHERE m.vendor_po_number = '${cleanIdentifier}' 
                OR m.series = '${cleanIdentifier}' 
                OR l.item_code = '${cleanIdentifier}'
                LIMIT 5
              `));
              
              if (result.rows.length > 0) {
                results = result.rows;
                source = 'po_master';
              }
            } catch (error) {
              console.warn('Failed to query po_master:', error);
            }

            // Try pf_po and pf_order_items if no results
            if (results.length === 0) {
              try {
                const result = await db.execute(sql.raw(`
                  SELECT p.*, o.* FROM pf_po p
                  LEFT JOIN pf_order_items o ON p.id = o.po_id
                  WHERE p.vendor_po_number = '${cleanIdentifier}' 
                  OR p.po_series = '${cleanIdentifier}' 
                  OR o.platform_code = '${cleanIdentifier}' 
                  OR o.sap_code = '${cleanIdentifier}'
                  LIMIT 5
                `));
                
                if (result.rows.length > 0) {
                  results = result.rows;
                  source = 'pf_po';
                }
              } catch (error) {
                console.warn('Failed to query pf_po:', error);
              }
            }
            break;
          }

          default:
            return res.status(400).json({ error: 'Invalid upload type' });
        }

        if (results.length > 0) {
          res.json({
            found: true,
            data: results[0], // Return first match
            source,
            message: `Found ${results.length} record(s) in ${source}`,
            count: results.length
          });
        } else {
          res.json({
            found: false,
            source: uploadType,
            message: `No matching records found for "${cleanIdentifier}"`,
            count: 0
          });
        }

      } catch (queryError) {
        console.error('Query error:', queryError);
        res.status(500).json({ 
          error: 'Database query failed',
          details: queryError instanceof Error ? queryError.message : 'Unknown error'
        });
      }

    } catch (error) {
      console.error('Auto-populate error:', error);
      res.status(500).json({ error: 'Failed to auto-populate data' });
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

  // Master Agent Routes - Enhanced backend operations
  app.post("/api/agent/purchase-orders", createPurchaseOrderAgent);
  app.get("/api/agent/platforms", getPlatformsAgent);
  app.get("/api/agent/distributors/:platformId", getDistributorsAgent);
  app.get("/api/agent/platform-items", searchPlatformItemsAgent);
  app.get("/api/agent/analytics", getOrderAnalyticsAgent);
  app.get("/api/agent/health", healthCheckAgent);
  app.post("/api/agent/validate-po", validatePOAgent);

  // SQL Server Routes - Direct database operations
  app.get("/api/sql/health", sqlHealthCheck);
  app.get("/api/sql/status", getSqlStatus);
  app.get("/api/sql/items", getItemDetails);
  app.get("/api/sql/hana-items", getHanaItems);
  app.post("/api/sql/search-hana-items", searchHanaItems);
  app.post("/api/sql/search-items", searchItems);
  app.get("/api/sql/platform-items", getPlatformItems);
  app.post("/api/sql/query", executeQuery);
  app.post("/api/sql/stored-procedure", executeStoredProcedure);
  app.get("/api/sql/table-info", getTableInfo);
  app.get("/api/sql/performance", getPerformanceStats);

  // HANA Test Routes
  app.get("/api/hana/test-connection", testHanaConnection);
  app.get("/api/hana/test-procedure", testStoredProcedure);
  app.get("/api/hana/items", getHanaItemsTest);
  app.post("/api/hana/search", searchHanaItemsTest);
  app.get("/api/hana/raw-procedure", executeRawProcedure);

  // RBAC Routes - User Management and Permissions
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  app.get("/api/permissions", async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUserWithRole(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = req.body;
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id/role", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { roleId } = req.body;
      const updatedUser = await storage.assignRoleToUser(userId, roleId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.get("/api/users/:id/permissions", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  app.get("/api/roles/:id/permissions", async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const rolePermissions = await storage.getRolePermissions(roleId);
      res.json(rolePermissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ error: "Failed to fetch role permissions" });
    }
  });

  app.post("/api/roles/:roleId/permissions/:permissionId", async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);
      const rolePermission = await storage.assignPermissionToRole(roleId, permissionId);
      res.status(201).json(rolePermission);
    } catch (error) {
      console.error("Error assigning permission to role:", error);
      res.status(500).json({ error: "Failed to assign permission to role" });
    }
  });

  app.delete("/api/roles/:roleId/permissions/:permissionId", async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);
      await storage.removePermissionFromRole(roleId, permissionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing permission from role:", error);
      res.status(500).json({ error: "Failed to remove permission from role" });
    }
  });

  const httpServer = createServer(app);
  

  
  return httpServer;
}
