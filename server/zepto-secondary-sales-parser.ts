import { parse } from 'csv-parse';
import { InsertZeptoSecondarySalesItem } from '@shared/schema';

export interface ZeptoSecondaryParseResult {
  success: boolean;
  data?: InsertZeptoSecondarySalesItem[];
  error?: string;
  totalItems?: number;
}

export function parseZeptoSecondaryData(csvContent: string, reportDate: Date, periodStart?: Date, periodEnd?: Date): Promise<ZeptoSecondaryParseResult> {
  return new Promise((resolve) => {
    const results: InsertZeptoSecondarySalesItem[] = [];
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
          // Parse date from CSV (expected format: DD-MM-YYYY)
          const dateStr = record['Date'];
          let parsedDate: Date;
          
          if (dateStr && dateStr.includes('-')) {
            const [day, month, year] = dateStr.split('-');
            parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            parsedDate = new Date(dateStr);
          }

          // Validate date
          if (isNaN(parsedDate.getTime())) {
            console.warn(`Invalid date found: ${dateStr}, skipping row`);
            return;
          }

          const item: InsertZeptoSecondarySalesItem = {
            report_date: reportDate,
            date: parsedDate,
            sku_number: record['SKU Number'] || null,
            sku_name: record['SKU Name'] || null,
            ean: record['EAN'] || null,
            sku_category: record['SKU Category'] || null,
            sku_sub_category: record['SKU Sub Category'] || null,
            brand_name: record['Brand Name'] || null,
            manufacturer_name: record['Manufacturer Name'] || null,
            manufacturer_id: record['Manufacturer ID'] || null,
            city: record['City'] || null,
            sales_qty_units: record['Sales (Qty) - Units'] ? parseInt(record['Sales (Qty) - Units']) : null,
            mrp: record['MRP'] ? String(parseFloat(record['MRP'])) : null,
            gmv: record['Gross Merchandise Value'] ? String(parseFloat(record['Gross Merchandise Value'])) : null,
            attachment_path: null // Will be set by calling function
          };

          // Add period information for range reports
          if (periodStart && periodEnd) {
            (item as any).period_start = periodStart;
            (item as any).period_end = periodEnd;
          }

          results.push(item);
        } catch (error) {
          console.error('Error parsing Zepto secondary sales row:', error);
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