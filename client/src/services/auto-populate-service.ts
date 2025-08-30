/**
 * Auto-Population Service
 * 
 * This service handles auto-population of edit forms based on upload type:
 * - Secondary Sales: from secondary_sales_header, secondary_sales_items, and SC_* tables
 * - Inventory: from INV_* tables (FlipKart, JioMart, etc.)
 * - PO: from poMaster, poLines, pf_po, pf_order_items tables
 */

interface AutoPopulateData {
  uploadType: 'secondary-sales' | 'inventory' | 'po';
  identifier: string; // Could be order number, SKU, etc.
  platform?: string; // Optional platform filter
}

interface AutoPopulatedRecord {
  found: boolean;
  data?: any;
  source: string;
  message: string;
}

export class AutoPopulateService {
  private static baseUrl = '/api';

  /**
   * Main auto-populate function that uses the new API endpoint
   */
  static async autoPopulate(params: AutoPopulateData): Promise<AutoPopulatedRecord> {
    try {
      const response = await fetch(`${this.baseUrl}/auto-populate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadType: params.uploadType,
          identifier: params.identifier,
          platform: params.platform
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return {
        found: result.found,
        data: result.data,
        source: result.source,
        message: result.message
      };

    } catch (error) {
      console.error('Auto-populate error:', error);
      return {
        found: false,
        source: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }


  /**
   * Get available tables for a given upload type
   */
  static async getAvailableTables(uploadType: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sql-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (
              (table_name LIKE 'SC_%' AND $1 = 'secondary-sales') OR
              (table_name LIKE 'INV_%' AND $1 = 'inventory') OR
              (table_name LIKE 'po_%' OR table_name LIKE 'pf_po%' AND $1 = 'po')
            )
            ORDER BY table_name
          `,
          params: [uploadType]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.map((row: any) => row.table_name);
      }
    } catch (error) {
      console.error('Failed to get available tables:', error);
    }
    return [];
  }
}

export default AutoPopulateService;