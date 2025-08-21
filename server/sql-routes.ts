import { type Request, type Response } from "express";
import { sqlServerService } from "./sql-service";
import { z } from "zod";

// Request validation schemas
const searchItemsSchema = z.object({
  search: z.string().min(1).max(100),
  limit: z.number().min(1).max(1000).optional().default(50),
  platformId: z.number().optional()
});

const querySchema = z.object({
  query: z.string().min(1).max(5000),
  params: z.record(z.any()).optional()
});

const storedProcSchema = z.object({
  procedureName: z.string().min(1).max(100),
  params: z.record(z.object({
    type: z.any(),
    value: z.any()
  })).optional()
});

/**
 * SQL Server API Routes
 * Provides secure access to SQL Server operations
 */

/**
 * GET /api/sql/health
 * Test SQL Server connection
 */
export async function sqlHealthCheck(req: Request, res: Response) {
  try {
    const result = await sqlServerService.testConnection();
    const status = sqlServerService.getConnectionStatus();
    
    if (result.success) {
      res.json({
        success: true,
        message: "SQL Server connection healthy",
        data: {
          ...status,
          responseTime: result.executionTime
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: "SQL Server connection failed",
        details: result.error,
        data: status
      });
    }
  } catch (error: any) {
    console.error("SQL health check error:", error);
    res.status(500).json({
      success: false,
      error: "Health check failed",
      details: error.message
    });
  }
}

/**
 * GET /api/sql/status
 * Get connection status and information
 */
export async function getSqlStatus(req: Request, res: Response) {
  try {
    const status = sqlServerService.getConnectionStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to get status",
      details: error.message
    });
  }
}

/**
 * GET /api/sql/items
 * Get item details from SAP system
 */
export async function getItemDetails(req: Request, res: Response) {
  try {
    const result = await sqlServerService.getItemDetails();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: {
          recordCount: result.data?.length || 0,
          executionTime: result.executionTime
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error("Get item details error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get item details",
      details: error.message
    });
  }
}

/**
 * GET /api/sql/hana-items
 * Get items from HANA DB via stored procedure
 */
export async function getHanaItems(_req: Request, res: Response) {
  try {
    const result = await sqlServerService.getItemDetails();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: {
          source: "HANA DB via SP_GET_ITEM_DETAILS",
          recordCount: result.data?.length || 0,
          executionTime: result.executionTime
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error("Get HANA items error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get HANA items",
      details: error.message
    });
  }
}

/**
 * POST /api/sql/search-hana-items
 * Search HANA items with filtering
 */
export async function searchHanaItems(req: Request, res: Response) {
  try {
    const validation = searchItemsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors
      });
    }

    const { search, limit, platformId } = validation.data;
    const result = await sqlServerService.searchHanaItems(search, limit, platformId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: {
          source: "HANA DB via SP_GET_ITEM_DETAILS",
          searchTerm: search,
          limit,
          platformId,
          totalRecords: (result as any).totalRecords,
          filteredRecords: (result as any).filteredRecords,
          executionTime: result.executionTime
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error("Search HANA items error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search HANA items",
      details: error.message
    });
  }
}

/**
 * POST /api/sql/search-items
 * Search items by criteria
 */
export async function searchItems(req: Request, res: Response) {
  try {
    const validation = searchItemsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors
      });
    }

    const { search, limit } = validation.data;
    const result = await sqlServerService.searchItems(search, limit);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: {
          searchTerm: search,
          limit,
          recordCount: result.data?.length || 0,
          executionTime: result.executionTime
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error("Search items error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search items",
      details: error.message
    });
  }
}

/**
 * GET /api/sql/platform-items
 * Get platform-specific items
 */
export async function getPlatformItems(req: Request, res: Response) {
  try {
    const { platformCode } = req.query as { platformCode?: string };
    const result = await sqlServerService.getPlatformItems(platformCode);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: {
          platformCode,
          recordCount: result.data?.length || 0,
          executionTime: result.executionTime
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error("Get platform items error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get platform items",
      details: error.message
    });
  }
}

/**
 * POST /api/sql/query
 * Execute custom SQL query (restricted access)
 */
export async function executeQuery(req: Request, res: Response) {
  try {
    // Only allow in development mode for security
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: "Direct query execution not allowed in production"
      });
    }

    const validation = querySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors
      });
    }

    const { query, params } = validation.data;
    
    // Security check - only allow SELECT statements
    if (!query.trim().toLowerCase().startsWith('select')) {
      return res.status(403).json({
        success: false,
        error: "Only SELECT queries are allowed"
      });
    }

    const result = await sqlServerService.executeQuery(query, params);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: {
          recordCount: result.data?.length || 0,
          recordsAffected: result.recordsAffected,
          executionTime: result.executionTime
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error("Execute query error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to execute query",
      details: error.message
    });
  }
}

/**
 * POST /api/sql/stored-procedure
 * Execute stored procedure
 */
export async function executeStoredProcedure(req: Request, res: Response) {
  try {
    const validation = storedProcSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors
      });
    }

    const { procedureName, params } = validation.data;
    const result = await sqlServerService.executeStoredProcedure(procedureName, params);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: {
          procedureName,
          recordCount: result.data?.length || 0,
          recordsAffected: result.recordsAffected,
          executionTime: result.executionTime
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error("Execute stored procedure error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to execute stored procedure",
      details: error.message
    });
  }
}

/**
 * GET /api/sql/table-info
 * Get database schema information
 */
export async function getTableInfo(req: Request, res: Response) {
  try {
    const { tableName } = req.query as { tableName?: string };
    const result = await sqlServerService.getTableInfo(tableName);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: {
          tableName,
          recordCount: result.data?.length || 0,
          executionTime: result.executionTime
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error("Get table info error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get table information",
      details: error.message
    });
  }
}

/**
 * GET /api/sql/performance
 * Get performance statistics
 */
export async function getPerformanceStats(req: Request, res: Response) {
  try {
    const result = await sqlServerService.getPerformanceStats();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data?.[0] || {},
        metadata: {
          executionTime: result.executionTime
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error("Get performance stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get performance statistics",
      details: error.message
    });
  }
}