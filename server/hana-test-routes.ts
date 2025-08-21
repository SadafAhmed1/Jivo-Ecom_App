import { type Request, type Response } from "express";
import { sqlServerService } from "./sql-service";

/**
 * Test routes for HANA connectivity and stored procedure execution
 */

/**
 * GET /api/hana/test-connection
 * Test basic SQL Server connection
 */
export async function testHanaConnection(req: Request, res: Response) {
  try {
    console.log("Testing HANA connection...");
    const result = await sqlServerService.testConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: "HANA connection test successful",
        data: result.data,
        executionTime: result.executionTime
      });
    } else {
      res.status(503).json({
        success: false,
        error: "HANA connection test failed",
        details: result.error
      });
    }
  } catch (error: any) {
    console.error("HANA connection test error:", error);
    res.status(500).json({
      success: false,
      error: "Connection test failed",
      details: error.message
    });
  }
}

/**
 * GET /api/hana/test-procedure
 * Test the SP_GET_ITEM_DETAILS stored procedure directly
 */
export async function testStoredProcedure(req: Request, res: Response) {
  try {
    console.log("Testing SP_GET_ITEM_DETAILS stored procedure...");
    
    const startTime = Date.now();
    const result = await sqlServerService.executeStoredProcedure("SP_GET_ITEM_DETAILS");
    const executionTime = Date.now() - startTime;
    
    console.log(`Stored procedure executed in ${executionTime}ms, success: ${result.success}`);
    
    if (result.success) {
      res.json({
        success: true,
        message: "Stored procedure executed successfully",
        data: result.data,
        metadata: {
          recordCount: result.data?.length || 0,
          executionTime: result.executionTime || executionTime,
          procedureName: "SP_GET_ITEM_DETAILS",
          source: "HANA DB via SQL Server linked server"
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Stored procedure execution failed",
        details: result.error,
        procedureName: "SP_GET_ITEM_DETAILS"
      });
    }
  } catch (error: any) {
    console.error("Stored procedure test error:", error);
    res.status(500).json({
      success: false,
      error: "Stored procedure test failed",
      details: error.message,
      procedureName: "SP_GET_ITEM_DETAILS"
    });
  }
}

/**
 * GET /api/hana/items
 * Get all items from HANA via stored procedure
 */
export async function getHanaItems(req: Request, res: Response) {
  try {
    console.log("Fetching items from HANA via SP_GET_ITEM_DETAILS...");
    
    const result = await sqlServerService.getItemDetails();
    
    if (result.success) {
      res.json({
        success: true,
        message: "Items fetched successfully from HANA",
        data: result.data,
        metadata: {
          recordCount: result.data?.length || 0,
          executionTime: result.executionTime,
          source: "HANA DB via SP_GET_ITEM_DETAILS",
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // Return sample data as fallback but indicate it's fallback
      const fallbackResult = await sqlServerService.getLocalItemDetails();
      res.json({
        success: true,
        message: "HANA unavailable, using fallback data",
        data: fallbackResult.data,
        metadata: {
          recordCount: fallbackResult.data?.length || 0,
          executionTime: fallbackResult.executionTime,
          source: "Sample data (HANA unavailable)",
          originalError: result.error,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error: any) {
    console.error("Get HANA items error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch items from HANA",
      details: error.message
    });
  }
}

/**
 * POST /api/hana/search
 * Search items in HANA with filters
 */
export async function searchHanaItems(req: Request, res: Response) {
  try {
    const { search, limit = 50, platformId } = req.body;
    
    if (!search || search.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search term must be at least 2 characters long"
      });
    }

    console.log(`Searching HANA items: "${search}", limit: ${limit}, platform: ${platformId || 'all'}`);
    
    const result = await sqlServerService.searchHanaItems(search, limit, platformId);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Found ${result.data?.length || 0} items matching "${search}"`,
        data: result.data,
        metadata: {
          searchTerm: search,
          recordCount: result.data?.length || 0,
          totalRecords: (result as any).totalRecords,
          filteredRecords: (result as any).filteredRecords,
          executionTime: result.executionTime,
          platformId: platformId || null,
          source: "HANA DB via SP_GET_ITEM_DETAILS",
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Search failed",
        details: result.error,
        searchTerm: search
      });
    }
  } catch (error: any) {
    console.error("Search HANA items error:", error);
    res.status(500).json({
      success: false,
      error: "Search failed",
      details: error.message
    });
  }
}

/**
 * GET /api/hana/raw-procedure
 * Execute the stored procedure directly and return raw results
 */
export async function executeRawProcedure(req: Request, res: Response) {
  try {
    console.log("Executing raw SP_GET_ITEM_DETAILS...");
    
    // Execute the stored procedure directly with detailed logging
    const result = await sqlServerService.executeStoredProcedure("dbo.SP_GET_ITEM_DETAILS");
    
    console.log("Raw procedure result:", {
      success: result.success,
      dataLength: result.data?.length,
      error: result.error,
      executionTime: result.executionTime
    });
    
    res.json({
      success: result.success,
      rawData: result.data,
      error: result.error,
      executionTime: result.executionTime,
      recordsAffected: result.recordsAffected,
      metadata: {
        procedureName: "dbo.SP_GET_ITEM_DETAILS",
        timestamp: new Date().toISOString(),
        dataType: typeof result.data,
        isArray: Array.isArray(result.data)
      }
    });
  } catch (error: any) {
    console.error("Raw procedure execution error:", error);
    res.status(500).json({
      success: false,
      error: "Raw procedure execution failed",
      details: error.message,
      stack: error.stack
    });
  }
}