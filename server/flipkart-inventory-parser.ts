import Papa from 'papaparse';
import { InsertFlipkartInventoryDaily } from '@shared/schema';

interface FlipkartInventoryCSVRow {
  'Warehouse Id': string;
  'SKU': string;
  'Title': string;
  'Listing Id': string;
  'FSN': string;
  'Brand': string;
  'Flipkart Selling Price': string;
  'Live on Website': string;
  'Sales 7D': string;
  'Sales 14D': string;
  'Sales 30D': string;
  'Sales 60D': string;
  'Sales 90D': string;
  'B2B Scheduled': string;
  'Transfers Scheduled': string;
  'B2B Shipped': string;
  'Transfers Shipped': string;
  'B2B Receiving': string;
  'Transfers Receiving': string;
  'Reserved for Orders and Recalls': string;
  'Reserved for Internal Processing': string;
  'Returns Processing': string;
  'Orders to Dispatch': string;
  'Recalls to Dispatch': string;
  'Damaged': string;
  'QC Reject': string;
  'Catalog Reject': string;
  'Returns Reject': string;
  'Seller Return Reject': string;
  'Miscellaneous': string;
  'Length (in cm)': string;
  'Breadth (in cm)': string;
  'Height (in cm)': string;
  'Weight (in kg)': string;
  'Fulfilment Type': string;
  'F Assured Badge': string;
}

export function parseFlipkartInventoryCSV(
  csvContent: string,
  attachmentPath?: string,
  reportDate?: Date
): InsertFlipkartInventoryDaily[] {
  console.log('Starting FlipKart inventory CSV parsing...');
  
  const parseResult = Papa.parse<FlipkartInventoryCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parseResult.errors.length > 0) {
    console.error('CSV parsing errors:', parseResult.errors);
    throw new Error(`CSV parsing failed: ${parseResult.errors[0]?.message}`);
  }

  console.log(`Found ${parseResult.data.length} FlipKart inventory rows`);

  const parseNumber = (value: string | undefined): number | undefined => {
    if (!value || value === '' || value === 'null' || value === 'undefined') return undefined;
    const parsed = parseFloat(value.replace(/,/g, ''));
    return isNaN(parsed) ? undefined : parsed;
  };

  const parseInteger = (value: string | undefined): number | undefined => {
    if (!value || value === '' || value === 'null' || value === 'undefined') return undefined;
    const parsed = parseInt(value.replace(/,/g, ''), 10);
    return isNaN(parsed) ? undefined : parsed;
  };

  const parseDecimal = (value: string | undefined): string | undefined => {
    if (!value || value === '' || value === 'null' || value === 'undefined') return undefined;
    const parsed = parseFloat(value.replace(/,/g, ''));
    return isNaN(parsed) ? undefined : parsed.toString();
  };

  const processedData: InsertFlipkartInventoryDaily[] = [];

  parseResult.data.forEach((row, index) => {
    try {
      // Skip empty rows or rows with missing essential data
      if (!row['Warehouse Id'] && !row['SKU']) {
        console.log(`Skipping empty row at index ${index}`);
        return;
      }

      const processedRow: InsertFlipkartInventoryDaily = {
        report_date: reportDate || new Date(),
        attachment_path: attachmentPath || null,
        warehouseId: row['Warehouse Id']?.trim() || null,
        sku: row['SKU']?.trim() || null,
        title: row['Title']?.trim() || null,
        listingId: row['Listing Id']?.trim() || null,
        fsn: row['FSN']?.trim() || null,
        brand: row['Brand']?.trim() || null,
        flipkartSellingPrice: parseDecimal(row['Flipkart Selling Price']) || null,
        liveOnWebsite: parseInteger(row['Live on Website']) || null,
        sales7D: parseInteger(row['Sales 7D']) || null,
        sales14D: parseInteger(row['Sales 14D']) || null,
        sales30D: parseInteger(row['Sales 30D']) || null,
        sales60D: parseInteger(row['Sales 60D']) || null,
        sales90D: parseInteger(row['Sales 90D']) || null,
        b2bScheduled: parseInteger(row['B2B Scheduled']) || null,
        transfersScheduled: parseInteger(row['Transfers Scheduled']) || null,
        b2bShipped: parseInteger(row['B2B Shipped']) || null,
        transfersShipped: parseInteger(row['Transfers Shipped']) || null,
        b2bReceiving: parseInteger(row['B2B Receiving']) || null,
        transfersReceiving: parseInteger(row['Transfers Receiving']) || null,
        reservedForOrdersAndRecalls: parseInteger(row['Reserved for Orders and Recalls']) || null,
        reservedForInternalProcessing: parseInteger(row['Reserved for Internal Processing']) || null,
        returnsProcessing: parseInteger(row['Returns Processing']) || null,
        ordersToDispatch: parseInteger(row['Orders to Dispatch']) || null,
        recallsToDispatch: parseInteger(row['Recalls to Dispatch']) || null,
        damaged: parseInteger(row['Damaged']) || null,
        qcReject: parseInteger(row['QC Reject']) || null,
        catalogReject: parseInteger(row['Catalog Reject']) || null,
        returnsReject: parseInteger(row['Returns Reject']) || null,
        sellerReturnReject: parseInteger(row['Seller Return Reject']) || null,
        miscellaneous: parseInteger(row['Miscellaneous']) || null,
        lengthCm: parseDecimal(row['Length (in cm)']) || null,
        breadthCm: parseDecimal(row['Breadth (in cm)']) || null,
        heightCm: parseDecimal(row['Height (in cm)']) || null,
        weightKg: parseDecimal(row['Weight (in kg)']) || null,
        fulfilmentType: row['Fulfilment Type']?.trim() || null,
        fAssuredBadge: row['F Assured Badge']?.trim() || null
      };

      processedData.push(processedRow);
    } catch (error) {
      console.error(`Error processing row ${index}:`, error);
      console.error('Row data:', row);
      // Continue processing other rows
    }
  });

  console.log(`Successfully processed ${processedData.length} FlipKart inventory records`);
  return processedData;
}