import { apiRequest } from "@/lib/queryClient";

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface POCreationRequest {
  po: {
    company?: string;
    po_number: string;
    platform: number;
    status: string;
    order_date: string;
    expiry_date?: string;
    appointment_date?: string;
    region: string;
    state: string;
    city: string;
    area?: string;
    serving_distributor?: string;
    dispatch_from?: string;
    warehouse?: string;
    attachment?: string;
  };
  items: {
    item_name: string;
    quantity: number;
    sap_code?: string;
    category?: string;
    subcategory?: string;
    basic_rate: string;
    gst_rate: string;
    landing_rate?: string;
    total_litres?: string;
    hsn_code?: string;
  }[];
}

/**
 * Master Agent Service
 * Client-side service to interact with the backend Master Agent
 */
export class MasterAgentService {
  private static instance: MasterAgentService;
  private baseUrl = '/api/agent';

  private constructor() {}

  public static getInstance(): MasterAgentService {
    if (!MasterAgentService.instance) {
      MasterAgentService.instance = new MasterAgentService();
    }
    return MasterAgentService.instance;
  }

  /**
   * Create Purchase Order using Master Agent
   */
  async createPurchaseOrder(request: POCreationRequest): Promise<AgentResponse> {
    try {
      const response = await apiRequest('POST', `${this.baseUrl}/purchase-orders`, request);
      const data = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Master Agent PO Creation Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create purchase order'
      };
    }
  }

  /**
   * Get platforms with company filtering
   */
  async getPlatforms(company?: string): Promise<AgentResponse> {
    try {
      const url = company 
        ? `${this.baseUrl}/platforms?company=${encodeURIComponent(company)}`
        : `${this.baseUrl}/platforms`;

      const response = await apiRequest('GET', url);
      const data = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Master Agent Platforms Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch platforms'
      };
    }
  }

  /**
   * Get distributors for specific platform
   */
  async getDistributors(platformId: number): Promise<AgentResponse> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/distributors/${platformId}`);
      const data = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Master Agent Distributors Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch distributors'
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
  }): Promise<AgentResponse> {
    try {
      const params = new URLSearchParams();
      if (query.platformId) params.append('platformId', query.platformId.toString());
      if (query.search) params.append('search', query.search);
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.offset) params.append('offset', query.offset.toString());

      const url = `${this.baseUrl}/platform-items?${params.toString()}`;
      const response = await apiRequest('GET', url);
      const data = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Master Agent Platform Items Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to search platform items'
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
  }): Promise<AgentResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.platform) params.append('platform', filters.platform.toString());
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);

      const url = `${this.baseUrl}/analytics?${params.toString()}`;
      const response = await apiRequest('GET', url);
      const data = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Master Agent Analytics Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch analytics'
      };
    }
  }

  /**
   * System health check
   */
  async healthCheck(): Promise<AgentResponse> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/health`);
      const data = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Master Agent Health Check Error:', error);
      return {
        success: false,
        error: error.message || 'Health check failed'
      };
    }
  }

  /**
   * Validate PO data without creating
   */
  async validatePO(request: POCreationRequest): Promise<AgentResponse> {
    try {
      const response = await apiRequest('POST', `${this.baseUrl}/validate-po`, request);
      const data = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Master Agent PO Validation Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to validate PO'
      };
    }
  }

  /**
   * Batch operations - validate multiple POs
   */
  async validateMultiplePOs(requests: POCreationRequest[]): Promise<AgentResponse[]> {
    const results: AgentResponse[] = [];
    
    for (const request of requests) {
      const result = await this.validatePO(request);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get system status with comprehensive information
   */
  async getSystemStatus(): Promise<{
    health: AgentResponse;
    analytics: AgentResponse;
    platformCount: number;
  }> {
    try {
      const [health, platforms] = await Promise.all([
        this.healthCheck(),
        this.getPlatforms()
      ]);

      // Get basic analytics
      const analytics = await this.getOrderAnalytics();

      return {
        health,
        analytics,
        platformCount: platforms.data?.length || 0
      };
    } catch (error) {
      console.error('System Status Error:', error);
      return {
        health: { success: false, error: 'Health check failed' },
        analytics: { success: false, error: 'Analytics failed' },
        platformCount: 0
      };
    }
  }
}

// Export singleton instance
export const masterAgentService = MasterAgentService.getInstance();

// React Query keys for caching
export const masterAgentKeys = {
  all: ['masterAgent'] as const,
  platforms: (company?: string) => [...masterAgentKeys.all, 'platforms', company] as const,
  distributors: (platformId: number) => [...masterAgentKeys.all, 'distributors', platformId] as const,
  platformItems: (query: any) => [...masterAgentKeys.all, 'platformItems', query] as const,
  analytics: (filters?: any) => [...masterAgentKeys.all, 'analytics', filters] as const,
  health: () => [...masterAgentKeys.all, 'health'] as const,
};

// Helper function to use with React Query
export function useMasterAgent() {
  return {
    service: masterAgentService,
    keys: masterAgentKeys,
  };
}