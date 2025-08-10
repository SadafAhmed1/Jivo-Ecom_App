import { parse } from 'csv-parse';
import { InsertBlinkitSecondarySalesItem } from '@shared/schema';

export interface BlinkitSecondaryParseResult {
  success: boolean;
  data?: InsertBlinkitSecondarySalesItem[];
  error?: string;
  totalItems?: number;
}

export function parseBlinkitSecondaryData(csvContent: string, reportDate: Date, periodStart?: Date, periodEnd?: Date): Promise<BlinkitSecondaryParseResult> {
  return new Promise((resolve) => {
    const results: InsertBlinkitSecondarySalesItem[] = [];
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
          // Parse date from CSV (expected format: YYYY-MM-DD)
          const dateStr = record['date'];
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

          const item: InsertBlinkitSecondarySalesItem = {
            report_date: reportDate,
            item_id: record['item_id'] || null,
            item_name: record['item_name'] || null,
            manufacturer_id: record['manufacturer_id'] ? String(record['manufacturer_id']) : null,
            manufacturer_name: record['manufacturer_name'] || null,
            city_id: record['city_id'] ? String(record['city_id']) : null,
            city_name: record['city_name'] || null,
            category: record['category'] || null,
            date: parsedDate,
            qty_sold: record['qty_sold'] ? String(parseFloat(record['qty_sold'])) : null,
            mrp: record['mrp'] ? String(parseFloat(record['mrp'])) : null,
            attachment_path: null // Will be set by calling function
          };

          // Add period information for range reports
          if (periodStart && periodEnd) {
            (item as any).period_start = periodStart;
            (item as any).period_end = periodEnd;
          }

          results.push(item);
        } catch (error) {
          console.error('Error parsing Blinkit secondary sales row:', error);
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