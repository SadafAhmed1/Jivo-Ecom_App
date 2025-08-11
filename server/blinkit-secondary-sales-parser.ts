import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

export interface BlinkitSecondarySalesItem {
  item_id: string;
  item_name: string;
  manufacturer_id: string;
  manufacturer_name: string;
  city_id: string;
  city_name: string;
  category: string;
  date: string;
  qty_sold: number;
  mrp: number;
}

export interface BlinkitSecondarySalesData {
  platform: "blinkit";
  businessUnit: string;
  periodType: "daily" | "date-range";
  reportDate?: string;
  periodStart?: string;
  periodEnd?: string;
  totalItems: number;
  items: BlinkitSecondarySalesItem[];
  summary?: {
    totalQtySold: number;
    totalSalesValue: number;
    uniqueProducts: number;
  };
}

export function parseBlinkitSecondarySalesFile(
  buffer: Buffer, 
  filename: string,
  businessUnit: string,
  periodType: "daily" | "date-range",
  reportDate?: string,
  periodStart?: string,
  periodEnd?: string
): BlinkitSecondarySalesData {
  let records: any[];

  try {
    if (filename.toLowerCase().endsWith('.csv')) {
      const content = buffer.toString('utf-8');
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } else if (filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      records = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Convert array format to object format with headers
      if (records.length > 0) {
        const headers = records[0] as string[];
        records = records.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = (row as any[])[index];
          });
          return obj;
        });
      }
    } else {
      throw new Error('Unsupported file format. Please upload CSV or Excel files.');
    }

    console.log('Blinkit CSV Records Sample:', records.slice(0, 3));
    console.log('Expected headers: item_id, item_name, manufacturer_id, manufacturer_name, city_id, city_name, category, date, qty_sold, mrp');

    // Parse and validate items
    const items: BlinkitSecondarySalesItem[] = records
      .filter(record => record && typeof record === 'object')
      .map((record, index) => {
        try {
          // Handle different possible column names and formats
          const dateValue = String(record.date || record['Date'] || '').trim();
          const parsedDate = dateValue ? new Date(dateValue) : new Date();
          
          const item: BlinkitSecondarySalesItem = {
            item_id: String(record.item_id || record['Item ID'] || '').trim(),
            item_name: String(record.item_name || record['Item Name'] || '').trim(),
            manufacturer_id: String(record.manufacturer_id || record['Manufacturer ID'] || '').trim(),
            manufacturer_name: String(record.manufacturer_name || record['Manufacturer Name'] || '').trim(),
            city_id: String(record.city_id || record['City ID'] || '').trim(),
            city_name: String(record.city_name || record['City Name'] || '').trim(),
            category: String(record.category || record['Category'] || '').trim(),
            date: dateValue,
            qty_sold: parseFloat(record.qty_sold || record['Qty Sold'] || '0') || 0,
            mrp: parseFloat(record.mrp || record['MRP'] || '0') || 0
          };

          // Validate required fields
          if (!item.item_id || !item.item_name) {
            console.warn(`Row ${index + 1}: Missing required fields (item_id: ${item.item_id}, item_name: ${item.item_name})`);
            return null;
          }

          return item;
        } catch (error) {
          console.error(`Error parsing row ${index + 1}:`, error);
          return null;
        }
      })
      .filter((item): item is BlinkitSecondarySalesItem => item !== null);

    console.log(`Successfully parsed ${items.length} Blinkit items`);

    // Calculate summary
    const summary = {
      totalQtySold: items.reduce((sum, item) => sum + item.qty_sold, 0),
      totalSalesValue: items.reduce((sum, item) => sum + (item.qty_sold * item.mrp), 0),
      uniqueProducts: new Set(items.map(item => item.item_id)).size
    };

    const result: BlinkitSecondarySalesData = {
      platform: "blinkit",
      businessUnit,
      periodType,
      totalItems: items.length,
      items,
      summary
    };

    if (periodType === "daily" && reportDate) {
      result.reportDate = reportDate;
    } else if (periodType === "date-range" && periodStart && periodEnd) {
      result.periodStart = periodStart;
      result.periodEnd = periodEnd;
    }

    return result;

  } catch (error) {
    console.error('Error parsing Blinkit secondary sales file:', error);
    throw new Error(`Failed to parse Blinkit secondary sales file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}