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
    
    // Find column indices for static fields
    const tenantIdIndex = headers.findIndex(h => h && h.toLowerCase().includes('tenant'));
    const retailerNameIndex = headers.findIndex(h => h && (h.toLowerCase().includes('retailer name') || h.toLowerCase().includes('retailer_name')));
    const retailerCodeIndex = headers.findIndex(h => h && (h.toLowerCase().includes('retailer code') || h.toLowerCase().includes('retailer_code')));
    const fsnIndex = headers.findIndex(h => h && h.toLowerCase().includes('fsn'));
    const productNameIndex = headers.findIndex(h => h && (h.toLowerCase().includes('product name') || h.toLowerCase().includes('product_name')));
    const categoryIndex = headers.findIndex(h => h && h.toLowerCase().includes('category') && !h.toLowerCase().includes('sub'));
    const subCategoryIndex = headers.findIndex(h => h && h.toLowerCase().includes('sub') && h.toLowerCase().includes('category'));
    const brandIndex = headers.findIndex(h => h && h.toLowerCase().includes('brand'));
    const mrpIndex = headers.findIndex(h => h && h.toLowerCase().includes('mrp'));
    const sellingPriceIndex = headers.findIndex(h => h && (h.toLowerCase().includes('selling price') || h.toLowerCase().includes('selling_price')));
    
    // Find date columns (typically starting from column index after basic fields)
    const dateColumns: Array<{ index: number; date: string }> = [];
    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/;
    
    headers.forEach((header, index) => {
      if (header && (dateRegex.test(header.toString()) || header.toString().includes('/'))) {
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
      
      // Extract basic product information
      const tenantId = row[tenantIdIndex]?.toString() || '';
      const retailerName = row[retailerNameIndex]?.toString() || '';
      const retailerCode = row[retailerCodeIndex]?.toString() || '';
      const fsn = row[fsnIndex]?.toString() || '';
      const productName = row[productNameIndex]?.toString() || '';
      const category = row[categoryIndex]?.toString() || '';
      const subCategory = row[subCategoryIndex]?.toString() || '';
      const brand = row[brandIndex]?.toString() || '';
      const mrp = parseFloat(row[mrpIndex]?.toString() || '0') || 0;
      const sellingPrice = parseFloat(row[sellingPriceIndex]?.toString() || '0') || 0;
      
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
          retailerCode,
          fsn,
          productName,
          category,
          subCategory,
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