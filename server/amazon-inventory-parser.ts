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

            // Skip empty rows - check multiple possible field names
            const hasAsin = recordData.asin || recordData.ASIN || recordData['ASIN'] || recordData.item_id || recordData.Item_ID;
            const hasProductName = recordData.product_name || recordData['Product Name'] || recordData.item_name || recordData.Item_Name || recordData['Item Name'];

            if (!hasAsin && !hasProductName) {
              console.log('Skipping empty row:', recordData);
              continue;
            }

            const item: AmazonInventoryRow = {
              asin: recordData.asin || recordData.ASIN || recordData['ASIN'] || recordData.item_id || recordData.Item_ID || '',
              product_name: recordData.product_name || recordData['Product Name'] || recordData.item_name || recordData.Item_Name || recordData['Item Name'] || '',
              sku: recordData.sku || recordData.SKU || recordData['SKU'] || recordData.seller_sku || recordData['Seller SKU'] || '',
              fnsku: recordData.fnsku || recordData.FNSKU || recordData['FNSKU'] || recordData.amazon_sku || recordData['Amazon SKU'] || '',
              category: recordData.category || recordData.Category || recordData.product_category || recordData['Product Category'] || '',
              brand: recordData.brand || recordData.Brand || recordData.manufacturer || recordData.Manufacturer || '',
              size: recordData.size || recordData.Size || recordData.dimensions || recordData.Dimensions || '',
              unit: recordData.unit || recordData.Unit || recordData.uom || recordData.UOM || '',
              warehouse_location: recordData.warehouse_location || recordData['Warehouse Location'] || recordData.location || recordData.Location || recordData.fulfillment_center || recordData['Fulfillment Center'] || '',
              condition: recordData.condition || recordData.Condition || recordData.item_condition || recordData['Item Condition'] || 'New',
              fulfillment_channel: recordData.fulfillment_channel || recordData['Fulfillment Channel'] || recordData.channel || recordData.Channel || 'FBA',
              units_available: recordData.units_available || recordData['Units Available'] || recordData.available_qty || recordData['Available Qty'] || recordData.quantity || recordData.Quantity || '0',
              reserved_quantity: recordData.reserved_quantity || recordData['Reserved Quantity'] || recordData.reserved || recordData.Reserved || '0',
              inbound_quantity: recordData.inbound_quantity || recordData['Inbound Quantity'] || recordData.inbound || recordData.Inbound || '0',
              researching_quantity: recordData.researching_quantity || recordData['Researching Quantity'] || recordData.researching || recordData.Researching || '0',
              unfulfillable_quantity: recordData.unfulfillable_quantity || recordData['Unfulfillable Quantity'] || recordData.unfulfillable || recordData.Unfulfillable || '0',
              supplier_name: recordData.supplier_name || recordData['Supplier Name'] || recordData.vendor || recordData.Vendor || recordData.manufacturer || recordData.Manufacturer || '',
              cost_per_unit: recordData.cost_per_unit || recordData['Cost Per Unit'] || recordData.unit_cost || recordData['Unit Cost'] || recordData.cost || recordData.Cost || '0',
              total_value: recordData.total_value || recordData['Total Value'] || recordData.value || recordData.Value || '0',
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