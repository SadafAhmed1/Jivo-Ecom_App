import { apiRequest } from "@/lib/queryClient";

export interface SqlResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  metadata?: {
    recordCount?: number;
    executionTime?: number;
    [key: string]: any;
  };
}

export interface SqlConnectionStatus {
  isConnected: boolean;
  server: string;
  database: string;
  user: string;
  responseTime?: number;
}

export interface ItemSearchRequest {
  search: string;
  limit?: number;
  platformId?: number;
}

export interface QueryRequest {
  query: string;
  params?: Record<string, any>;
}

export interface StoredProcedureRequest {
  procedureName: string;
  params?: Record<string, {
    type: string;
    value: any;
  }>;
}

/**
 * SQL Server Service
 * Client-side service for SQL Server operations
 */
export class SqlService {
  private static instance: SqlService;
  private baseUrl = '/api/sql';

  private constructor() {}

  public static getInstance(): SqlService {
    if (!SqlService.instance) {
      SqlService.instance = new SqlService();
    }
    return SqlService.instance;
  }

  /**
   * Test SQL Server connection
   */
  async healthCheck(): Promise<SqlResponse<SqlConnectionStatus>> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/health`);
      return await response.json();
    } catch (error: any) {
      console.error('SQL health check error:', error);
      return {
        success: false,
        error: error.message || 'Health check failed'
      };
    }
  }

  /**
   * Get connection status
   */
  async getStatus(): Promise<SqlResponse<SqlConnectionStatus>> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/status`);
      return await response.json();
    } catch (error: any) {
      console.error('SQL status error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get status'
      };
    }
  }

  /**
   * Get item details from SAP system
   */
  async getItemDetails(): Promise<SqlResponse<any[]>> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/items`);
      return await response.json();
    } catch (error: any) {
      console.error('Get item details error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get item details'
      };
    }
  }

  /**
   * Get items from HANA DB via stored procedure
   */
  async getHanaItems(): Promise<SqlResponse<any[]>> {
    try {
      // Try the new HANA endpoint first
      const response = await apiRequest('GET', '/api/hana/items');
      return await response.json();
    } catch (error: any) {
      console.error('Get HANA items error:', error);
      
      // Fallback to old endpoint
      try {
        const response = await apiRequest('GET', `${this.baseUrl}/hana-items`);
        return await response.json();
      } catch (fallbackError: any) {
        return {
          success: false,
          error: error.message || 'Failed to get HANA items'
        };
      }
    }
  }

  /**
   * Test HANA connection and stored procedure
   */
  async testHanaConnection(): Promise<SqlResponse<any>> {
    try {
      const response = await apiRequest('GET', '/api/hana/test-connection');
      return await response.json();
    } catch (error: any) {
      console.error('Test HANA connection error:', error);
      return {
        success: false,
        error: error.message || 'Failed to test HANA connection'
      };
    }
  }

  /**
   * Test stored procedure directly
   */
  async testStoredProcedure(): Promise<SqlResponse<any>> {
    try {
      const response = await apiRequest('GET', '/api/hana/test-procedure');
      return await response.json();
    } catch (error: any) {
      console.error('Test stored procedure error:', error);
      return {
        success: false,
        error: error.message || 'Failed to test stored procedure'
      };
    }
  }

  /**
   * Search HANA items with filtering
   */
  async searchHanaItems(request: ItemSearchRequest): Promise<SqlResponse<any[]>> {
    try {
      // Try the new HANA endpoint first
      console.log('Searching HANA items with request:', request);
      
      const response = await apiRequest('POST', '/api/hana/search', request);
      const data = await response.json();
      console.log('HANA search response:', data);
      return data;
    } catch (error: any) {
      console.error('Search HANA items error:', error);
      
      // Fallback to old endpoint
      try {
        const response = await apiRequest('POST', `${this.baseUrl}/search-hana-items`, request);
        return await response.json();
      } catch (fallbackError: any) {
        console.error('Fallback search also failed:', fallbackError);
        return {
          success: false,
          error: error.message || 'Failed to search HANA items'
        };
      }
    }
  }

  /**
   * Search items by criteria
   */
  async searchItems(request: ItemSearchRequest): Promise<SqlResponse<any[]>> {
    try {
      const response = await apiRequest('POST', `${this.baseUrl}/search-items`, request);
      return await response.json();
    } catch (error: any) {
      console.error('Search items error:', error);
      return {
        success: false,
        error: error.message || 'Failed to search items'
      };
    }
  }

  /**
   * Get platform-specific items
   */
  async getPlatformItems(platformCode?: string): Promise<SqlResponse<any[]>> {
    try {
      const url = platformCode 
        ? `${this.baseUrl}/platform-items?platformCode=${encodeURIComponent(platformCode)}`
        : `${this.baseUrl}/platform-items`;

      const response = await apiRequest('GET', url);
      return await response.json();
    } catch (error: any) {
      console.error('Get platform items error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get platform items'
      };
    }
  }

  /**
   * Execute custom SQL query (development only)
   */
  async executeQuery(request: QueryRequest): Promise<SqlResponse<any[]>> {
    try {
      const response = await apiRequest('POST', `${this.baseUrl}/query`, request);
      return await response.json();
    } catch (error: any) {
      console.error('Execute query error:', error);
      return {
        success: false,
        error: error.message || 'Failed to execute query'
      };
    }
  }

  /**
   * Execute stored procedure
   */
  async executeStoredProcedure(request: StoredProcedureRequest): Promise<SqlResponse<any[]>> {
    try {
      const response = await apiRequest('POST', `${this.baseUrl}/stored-procedure`, request);
      return await response.json();
    } catch (error: any) {
      console.error('Execute stored procedure error:', error);
      return {
        success: false,
        error: error.message || 'Failed to execute stored procedure'
      };
    }
  }

  /**
   * Get database schema information
   */
  async getTableInfo(tableName?: string): Promise<SqlResponse<any[]>> {
    try {
      const url = tableName 
        ? `${this.baseUrl}/table-info?tableName=${encodeURIComponent(tableName)}`
        : `${this.baseUrl}/table-info`;

      const response = await apiRequest('GET', url);
      return await response.json();
    } catch (error: any) {
      console.error('Get table info error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get table information'
      };
    }
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(): Promise<SqlResponse<any>> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/performance`);
      return await response.json();
    } catch (error: any) {
      console.error('Get performance stats error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get performance statistics'
      };
    }
  }

  /**
   * Batch item search with different criteria
   */
  async batchSearchItems(searchTerms: string[], limit: number = 20): Promise<SqlResponse<any[]>[]> {
    const results: SqlResponse<any[]>[] = [];
    
    for (const searchTerm of searchTerms) {
      const result = await this.searchItems({ search: searchTerm, limit });
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get comprehensive system overview
   */
  async getSystemOverview(): Promise<{
    status: SqlResponse<SqlConnectionStatus>;
    performance: SqlResponse<any>;
    itemCount: number;
  }> {
    try {
      const [status, performance, items] = await Promise.all([
        this.healthCheck(),
        this.getPerformanceStats(),
        this.getItemDetails()
      ]);

      return {
        status,
        performance,
        itemCount: items.data?.length || 0
      };
    } catch (error) {
      console.error('System overview error:', error);
      return {
        status: { success: false, error: 'Status check failed' },
        performance: { success: false, error: 'Performance check failed' },
        itemCount: 0
      };
    }
  }
}

// Export singleton instance
export const sqlService = SqlService.getInstance();

// React Query keys for caching
export const sqlQueryKeys = {
  all: ['sql'] as const,
  health: () => [...sqlQueryKeys.all, 'health'] as const,
  status: () => [...sqlQueryKeys.all, 'status'] as const,
  items: () => [...sqlQueryKeys.all, 'items'] as const,
  hanaItems: () => [...sqlQueryKeys.all, 'hanaItems'] as const,
  searchHanaItems: (search: string, limit?: number, platformId?: number) => [...sqlQueryKeys.all, 'searchHanaItems', search, limit, platformId] as const,
  searchItems: (search: string, limit?: number) => [...sqlQueryKeys.all, 'searchItems', search, limit] as const,
  platformItems: (platformCode?: string) => [...sqlQueryKeys.all, 'platformItems', platformCode] as const,
  tableInfo: (tableName?: string) => [...sqlQueryKeys.all, 'tableInfo', tableName] as const,
  performance: () => [...sqlQueryKeys.all, 'performance'] as const,
};

// Helper function to use with React Query
export function useSqlService() {
  return {
    service: sqlService,
    keys: sqlQueryKeys,
  };
}