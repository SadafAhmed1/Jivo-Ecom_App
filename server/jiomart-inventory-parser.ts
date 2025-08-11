import * as csv from 'csv-parse';

export interface JioMartInventoryRow {
  rfc_id: string;
  rfc_name: string;
  sku_id: string;
  title: string;
  category: string;
  product_status: string;
  last_updated_at: string;
  total_sellable_inv: string;
  total_unsellable_inv: string;
  fc_dmg_inv: string;
  lsp_dmg_inv: string;
  cust_dmg_inv: string;
  recvd_dmg: string;
  expired_inv: string;
  other_unsellable_inv: string;
  mtd_fwd_intransit: string;
  mtd_delvd_cust: string;
  mtd_ret_intransit: string;
  mtd_order_count: string;
}

export interface ParsedJioMartInventoryData {
  platform: string;
  businessUnit: string;
  periodType: 'daily' | 'range';
  reportDate?: string;
  periodStart?: string;
  periodEnd?: string;
  totalItems: number;
  items: JioMartInventoryRow[];
  summary: {
    totalProducts: number;
    totalSellableInventory: number;
    totalUnsellableInventory: number;
    totalIntransit: number;
    totalOrders: number;
  };
}

export async function parseJioMartInventoryCsv(
  csvContent: string,
  businessUnit: string,
  periodType: 'daily' | 'range',
  reportDate?: string,
  periodStart?: string,
  periodEnd?: string
): Promise<ParsedJioMartInventoryData> {
  
  return new Promise((resolve, reject) => {
    const items: JioMartInventoryRow[] = [];
    
    csv.parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ',',
      quote: '"',
      escape: '"',
      trim: true
    }, (err, records) => {
      if (err) {
        console.error('CSV parsing error:', err);
        reject(new Error(`Failed to parse CSV: ${err.message}`));
        return;
      }

      try {
        if (!records || records.length === 0) {
          reject(new Error('No data found in CSV file'));
          return;
        }

        // Process each record
        records.forEach((record: any, index: number) => {
          // Clean and map the record
          const item: JioMartInventoryRow = {
            rfc_id: record['RFC ID'] || '',
            rfc_name: record['RFC Name'] || '',
            sku_id: record['SKU ID'] || '',
            title: record['Title'] || '',
            category: record['Category'] || '',
            product_status: record['Product Status'] || '',
            last_updated_at: record['Last updated at'] || '',
            total_sellable_inv: record['TOTAL_SELLABLE_INV'] || '0',
            total_unsellable_inv: record['TOTAL_UNSELLABLE_INV'] || '0',
            fc_dmg_inv: record['FC_DMG_INV'] || '0',
            lsp_dmg_inv: record['LSP_DMG_INV'] || '0',
            cust_dmg_inv: record['CUST_DMG_INV'] || '0',
            recvd_dmg: record['RECVD_DMG'] || '0',
            expired_inv: record['EXPIRED_INV'] || '0',
            other_unsellable_inv: record['OTHER_UNSELLABLE_INV'] || '0',
            mtd_fwd_intransit: record['MTD_FWD_INTRANSIT'] || '0',
            mtd_delvd_cust: record['MTD_DELVD_CUST'] || '0',
            mtd_ret_intransit: record['MTD_RET_INTRANSIT'] || '0',
            mtd_order_count: record['MTD_ORDER_COUNT'] || '0'
          };

          // Validate required fields
          if (!item.sku_id) {
            console.warn(`Row ${index + 1}: Missing SKU ID, skipping`);
            return;
          }

          items.push(item);
        });

        if (items.length === 0) {
          reject(new Error('No valid inventory data found'));
          return;
        }

        // Calculate summary statistics
        const summary = {
          totalProducts: items.length,
          totalSellableInventory: items.reduce((sum, item) => sum + parseInt(item.total_sellable_inv || '0'), 0),
          totalUnsellableInventory: items.reduce((sum, item) => sum + parseInt(item.total_unsellable_inv || '0'), 0),
          totalIntransit: items.reduce((sum, item) => sum + parseInt(item.mtd_fwd_intransit || '0'), 0),
          totalOrders: items.reduce((sum, item) => sum + parseInt(item.mtd_order_count || '0'), 0)
        };

        const result: ParsedJioMartInventoryData = {
          platform: 'jiomart',
          businessUnit,
          periodType,
          reportDate,
          periodStart,
          periodEnd,
          totalItems: items.length,
          items,
          summary
        };

        console.log(`Successfully parsed ${items.length} Jio Mart inventory records`);
        resolve(result);

      } catch (error) {
        console.error('Error processing records:', error);
        reject(new Error(`Failed to process inventory data: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  });
}