import { parse } from 'csv-parse/sync';

export interface SwiggyInventoryData {
  platform: string;
  businessUnit: string;
  periodType: string;
  items: SwiggyInventoryRecord[];
  summary: {
    totalItems: number;
    totalWarehouseQty: number;
    totalOpenPoQty: number;
    totalPotentialGmvLoss: number;
    uniqueFacilities: number;
    uniqueCities: number;
  };
  reportDate?: Date;
  periodStart?: Date;
  periodEnd?: Date;
}

export interface SwiggyInventoryRecord {
  storage_type: string;
  facility_name: string;
  city: string;
  sku_code: string;
  sku_description: string;
  l1_category: string;
  l2_category: string;
  shelf_life_days?: number;
  business_category: string;
  days_on_hand?: number;
  potential_gmv_loss?: number;
  open_pos?: string;
  open_po_quantity?: number;
  warehouse_qty_available?: number;
}

export function parseSwiggyInventoryCsv(
  csvContent: string,
  businessUnit: string,
  periodType: string,
  reportDate?: Date,
  periodStart?: Date,
  periodEnd?: Date
): SwiggyInventoryData {
  console.log("Parsing Swiggy inventory CSV...");
  
  try {
    // Parse CSV with headers
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Record<string, string>[];

    console.log(`Processing ${records.length} records from Swiggy inventory file`);

    if (records.length === 0) {
      throw new Error("No data found in CSV file");
    }

    // Log the first record to see the structure
    console.log("First record keys:", Object.keys(records[0]));
    console.log("Sample record:", records[0]);

    const items: SwiggyInventoryRecord[] = [];
    let totalWarehouseQty = 0;
    let totalOpenPoQty = 0;
    let totalPotentialGmvLoss = 0;
    const facilities = new Set<string>();
    const cities = new Set<string>();

    for (const record of records) {
      try {
        // Parse numeric values safely
        const shelfLifeDays = record.ShelfLifeDays ? parseInt(record.ShelfLifeDays) : undefined;
        const daysOnHand = record.DaysOnHand ? parseInt(record.DaysOnHand) : undefined;
        const potentialGmvLoss = record.PotentialGmvLoss ? parseFloat(record.PotentialGmvLoss) : undefined;
        const openPoQuantity = record.OpenPoQuantity ? parseInt(record.OpenPoQuantity) : undefined;
        const warehouseQtyAvailable = record.WarehouseQtyAvailable ? parseInt(record.WarehouseQtyAvailable) : undefined;

        // Clean and format Open POs field
        let cleanOpenPos = record.OpenPos || '';
        if (cleanOpenPos && cleanOpenPos !== '[]') {
          // Remove square brackets and extra quotes if present
          cleanOpenPos = cleanOpenPos.replace(/^\[|\]$/g, '').replace(/"/g, '');
        } else if (cleanOpenPos === '[]') {
          cleanOpenPos = '';
        }

        const inventoryItem: SwiggyInventoryRecord = {
          storage_type: record.StorageType || '',
          facility_name: record.FacilityName || '',
          city: record.City || '',
          sku_code: record.SkuCode || '',
          sku_description: record.SkuDescription || '',
          l1_category: record.L1 || '',
          l2_category: record.L2 || '',
          shelf_life_days: shelfLifeDays,
          business_category: record.BusinessCategory || '',
          days_on_hand: daysOnHand,
          potential_gmv_loss: potentialGmvLoss,
          open_pos: cleanOpenPos,
          open_po_quantity: openPoQuantity,
          warehouse_qty_available: warehouseQtyAvailable
        };

        items.push(inventoryItem);

        // Update totals for summary
        if (warehouseQtyAvailable) totalWarehouseQty += warehouseQtyAvailable;
        if (openPoQuantity) totalOpenPoQty += openPoQuantity;
        if (potentialGmvLoss) totalPotentialGmvLoss += potentialGmvLoss;
        
        // Track unique facilities and cities
        if (record.FacilityName) facilities.add(record.FacilityName);
        if (record.City) cities.add(record.City);

      } catch (itemError) {
        console.error("Error processing Swiggy inventory item:", itemError, record);
        // Continue processing other items
      }
    }

    console.log(`Successfully processed ${items.length} Swiggy inventory items`);

    const result: SwiggyInventoryData = {
      platform: "swiggy",
      businessUnit,
      periodType,
      items,
      summary: {
        totalItems: items.length,
        totalWarehouseQty,
        totalOpenPoQty,
        totalPotentialGmvLoss,
        uniqueFacilities: facilities.size,
        uniqueCities: cities.size
      },
      reportDate,
      periodStart,
      periodEnd
    };

    console.log("Swiggy inventory parsing completed successfully");
    console.log("Summary:", result.summary);

    return result;

  } catch (error) {
    console.error("Error parsing Swiggy inventory CSV:", error);
    throw new Error(`Failed to parse Swiggy inventory CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}