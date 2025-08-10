import { parse } from 'csv-parse';
import { InsertSwiggySecondarySalesItem } from '@shared/schema';

export interface SwiggySecondaryParseResult {
  success: boolean;
  data?: InsertSwiggySecondarySalesItem[];
  error?: string;
  totalItems?: number;
}

export function parseSwiggySecondaryData(csvContent: string, reportDate: Date, periodStart?: Date, periodEnd?: Date): Promise<SwiggySecondaryParseResult> {
  return new Promise((resolve) => {
    const results: InsertSwiggySecondarySalesItem[] = [];
    let hasError = false;
    let errorMessage = '';

    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        try {
          // Parse ordered date from CSV (expected format: YYYY-MM-DD)
          const dateStr = record['ORDERED_DATE'];
          let parsedDate: Date;
          
          if (dateStr) {
            parsedDate = new Date(dateStr);
          } else {
            parsedDate = new Date();
          }

          // Validate date
          if (isNaN(parsedDate.getTime())) {
            console.warn(`Invalid date found: ${dateStr}, skipping row`);
            return;
          }

          const item: InsertSwiggySecondarySalesItem = {
            report_date: reportDate,
            brand: record['BRAND'] || null,
            ordered_date: parsedDate,
            city: record['CITY'] || null,
            area_name: record['AREA_NAME'] || null,
            store_id: record['STORE_ID'] || null,
            l1_category: record['L1_CATEGORY'] || null,
            l2_category: record['L2_CATEGORY'] || null,
            l3_category: record['L3_CATEGORY'] || null,
            product_name: record['PRODUCT_NAME'] || null,
            variant: record['VARIANT'] || null,
            item_code: record['ITEM_CODE'] || null,
            combo: record['COMBO'] || null,
            combo_item_code: record['COMBO_ITEM_CODE'] || null,
            combo_units_sold: record['COMBO_UNITS_SOLD'] || null,
            base_mrp: record['BASE_MRP'] || null,
            units_sold: record['UNITS_SOLD'] || null,
            gmv: record['GMV'] || null,
            attachment_path: null // Will be set by calling function
          };

          // Add period information for range reports
          if (periodStart && periodEnd) {
            (item as any).period_start = periodStart;
            (item as any).period_end = periodEnd;
          }

          results.push(item);
        } catch (error) {
          console.error('Error parsing Swiggy secondary sales row:', error);
          hasError = true;
          errorMessage = `Failed to parse row: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    });

    parser.on('error', function(err) {
      console.error('CSV parsing error:', err);
      hasError = true;
      errorMessage = `CSV parsing failed: ${err.message}`;
    });

    parser.on('end', function() {
      if (hasError && results.length === 0) {
        resolve({
          success: false,
          error: errorMessage
        });
      } else {
        resolve({
          success: true,
          data: results,
          totalItems: results.length
        });
      }
    });

    parser.write(csvContent);
    parser.end();
  });
}