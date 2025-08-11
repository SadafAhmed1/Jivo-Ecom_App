import * as XLSX from 'xlsx';

export interface FlipkartSecondarySalesData {
  tenantId: string;
  retailerName: string;
  retailerCode: string;
  fsn: string;
  productName: string;
  category: string;
  subCategory: string;
  brand: string;
  mrp: number;
  sellingPrice: number;
  salesData: Array<{
    date: string;
    qty: number;
  }>;
  totalSalesQty: number;
  totalSalesValue: number;
}

export interface ParsedFlipkartSecondarySalesData {
  platform: string;
  businessUnit: string;
  periodType: string;
  reportDate?: string;
  periodStart?: string;
  periodEnd?: string;
  totalItems: number;
  totalValue: number;
  uniqueProducts: number;
  data: FlipkartSecondarySalesData[];
}

export function parseFlipkartSecondaryData(buffer: Buffer, periodType: string, businessUnit: string, startDate?: string, endDate?: string): ParsedFlipkartSecondarySalesData {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Get all cell data as JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    if (!jsonData || jsonData.length < 2) {
      throw new Error('Invalid file format: No data rows found');
    }
    
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1) as any[][];
    
    // Find column indices for static fields based on actual Flipkart headers
    const tenantIdIndex = headers.findIndex(h => h && h.toLowerCase().includes('tenant'));
    const retailerIdIndex = headers.findIndex(h => h && h.toLowerCase().includes('retailer id'));
    const retailerNameIndex = headers.findIndex(h => h && h.toLowerCase().includes('retailer name'));
    const fsnIndex = headers.findIndex(h => h && h.toLowerCase().includes('fsn'));
    const productNameIndex = headers.findIndex(h => h && h.toLowerCase().includes('product title')); // Changed from 'product name'
    const categoryIndex = headers.findIndex(h => h && h.toLowerCase().includes('category') && !h.toLowerCase().includes('sub'));
    const verticalIndex = headers.findIndex(h => h && h.toLowerCase().includes('vertical'));
    const brandIndex = headers.findIndex(h => h && h.toLowerCase().includes('brand'));
    const eanIndex = headers.findIndex(h => h && h.toLowerCase().includes('ean'));
    const hsnIndex = headers.findIndex(h => h && h.toLowerCase().includes('hsn'));
    const styleCodeIndex = headers.findIndex(h => h && h.toLowerCase().includes('style code'));
    const lastCalculatedAtIndex = headers.findIndex(h => h && h.toLowerCase().includes('lastcalculatedat'));
    
    // Find date columns (Flipkart uses YYYY-MM-DD format starting from index 7)
    const dateColumns: Array<{ index: number; date: string }> = [];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    headers.forEach((header, index) => {
      if (header && dateRegex.test(header.toString())) {
        dateColumns.push({
          index,
          date: header.toString()
        });
      }
    });
    
    console.log(`Found ${dateColumns.length} date columns in Flipkart file`);
    
    if (dateColumns.length === 0) {
      throw new Error('No date columns found in the file');
    }
    
    // Calculate date range based on period type
    let calculatedStartDate = startDate;
    let calculatedEndDate = endDate;
    
    if (periodType === '2-month') {
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      
      const start = new Date(today);
      start.setMonth(start.getMonth() - 2);
      start.setDate(start.getDate() + (dayOfYear % 30));
      
      const end = new Date(today);
      end.setDate(end.getDate() + (dayOfYear % 30));
      
      calculatedStartDate = start.toISOString().split('T')[0];
      calculatedEndDate = end.toISOString().split('T')[0];
    }
    
    const parsedData: FlipkartSecondarySalesData[] = [];
    
    for (const row of dataRows) {
      if (!row || row.length === 0) continue;
      
      // Extract basic product information based on actual Flipkart file structure
      const tenantId = row[tenantIdIndex]?.toString() || '';
      const retailerId = row[retailerIdIndex]?.toString() || '';
      const retailerName = row[retailerNameIndex]?.toString() || '';
      const fsn = row[fsnIndex]?.toString() || '';
      const productName = row[productNameIndex]?.toString() || ''; // This will now get "Product Title"
      const category = row[categoryIndex]?.toString() || '';
      const vertical = row[verticalIndex]?.toString() || '';
      const brand = row[brandIndex]?.toString() || '';
      const ean = row[eanIndex]?.toString() || '';
      const hsn = row[hsnIndex]?.toString() || '';
      const styleCode = row[styleCodeIndex]?.toString() || '';
      
      // Flipkart doesn't have MRP and selling price in their file structure
      const mrp = 0; // Not available in Flipkart files
      const sellingPrice = 0; // Not available in Flipkart files
      
      // Extract sales data from date columns
      const salesData: Array<{ date: string; qty: number }> = [];
      let totalSalesQty = 0;
      
      for (const dateCol of dateColumns) {
        const qty = parseInt(row[dateCol.index]?.toString() || '0') || 0;
        if (qty > 0) {
          salesData.push({
            date: dateCol.date,
            qty
          });
          totalSalesQty += qty;
        }
      }
      
      const totalSalesValue = totalSalesQty * sellingPrice;
      
      if (totalSalesQty > 0) { // Only include rows with sales
        parsedData.push({
          tenantId,
          retailerName,
          retailerCode: retailerId, // Using retailerId as retailerCode
          fsn,
          productName,
          category,
          subCategory: vertical, // Using vertical as subCategory
          brand,
          mrp,
          sellingPrice,
          salesData,
          totalSalesQty,
          totalSalesValue
        });
      }
    }
    
    const totalValue = parsedData.reduce((sum, item) => sum + item.totalSalesValue, 0);
    const uniqueProducts = new Set(parsedData.map(item => item.fsn)).size;
    
    return {
      platform: 'flipkart-grocery',
      businessUnit,
      periodType,
      reportDate: periodType === 'daily' ? calculatedStartDate : undefined,
      periodStart: periodType !== 'daily' ? calculatedStartDate : undefined,
      periodEnd: periodType !== 'daily' ? calculatedEndDate : undefined,
      totalItems: parsedData.length,
      totalValue,
      uniqueProducts,
      data: parsedData
    };
    
  } catch (error) {
    console.error('Error parsing Flipkart secondary sales data:', error);
    throw new Error(`Failed to parse Flipkart file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}