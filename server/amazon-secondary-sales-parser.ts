import XLSX from 'xlsx';
import { InsertScAmJwDaily, InsertScAmJwRange, InsertScAmJmDaily, InsertScAmJmRange } from '@shared/schema';

export interface ParsedAmazonSecondarySalesData {
  platform: string;
  businessUnit: string;
  periodType: string;
  reportDate?: Date;
  periodStart?: Date;
  periodEnd?: Date;
  items: (InsertScAmJwDaily | InsertScAmJwRange | InsertScAmJmDaily | InsertScAmJmRange)[];
  totalItems: number;
  summary: {
    totalOrderedRevenue: number;
    totalOrderedUnits: number;
    totalShippedRevenue: number;
    totalShippedUnits: number;
    totalCustomerReturns: number;
  };
}

export function parseAmazonSecondarySales(
  buffer: Buffer, 
  platform: string, 
  businessUnit: string, 
  periodType: string,
  startDate?: string,
  endDate?: string
): ParsedAmazonSecondarySalesData {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with proper typing
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (!jsonData || jsonData.length === 0) {
      throw new Error('No data found in the Excel file');
    }
    
    // Find the actual headers row (should be row with "ASIN", "Product Title", etc.)
    let headerRowIndex = -1;
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && Array.isArray(row) && row.includes('ASIN') && row.includes('Product Title')) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('Could not find headers row with ASIN and Product Title');
    }
    
    const headers = jsonData[headerRowIndex] as string[];
    const dataRows = jsonData.slice(headerRowIndex + 1) as any[][];
    
    // Map column indices
    const colIndices = {
      asin: headers.indexOf('ASIN'),
      productTitle: headers.indexOf('Product Title'),
      brand: headers.indexOf('Brand'),
      orderedRevenue: headers.indexOf('Ordered Revenue'),
      orderedUnits: headers.indexOf('Ordered Units'),
      shippedRevenue: headers.indexOf('Shipped Revenue'),
      shippedCogs: headers.indexOf('Shipped COGS'),
      shippedUnits: headers.indexOf('Shipped Units'),
      customerReturns: headers.indexOf('Customer Returns')
    };
    
    // Validate required columns exist
    if (colIndices.asin === -1 || colIndices.productTitle === -1) {
      throw new Error('Required columns ASIN or Product Title not found');
    }
    
    const items: any[] = [];
    let totalOrderedRevenue = 0;
    let totalOrderedUnits = 0;
    let totalShippedRevenue = 0;
    let totalShippedUnits = 0;
    let totalCustomerReturns = 0;
    
    // Parse data rows
    for (const row of dataRows) {
      if (!row || !Array.isArray(row) || row.length === 0 || !row[colIndices.asin]) continue;
      
      const orderedRevenue = parseFloat(String(row[colIndices.orderedRevenue] || '0')) || 0;
      const orderedUnits = parseInt(String(row[colIndices.orderedUnits] || '0')) || 0;
      const shippedRevenue = parseFloat(String(row[colIndices.shippedRevenue] || '0')) || 0;
      const shippedUnits = parseInt(String(row[colIndices.shippedUnits] || '0')) || 0;
      const customerReturns = parseInt(String(row[colIndices.customerReturns] || '0')) || 0;
      
      const item = {
        asin: String(row[colIndices.asin] || '').trim(),
        product_title: String(row[colIndices.productTitle] || '').trim(),
        brand: String(row[colIndices.brand] || '').trim() || null,
        ordered_revenue: orderedRevenue.toString(),
        ordered_units: orderedUnits,
        shipped_revenue: shippedRevenue.toString(),
        shipped_cogs: (parseFloat(String(row[colIndices.shippedCogs] || '0')) || 0).toString(),
        shipped_units: shippedUnits,
        customer_returns: customerReturns
      };
      
      // Add period-specific fields
      if (periodType === 'daily') {
        (item as any).report_date = new Date();
      } else if (periodType === 'date-range' && startDate && endDate) {
        (item as any).period_start = new Date(startDate);
        (item as any).period_end = new Date(endDate);
      }
      
      items.push(item);
      
      // Update totals
      totalOrderedRevenue += orderedRevenue;
      totalOrderedUnits += orderedUnits;
      totalShippedRevenue += shippedRevenue;
      totalShippedUnits += shippedUnits;
      totalCustomerReturns += customerReturns;
    }
    
    return {
      platform,
      businessUnit,
      periodType,
      reportDate: periodType === 'daily' ? new Date() : undefined,
      periodStart: periodType === 'date-range' && startDate ? new Date(startDate) : undefined,
      periodEnd: periodType === 'date-range' && endDate ? new Date(endDate) : undefined,
      items,
      totalItems: items.length,
      summary: {
        totalOrderedRevenue,
        totalOrderedUnits,
        totalShippedRevenue,
        totalShippedUnits,
        totalCustomerReturns
      }
    };
    
  } catch (error) {
    console.error('Error parsing Amazon secondary sales file:', error);
    throw new Error(`Failed to parse Amazon secondary sales file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}