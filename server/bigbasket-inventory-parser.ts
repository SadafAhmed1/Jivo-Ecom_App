import { parse } from 'csv-parse/sync';

export interface BigBasketInventoryItem {
  city: string;
  sku_id: string;
  brand_name: string;
  sku_name: string;
  sku_weight: string;
  sku_pack_type: string;
  sku_description: string;
  top_category_name: string;
  mid_category_name: string;
  leaf_category_name: string;
  soh: number;
  soh_value: number;
}

export function parseBigBasketInventoryCsv(csvContent: string): BigBasketInventoryItem[] {
  console.log('Starting BigBasket inventory CSV parsing...');
  
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ',',
      trim: true
    });
    
    console.log(`Found ${records.length} BigBasket inventory rows`);
    
    const items: BigBasketInventoryItem[] = [];
    
    for (const record of records) {
      // Parse numeric values safely
      const soh = parseFloat(record.soh) || 0;
      const soh_value = parseFloat(record.soh_value) || 0;
      
      const item: BigBasketInventoryItem = {
        city: record.city || '',
        sku_id: record.sku_id || '',
        brand_name: record.brand_name || '',
        sku_name: record.sku_name || '',
        sku_weight: record.sku_weight || '',
        sku_pack_type: record.sku_pack_type || '',
        sku_description: record.sku_description || '',
        top_category_name: record.top_category_name || '',
        mid_category_name: record.mid_category_name || '',
        leaf_category_name: record.leaf_category_name || '',
        soh,
        soh_value
      };
      
      items.push(item);
    }
    
    console.log(`Successfully processed ${items.length} BigBasket inventory records`);
    return items;
  } catch (error) {
    console.error('Error parsing BigBasket inventory CSV:', error);
    throw new Error(`Failed to parse BigBasket inventory CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}