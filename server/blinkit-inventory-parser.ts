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

        console.log(`Processing ${records.length} records from Blinkit inventory CSV`);
        console.log('First record keys:', Object.keys(records[0] || {}));
        
        // Process each record
        for (const record of records) {
          // Cast record to any to handle dynamic property access
          const recordData = record as any;
          
          // Debug: Log first few records to understand structure
          if (items.length < 3) {
            console.log(`Record ${items.length + 1}:`, recordData);
          }
          
          // Skip empty rows - check multiple possible field names
          const hasSkuId = recordData.sku_id || recordData.SKU_ID || recordData['SKU ID'] || recordData.item_id || recordData.Item_ID;
          const hasProductName = recordData.product_name || recordData.Product_Name || recordData['Product Name'] || recordData.item_name || recordData.Item_Name;
          
          if (!hasSkuId && !hasProductName) {
            console.log('Skipping empty row:', recordData);
            continue;
          }

          const item: BlinkitInventoryRow = {
            sku_id: recordData.sku_id || recordData.SKU_ID || recordData['SKU ID'] || recordData.item_id || recordData.Item_ID || '',
            product_name: recordData.product_name || recordData.Product_Name || recordData['Product Name'] || recordData.item_name || recordData.Item_Name || '',
            category: recordData.category || recordData.Category || '',
            subcategory: recordData.subcategory || recordData.Subcategory || recordData['Sub Category'] || '',
            brand: recordData.brand || recordData.Brand || recordData.manufacturer_name || recordData.Manufacturer_Name || '',
            size: recordData.size || recordData.Size || '',
            unit: recordData.unit || recordData.Unit || '',
            stock_on_hand: recordData.stock_on_hand || recordData.Stock_On_Hand || recordData['Stock on Hand'] || recordData.qty_sold || '0',
            reserved_quantity: recordData.reserved_quantity || recordData.Reserved_Quantity || recordData['Reserved Quantity'] || '0',
            available_quantity: recordData.available_quantity || recordData.Available_Quantity || recordData['Available Quantity'] || '0',
            inbound_quantity: recordData.inbound_quantity || recordData.Inbound_Quantity || recordData['Inbound Quantity'] || '0',
            outbound_quantity: recordData.outbound_quantity || recordData.Outbound_Quantity || recordData['Outbound Quantity'] || '0',
            damaged_quantity: recordData.damaged_quantity || recordData.Damaged_Quantity || recordData['Damaged Quantity'] || '0',
            expired_quantity: recordData.expired_quantity || recordData.Expired_Quantity || recordData['Expired Quantity'] || '0',
            last_updated_at: recordData.last_updated_at || recordData.Last_Updated_At || recordData['Last Updated'] || recordData.date || '',
            warehouse_location: recordData.warehouse_location || recordData.Warehouse_Location || recordData['Warehouse Location'] || recordData.city_name || recordData.City_Name || '',
            supplier_name: recordData.supplier_name || recordData.Supplier_Name || recordData['Supplier Name'] || recordData.manufacturer_name || recordData.Manufacturer_Name || ''
          };

          items.push(item);
        }

        if (items.length === 0) {
          console.log('No valid items found. Total records processed:', records.length);
          reject(new Error('No valid inventory records found in CSV. Please ensure your CSV has columns like sku_id, product_name, stock_on_hand, etc.'));
          return;
        }

        console.log(`Successfully processed ${items.length} Blinkit inventory items`);

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