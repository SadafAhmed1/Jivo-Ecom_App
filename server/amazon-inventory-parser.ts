import * as XLSX from 'xlsx';
import { parse } from 'csv-parse';

export interface AmazonInventoryRow {
  asin: string;
  product_name: string;
  sku: string;
  fnsku: string;
  category: string;
  brand: string;
  size: string;
  unit: string;
  warehouse_location: string;
  condition: string;
  fulfillment_channel: string;
  units_available: string;
  reserved_quantity: string;
  inbound_quantity: string;
  researching_quantity: string;
  unfulfillable_quantity: string;
  supplier_name: string;
  cost_per_unit: string;
  total_value: string;
  last_updated_at: string;
  attachment_path: string;
}

export interface ParsedAmazonInventoryData {
  platform: 'amazon';
  businessUnit: string;
  periodType: 'daily' | 'range';
  reportDate?: string;
  periodStart?: string;
  periodEnd?: string;
  totalItems: number;
  items: AmazonInventoryRow[];
  summary: {
    totalProducts: number;
    totalUnitsAvailable: number;
    totalReservedQuantity: number;
    totalInboundQuantity: number;
    totalUnfulfillableQuantity: number;
    totalValue: number;
  };
}

// Helper function to clean numeric values
function cleanNumericValue(value: string | undefined): string {
  if (!value || value === '' || value === undefined) return '0';
  // Remove commas and other non-numeric characters except decimals
  const cleaned = value.replace(/[^0-9.-]/g, '');
  // If result is empty or just a dash, return '0'
  if (!cleaned || cleaned === '-' || cleaned === '.') return '0';
  // Parse as float and convert back to string to ensure it's a valid number
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? '0' : parsed.toString();
}

export async function parseAmazonInventoryFile(
  fileBuffer: Buffer,
  filename: string,
  businessUnit: string,
  periodType: 'daily' | 'range',
  reportDate?: Date,
  periodStart?: Date | null,
  periodEnd?: Date | null
): Promise<ParsedAmazonInventoryData> {
  
  const items: AmazonInventoryRow[] = [];
  let csvContent = '';

  try {
    // Handle different file formats
    if (filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls')) {
      console.log('Processing Amazon inventory XLSX file');
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      csvContent = XLSX.utils.sheet_to_csv(worksheet);
    } else if (filename.toLowerCase().endsWith('.csv')) {
      console.log('Processing Amazon inventory CSV file');
      csvContent = fileBuffer.toString('utf-8');
    } else {
      throw new Error('Unsupported file format. Please upload CSV or XLSX files.');
    }

    return new Promise((resolve, reject) => {
      parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
        quote: '"',
        escape: '"',
        trim: true
      }, (err: any, records: any) => {
        if (err) {
          console.error('CSV parsing error:', err);
          reject(new Error(`Failed to parse file: ${err.message}`));
          return;
        }

        try {
          if (!records || records.length === 0) {
            reject(new Error('No data found in file'));
            return;
          }

          console.log(`Processing ${records.length} records from Amazon inventory file`);
          console.log('First record keys:', Object.keys(records[0] || {}));

          // Process each record
          for (const record of records) {
            const recordData = record as any;

            // Debug: Log first few records to understand structure
            if (items.length < 3) {
              console.log(`Record ${items.length + 1}:`, recordData);
            }

            // Skip header rows - check if this is a header row
            const isHeaderRow = recordData['Programme=[Retail]'] === 'ASIN' || 
                               recordData['Distributor View=[Manufacturing]'] === 'Product Title' ||
                               recordData['View By=[ASIN]'] === 'Brand';
            
            if (isHeaderRow) {
              console.log('Skipping header row:', recordData);
              continue;
            }

            // Handle the specific Amazon sales report format
            const hasAsin = recordData['Programme=[Retail]'] || recordData.asin || recordData.ASIN || recordData['ASIN'] || recordData.item_id || recordData.Item_ID;
            const hasProductName = recordData['Distributor View=[Manufacturing]'] || recordData.product_name || recordData['Product Name'] || recordData.item_name || recordData.Item_Name || recordData['Item Name'];

            if (!hasAsin && !hasProductName) {
              console.log('Skipping empty row:', recordData);
              continue;
            }

            // Skip rows with empty values in key fields (common in Amazon reports)
            if ((!recordData['Programme=[Retail]'] || recordData['Programme=[Retail]'].trim() === '') && 
                (!recordData['Distributor View=[Manufacturing]'] || recordData['Distributor View=[Manufacturing]'].trim() === '')) {
              console.log('Skipping empty row:', recordData);
              continue;
            }

            // Skip rows that still contain header-like data
            if (recordData['Programme=[Retail]']?.includes('ASIN') || 
                recordData['Distributor View=[Manufacturing]']?.includes('Product Title')) {
              console.log('Skipping header-like row:', recordData);
              continue;
            }

            const item: AmazonInventoryRow = {
              // Map Amazon sales report format to standard inventory fields
              asin: recordData['Programme=[Retail]'] || recordData.asin || recordData.ASIN || recordData['ASIN'] || recordData.item_id || recordData.Item_ID || '',
              product_name: recordData['Distributor View=[Manufacturing]'] || recordData.product_name || recordData['Product Name'] || recordData.item_name || recordData.Item_Name || recordData['Item Name'] || '',
              sku: recordData['View By=[ASIN]'] || recordData.sku || recordData.SKU || recordData['SKU'] || recordData.seller_sku || recordData['Seller SKU'] || '',
              fnsku: recordData['Programme=[Retail]'] || recordData.fnsku || recordData.FNSKU || recordData['FNSKU'] || recordData.amazon_sku || recordData['Amazon SKU'] || '',
              category: recordData['Countries=[IN]'] || recordData.category || recordData.Category || recordData.product_category || recordData['Product Category'] || 'General',
              brand: recordData['View By=[ASIN]'] || recordData.brand || recordData.Brand || recordData.manufacturer || recordData.Manufacturer || '',
              size: recordData.size || recordData.Size || recordData.dimensions || recordData.Dimensions || '',
              unit: recordData.unit || recordData.Unit || recordData.uom || recordData.UOM || 'Units',
              warehouse_location: recordData.warehouse_location || recordData['Warehouse Location'] || recordData.location || recordData.Location || recordData.fulfillment_center || recordData['Fulfillment Center'] || '',
              condition: recordData.condition || recordData.Condition || recordData.item_condition || recordData['Item Condition'] || 'New',
              fulfillment_channel: 'Amazon FBA',
              // For Amazon sales report format, map available fields to inventory-like structure
              // Clean numeric values by removing commas and converting to numbers
              units_available: cleanNumericValue(recordData['Currency=[INR]']) || '1', // Net Received Units
              reserved_quantity: '0', // Not available in this report type
              inbound_quantity: cleanNumericValue(recordData['Reporting Range=[Custom]']) || '0', // Open Purchase Order Quantity
              researching_quantity: '0',
              unfulfillable_quantity: cleanNumericValue(recordData['']) || '0', // Unsellable On-Hand Units
              supplier_name: 'Jivo Wellness',
              cost_per_unit: '0', // Not available in this report format
              total_value: cleanNumericValue(recordData['Locale=[en_IN]']) || '0', // Net Received value
              last_updated_at: recordData.last_updated_at || recordData['Last Updated'] || recordData.updated_at || recordData['Updated At'] || '',
              attachment_path: filename
            };

            items.push(item);
          }

          if (items.length === 0) {
            console.log('No valid items found. Total records processed:', records.length);
            reject(new Error('No valid inventory records found in file. Please ensure your file has columns like ASIN, Product Name, Units Available, etc.'));
            return;
          }

          console.log(`Successfully processed ${items.length} Amazon inventory items`);

          // Calculate summary statistics
          const totalUnitsAvailable = items.reduce((sum, item) => sum + (parseInt(item.units_available) || 0), 0);
          const totalReservedQuantity = items.reduce((sum, item) => sum + (parseInt(item.reserved_quantity) || 0), 0);
          const totalInboundQuantity = items.reduce((sum, item) => sum + (parseInt(item.inbound_quantity) || 0), 0);
          const totalUnfulfillableQuantity = items.reduce((sum, item) => sum + (parseInt(item.unfulfillable_quantity) || 0), 0);
          const totalValue = items.reduce((sum, item) => sum + (parseFloat(item.total_value) || 0), 0);

          const result: ParsedAmazonInventoryData = {
            platform: 'amazon',
            businessUnit,
            periodType,
            reportDate: reportDate?.toISOString(),
            periodStart: periodStart?.toISOString(),
            periodEnd: periodEnd?.toISOString(),
            totalItems: items.length,
            items,
            summary: {
              totalProducts: items.length,
              totalUnitsAvailable,
              totalReservedQuantity,
              totalInboundQuantity,
              totalUnfulfillableQuantity,
              totalValue
            }
          };

          console.log(`Successfully parsed ${items.length} Amazon inventory records`);
          resolve(result);

        } catch (error) {
          console.error('Error processing Amazon inventory data:', error);
          reject(new Error(`Failed to process inventory data: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });
    });

  } catch (error) {
    console.error('Error parsing Amazon inventory file:', error);
    throw new Error(`Failed to parse Amazon inventory file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}