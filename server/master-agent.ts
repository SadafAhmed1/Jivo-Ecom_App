import { storage } from "./storage";
import type { 
  InsertPfPo, 
  InsertPfOrderItems, 
  PfMst, 
  SapItemMst, 
  DistributorMst,
  PfItemMst
} from "@shared/schema";

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface POCreationRequest {
  po: InsertPfPo;
  items: InsertPfOrderItems[];
}

export interface BusinessRules {
  platform: {
    amazonDistributor: string;
    minOrderValue: number;
    maxItemsPerOrder: number;
  };
  validation: {
    requiredFields: string[];
    maxFileSize: number;
    allowedFileTypes: string[];
  };
}

/**
 * Master Backend Agent
 * Coordinates all backend operations including database queries, 
 * business logic validation, and data processing
 */
export class MasterAgent {
  private static instance: MasterAgent;
  private businessRules: BusinessRules;

  private constructor() {
    this.businessRules = {
      platform: {
        amazonDistributor: "RK WORLD",
        minOrderValue: 100,
        maxItemsPerOrder: 100
      },
      validation: {
        requiredFields: ["company", "po_number", "platform", "region", "state", "city"],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFileTypes: [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]
      }
    };
  }

  public static getInstance(): MasterAgent {
    if (!MasterAgent.instance) {
      MasterAgent.instance = new MasterAgent();
    }
    return MasterAgent.instance;
  }

  /**
   * Create Purchase Order with full validation and business logic
   */
  async createPurchaseOrder(request: POCreationRequest): Promise<AgentResponse<any>> {
    try {
      // 1. Validate PO data
      const validation = await this.validatePOCreation(request);
      if (!validation.success) {
        return validation;
      }

      // 2. Apply business rules
      const businessValidation = await this.applyBusinessRules(request);
      if (!businessValidation.success) {
        return businessValidation;
      }

      // 3. Create PO in database
      const po = await storage.createPo(request.po, request.items);
      
      // Items are created automatically by createPo

      // 5. Calculate totals and update PO if needed
      const totals = this.calculateOrderTotals(request.items);

      return {
        success: true,
        data: {
          po,
          items: request.items,
          totals
        },
        message: `Purchase Order ${po.po_number} created successfully with ${request.items.length} items`
      };

    } catch (error: any) {
      console.error("MasterAgent: PO creation failed:", error);
      return {
        success: false,
        error: error.message || "Failed to create purchase order"
      };
    }
  }

  /**
   * Get platform data with filtering and business logic
   */
  async getPlatformData(companyFilter?: string): Promise<AgentResponse<PfMst[]>> {
    try {
      const platforms = await storage.getAllPlatforms();
      
      if (companyFilter) {
        const filteredPlatforms = this.filterPlatformsByCompany(platforms, companyFilter);
        return {
          success: true,
          data: filteredPlatforms,
          metadata: {
            totalPlatforms: platforms.length,
            filteredCount: filteredPlatforms.length,
            companyFilter
          }
        };
      }

      return {
        success: true,
        data: platforms,
        metadata: { totalPlatforms: platforms.length }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to fetch platforms"
      };
    }
  }

  /**
   * Get distributors with platform-specific filtering
   */
  async getDistributorsForPlatform(platformId: number): Promise<AgentResponse<DistributorMst[]>> {
    try {
      const [distributors, platform] = await Promise.all([
        storage.getAllDistributors(),
        storage.getAllPlatforms().then(platforms => platforms.find(p => p.id === platformId))
      ]);

      if (!platform) {
        return {
          success: false,
          error: "Platform not found"
        };
      }

      // Apply platform-specific distributor filtering
      const filteredDistributors = this.filterDistributorsByPlatform(distributors, platform);

      return {
        success: true,
        data: filteredDistributors,
        metadata: {
          platformName: platform.pf_name,
          totalDistributors: distributors.length,
          availableDistributors: filteredDistributors.length
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to fetch distributors"
      };
    }
  }

  /**
   * Search platform items with advanced filtering
   */
  async searchPlatformItems(query: {
    platformId?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AgentResponse<PfItemMst[]>> {
    try {
      let items = await storage.getPlatformItems();

      // Filter by platform
      if (query.platformId) {
        items = items.filter((item: PfItemMst) => item.pf_id === query.platformId);
      }

      // Search in item names
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        items = items.filter((item: PfItemMst) => 
          item.pf_itemname.toLowerCase().includes(searchTerm) ||
          item.pf_itemcode.toLowerCase().includes(searchTerm)
        );
      }

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 50;
      const paginatedItems = items.slice(offset, offset + limit);

      return {
        success: true,
        data: paginatedItems,
        metadata: {
          totalItems: items.length,
          returnedItems: paginatedItems.length,
          hasMore: offset + limit < items.length,
          query
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to search platform items"
      };
    }
  }

  /**
   * Get comprehensive order analytics
   */
  async getOrderAnalytics(filters?: {
    platform?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<AgentResponse<any>> {
    try {
      const orders = await storage.getAllPos();
      
      // Apply filters
      let filteredOrders = orders;
      if (filters?.platform) {
        filteredOrders = filteredOrders.filter((order: any) => order.platform === filters.platform);
      }

      // Calculate analytics
      const analytics = {
        totalOrders: filteredOrders.length,
        totalValue: 0, // Would need to calculate from line items
        ordersByStatus: this.groupOrdersByStatus(filteredOrders),
        ordersByPlatform: await this.groupOrdersByPlatform(filteredOrders),
        recentOrders: filteredOrders.slice(0, 10)
      };

      return {
        success: true,
        data: analytics,
        metadata: { filters }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to generate analytics"
      };
    }
  }

  /**
   * Health check for all backend services
   */
  async healthCheck(): Promise<AgentResponse<any>> {
    const checks = {
      database: false,
      storage: false,
      businessRules: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Test database connection
      await storage.getAllPlatforms();
      checks.database = true;
      checks.storage = true;
      checks.businessRules = true;

      return {
        success: true,
        data: {
          status: "healthy",
          checks,
          version: "1.0.0"
        }
      };

    } catch (error: any) {
      return {
        success: false,
        data: {
          status: "unhealthy",
          checks,
          error: error.message
        }
      };
    }
  }

  // Private helper methods

  private async validatePOCreation(request: POCreationRequest): Promise<AgentResponse> {
    const errors: string[] = [];

    // Check required PO fields
    if (!request.po.po_number) errors.push("PO number is required");
    if (!request.po.platform) errors.push("Platform selection is required");

    // Check line items
    if (!request.items || request.items.length === 0) {
      errors.push("At least one line item is required");
    }

    // Validate line items
    request.items.forEach((item, index) => {
      if (!item.item_name) errors.push(`Item ${index + 1}: Item name is required`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index + 1}: Valid quantity is required`);
      if (!item.basic_rate || parseFloat(item.basic_rate) <= 0) errors.push(`Item ${index + 1}: Valid basic rate is required`);
    });

    if (errors.length > 0) {
      return {
        success: false,
        error: "Validation failed",
        metadata: { errors }
      };
    }

    return { success: true };
  }

  private async applyBusinessRules(request: POCreationRequest): Promise<AgentResponse> {
    const warnings: string[] = [];

    // Check max items per order
    if (request.items.length > this.businessRules.platform.maxItemsPerOrder) {
      return {
        success: false,
        error: `Maximum ${this.businessRules.platform.maxItemsPerOrder} items allowed per order`
      };
    }

    // Check Amazon platform distributor rule
    const platforms = await storage.getAllPlatforms();
    const platform = platforms.find(p => p.id === request.po.platform);
    if (platform?.pf_name.toLowerCase().includes('amazon')) {
      if (request.po.serving_distributor !== this.businessRules.platform.amazonDistributor) {
        warnings.push(`Amazon platform should use ${this.businessRules.platform.amazonDistributor} distributor`);
      }
    }

    return {
      success: true,
      metadata: { warnings }
    };
  }

  private calculateOrderTotals(items: any[]) {
    const totals = items.reduce((acc, item) => {
      const basicAmount = parseFloat(item.basic_rate || "0") * (item.quantity || 0);
      const gstAmount = basicAmount * (parseFloat(item.gst_rate || "0") / 100);
      
      acc.totalQuantity += item.quantity || 0;
      acc.totalBasicAmount += basicAmount;
      acc.totalGstAmount += gstAmount;
      acc.totalValue += basicAmount + gstAmount;
      
      return acc;
    }, {
      totalQuantity: 0,
      totalBasicAmount: 0,
      totalGstAmount: 0,
      totalValue: 0
    });

    return totals;
  }

  private filterPlatformsByCompany(platforms: PfMst[], company: string): PfMst[] {
    const platformMapping: Record<string, string[]> = {
      "Jivo Mart": ["amazon", "flipkart", "bigbasket", "jiomart", "swiggy", "instamart"],
      "Jivo Wellness": ["blinkit", "zepto", "dunzo", "1mg", "pharmeasy", "wellness"]
    };

    const companyPlatforms = platformMapping[company] || [];
    return platforms.filter(platform => 
      companyPlatforms.some(platName => 
        platform.pf_name.toLowerCase().includes(platName.toLowerCase())
      )
    );
  }

  private filterDistributorsByPlatform(distributors: DistributorMst[], platform: PfMst): DistributorMst[] {
    // Amazon platform gets only RK WORLD
    if (platform.pf_name.toLowerCase().includes('amazon')) {
      return distributors.filter(d => 
        d.distributor_name.toUpperCase() === this.businessRules.platform.amazonDistributor
      );
    }

    // Other platforms get all distributors
    return distributors;
  }

  private groupOrdersByStatus(orders: any[]) {
    return orders.reduce((acc, order) => {
      const status = order.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private async groupOrdersByPlatform(orders: any[]) {
    const platforms = await storage.getAllPlatforms();
    const platformMap = new Map(platforms.map(p => [p.id, p.pf_name]));

    return orders.reduce((acc, order) => {
      const platformName = platformMap.get(order.platform) || 'Unknown';
      acc[platformName] = (acc[platformName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Export singleton instance
export const masterAgent = MasterAgent.getInstance();