import { type Request, type Response } from "express";
import { masterAgent } from "./master-agent";
import { z } from "zod";

// Request validation schemas
const createPOSchema = z.object({
  po: z.object({
    company: z.string().optional(),
    po_number: z.string().min(1),
    platform: z.number().min(1),
    status: z.string().min(1),
    order_date: z.string(),
    expiry_date: z.string().optional(),
    appointment_date: z.string().optional(),
    region: z.string().min(1),
    state: z.string().min(1),
    city: z.string().min(1),
    area: z.string().optional(),
    serving_distributor: z.string().optional(),
    dispatch_from: z.string().optional(),
    warehouse: z.string().optional(),
    attachment: z.string().optional()
  }),
  items: z.array(z.object({
    item_name: z.string().min(1),
    quantity: z.number().min(1),
    sap_code: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    basic_rate: z.string(),
    gst_rate: z.string(),
    landing_rate: z.string().default("0"),
    total_litres: z.string().optional(),
    hsn_code: z.string().optional(),
    status: z.string().optional()
  })).min(1)
});

/**
 * Agent-powered API Routes
 * These routes use the Master Agent for comprehensive backend operations
 */

/**
 * POST /api/agent/purchase-orders
 * Create purchase order using Master Agent
 */
export async function createPurchaseOrderAgent(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = createPOSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationResult.error.errors
      });
    }

    // Convert string dates to Date objects for database
    const requestData = {
      ...validationResult.data,
      po: {
        ...validationResult.data.po,
        order_date: new Date(validationResult.data.po.order_date),
        expiry_date: validationResult.data.po.expiry_date ? new Date(validationResult.data.po.expiry_date) : undefined,
        appointment_date: validationResult.data.po.appointment_date ? new Date(validationResult.data.po.appointment_date) : undefined,
      }
    };

    // Use Master Agent to create PO
    const result = await masterAgent.createPurchaseOrder(requestData);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error: any) {
    console.error("Agent PO Creation Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
}

/**
 * GET /api/agent/platforms
 * Get platforms with company filtering
 */
export async function getPlatformsAgent(req: Request, res: Response) {
  try {
    const { company } = req.query as { company?: string };
    
    const result = await masterAgent.getPlatformData(company);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error: any) {
    console.error("Agent Platforms Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

/**
 * GET /api/agent/distributors/:platformId
 * Get distributors for specific platform
 */
export async function getDistributorsAgent(req: Request, res: Response) {
  try {
    const platformId = parseInt(req.params.platformId);
    
    if (isNaN(platformId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid platform ID"
      });
    }

    const result = await masterAgent.getDistributorsForPlatform(platformId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error: any) {
    console.error("Agent Distributors Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

/**
 * GET /api/agent/platform-items
 * Search platform items with advanced filtering
 */
export async function searchPlatformItemsAgent(req: Request, res: Response) {
  try {
    const { platformId, search, limit, offset } = req.query;
    
    const query = {
      platformId: platformId ? parseInt(platformId as string) : undefined,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const result = await masterAgent.searchPlatformItems(query);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error: any) {
    console.error("Agent Platform Items Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

/**
 * GET /api/agent/analytics
 * Get comprehensive order analytics
 */
export async function getOrderAnalyticsAgent(req: Request, res: Response) {
  try {
    const { platform, dateFrom, dateTo } = req.query;
    
    const filters = {
      platform: platform ? parseInt(platform as string) : undefined,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string
    };

    const result = await masterAgent.getOrderAnalytics(filters);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error: any) {
    console.error("Agent Analytics Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

/**
 * GET /api/agent/health
 * System health check
 */
export async function healthCheckAgent(req: Request, res: Response) {
  try {
    const result = await masterAgent.healthCheck();
    
    const statusCode = result.success ? 200 : 503;
    res.status(statusCode).json(result);

  } catch (error: any) {
    console.error("Agent Health Check Error:", error);
    res.status(500).json({
      success: false,
      error: "Health check failed"
    });
  }
}

/**
 * POST /api/agent/validate-po
 * Validate PO data without creating
 */
export async function validatePOAgent(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = createPOSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationResult.error.errors
      });
    }

    // This would use internal validation methods from the agent
    // For now, return success if schema validation passed
    res.json({
      success: true,
      message: "PO data is valid",
      data: {
        itemCount: validationResult.data.items.length,
        estimatedTotal: validationResult.data.items.reduce((sum, item) => {
          const basicAmount = parseFloat(item.basic_rate) * item.quantity;
          const gstAmount = basicAmount * (parseFloat(item.gst_rate) / 100);
          return sum + basicAmount + gstAmount;
        }, 0)
      }
    });

  } catch (error: any) {
    console.error("Agent PO Validation Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}