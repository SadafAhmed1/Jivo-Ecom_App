import Papa from "papaparse";
import { InsertZeptoInventoryDaily, InsertZeptoInventoryRange } from "@shared/schema";

interface ZeptoInventoryRow {
  "City": string;
  "SKU Name": string;
  "SKU Code": string;
  "EAN": string;
  "SKU Category": string;
  "SKU Sub Category": string;
  "Brand Name": string;
  "Manufacturer Name": string;
  "Manufacturer ID": string;
  "Units": string;
}

export function parseZeptoInventory(csvContent: string, reportDate?: Date, periodStart?: Date, periodEnd?: Date): {
  dailyData: InsertZeptoInventoryDaily[];
  rangeData: InsertZeptoInventoryRange[];
  summary: {
    totalRecords: number;
    totalUnits: number;
    uniqueCities: number;
    uniqueSKUs: number;
  };
} {
  console.log("Starting Zepto inventory CSV parsing...");

  const parseResult = Papa.parse<ZeptoInventoryRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    delimiter: ",",
    quoteChar: '"'
  });

  if (parseResult.errors.length > 0) {
    console.error("CSV parsing errors:", parseResult.errors);
    throw new Error(`CSV parsing failed: ${parseResult.errors[0]?.message || 'Unknown error'}`);
  }

  const rows = parseResult.data;
  console.log(`Found ${rows.length} Zepto inventory rows`);

  const dailyData: InsertZeptoInventoryDaily[] = [];
  const rangeData: InsertZeptoInventoryRange[] = [];
  
  let totalUnits = 0;
  const uniqueCities = new Set<string>();
  const uniqueSKUs = new Set<string>();

  for (const row of rows) {
    // Skip rows with missing essential data
    if (!row["City"] && !row["SKU Name"] && !row["SKU Code"]) {
      continue;
    }

    const units = parseInt(row["Units"] || "0", 10) || 0;
    totalUnits += units;
    
    if (row["City"]) uniqueCities.add(row["City"]);
    if (row["SKU Code"]) uniqueSKUs.add(row["SKU Code"]);

    // Create daily record
    if (reportDate) {
      const dailyRecord: InsertZeptoInventoryDaily = {
        report_date: reportDate,
        city: row["City"] || null,
        sku_name: row["SKU Name"] || null,
        sku_code: row["SKU Code"] || null,
        ean: row["EAN"] || null,
        sku_category: row["SKU Category"] || null,
        sku_sub_category: row["SKU Sub Category"] || null,
        brand_name: row["Brand Name"] || null,
        manufacturer_name: row["Manufacturer Name"] || null,
        manufacturer_id: row["Manufacturer ID"] || null,
        units: units
      };
      dailyData.push(dailyRecord);
    }

    // Create range record
    if (periodStart && periodEnd) {
      const rangeRecord: InsertZeptoInventoryRange = {
        period_start: periodStart,
        period_end: periodEnd,
        city: row["City"] || null,
        sku_name: row["SKU Name"] || null,
        sku_code: row["SKU Code"] || null,
        ean: row["EAN"] || null,
        sku_category: row["SKU Category"] || null,
        sku_sub_category: row["SKU Sub Category"] || null,
        brand_name: row["Brand Name"] || null,
        manufacturer_name: row["Manufacturer Name"] || null,
        manufacturer_id: row["Manufacturer ID"] || null,
        units: units
      };
      rangeData.push(rangeRecord);
    }
  }

  console.log(`Successfully processed ${dailyData.length + rangeData.length} Zepto inventory records`);

  return {
    dailyData,
    rangeData,
    summary: {
      totalRecords: rows.length,
      totalUnits,
      uniqueCities: uniqueCities.size,
      uniqueSKUs: uniqueSKUs.size
    }
  };
}

export function validateZeptoInventoryData(data: any[]): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }

  // Check if it has the required Zepto columns
  const requiredColumns = ["City", "SKU Name", "SKU Code", "Brand Name", "Units"];
  const firstRow = data[0];
  
  if (!firstRow || typeof firstRow !== 'object') {
    return false;
  }

  return requiredColumns.some(col => col in firstRow);
}