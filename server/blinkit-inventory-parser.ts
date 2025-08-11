import * as csv from 'csv-parse';

export interface BlinkitInventoryRow {
  sku_id: string;
  product_name: string;
  category: string;
  subcategory: string;
  brand: string;
  size: string;
  unit: string;
  stock_on_hand: string;
  reserved_quantity: string;
  available_quantity: string;
  inbound_quantity: string;
  outbound_quantity: string;
  damaged_quantity: string;
  expired_quantity: string;
  last_updated_at: string;
  warehouse_location: string;
  supplier_name: string;
}

export interface ParsedBlinkitInventoryData {
  platform: string;
  businessUnit: string;
  periodType: 'daily' | 'range';
  reportDate?: string;
  periodStart?: string;
  periodEnd?: string;
  totalItems: number;
  items: BlinkitInventoryRow[];
  summary: {
    totalProducts: number;
    totalStockOnHand: number;
    totalAvailableQuantity: number;
    totalReservedQuantity: number;
    totalDamagedQuantity: number;
    totalExpiredQuantity: number;
  };
}

export async function parseBlinkitInventoryCsv(
  csvContent: string,
  businessUnit: string,
  periodType: 'daily' | 'range',
  reportDate?: Date,
  periodStart?: Date | null,
  periodEnd?: Date | null
): Promise<ParsedBlinkitInventoryData> {
  
  return new Promise((resolve, reject) => {
    const items: BlinkitInventoryRow[] = [];
    
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
        for (const record of records) {
          // Skip empty rows
          if (!record.sku_id && !record.product_name) {
            continue;
          }

          const item: BlinkitInventoryRow = {
            sku_id: record.sku_id || record.SKU_ID || record['SKU ID'] || '',
            product_name: record.product_name || record.Product_Name || record['Product Name'] || '',
            category: record.category || record.Category || '',
            subcategory: record.subcategory || record.Subcategory || record['Sub Category'] || '',
            brand: record.brand || record.Brand || '',
            size: record.size || record.Size || '',
            unit: record.unit || record.Unit || '',
            stock_on_hand: record.stock_on_hand || record.Stock_On_Hand || record['Stock on Hand'] || '0',
            reserved_quantity: record.reserved_quantity || record.Reserved_Quantity || record['Reserved Quantity'] || '0',
            available_quantity: record.available_quantity || record.Available_Quantity || record['Available Quantity'] || '0',
            inbound_quantity: record.inbound_quantity || record.Inbound_Quantity || record['Inbound Quantity'] || '0',
            outbound_quantity: record.outbound_quantity || record.Outbound_Quantity || record['Outbound Quantity'] || '0',
            damaged_quantity: record.damaged_quantity || record.Damaged_Quantity || record['Damaged Quantity'] || '0',
            expired_quantity: record.expired_quantity || record.Expired_Quantity || record['Expired Quantity'] || '0',
            last_updated_at: record.last_updated_at || record.Last_Updated_At || record['Last Updated'] || '',
            warehouse_location: record.warehouse_location || record.Warehouse_Location || record['Warehouse Location'] || '',
            supplier_name: record.supplier_name || record.Supplier_Name || record['Supplier Name'] || ''
          };

          items.push(item);
        }

        if (items.length === 0) {
          reject(new Error('No valid inventory records found in CSV'));
          return;
        }

        // Calculate summary statistics
        const totalStockOnHand = items.reduce((sum, item) => sum + (parseInt(item.stock_on_hand) || 0), 0);
        const totalAvailableQuantity = items.reduce((sum, item) => sum + (parseInt(item.available_quantity) || 0), 0);
        const totalReservedQuantity = items.reduce((sum, item) => sum + (parseInt(item.reserved_quantity) || 0), 0);
        const totalDamagedQuantity = items.reduce((sum, item) => sum + (parseInt(item.damaged_quantity) || 0), 0);
        const totalExpiredQuantity = items.reduce((sum, item) => sum + (parseInt(item.expired_quantity) || 0), 0);

        const result: ParsedBlinkitInventoryData = {
          platform: 'blinkit',
          businessUnit,
          periodType,
          reportDate: reportDate?.toISOString(),
          periodStart: periodStart?.toISOString(),
          periodEnd: periodEnd?.toISOString(),
          totalItems: items.length,
          items,
          summary: {
            totalProducts: items.length,
            totalStockOnHand,
            totalAvailableQuantity,
            totalReservedQuantity,
            totalDamagedQuantity,
            totalExpiredQuantity
          }
        };

        console.log(`Successfully parsed ${items.length} Blinkit inventory records`);
        resolve(result);

      } catch (error) {
        console.error('Error processing Blinkit inventory CSV data:', error);
        reject(new Error(`Failed to process inventory data: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  });
}