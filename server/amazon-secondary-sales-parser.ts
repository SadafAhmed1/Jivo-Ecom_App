import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { InsertSecondarySalesHeader, InsertSecondarySalesItems } from "@shared/schema";

interface AmazonSecondarySalesData {
  header: InsertSecondarySalesHeader;
  lines: InsertSecondarySalesItems[];
}

export async function parseAmazonSecondarySales(
  buffer: Buffer,
  businessUnit: string,
  uploadedBy: string
): Promise<AmazonSecondarySalesData> {
  console.log(`Processing Amazon Secondary Sales file for ${businessUnit}...`);
  
  try {
    let data: any[] = [];
    
    // Try to parse as Excel first, then CSV
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('No sheets found in Excel file');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(`Amazon Excel has ${data.length} rows`);
    } catch (excelError) {
      // Try CSV parsing
      try {
        const csvContent = buffer.toString('utf-8');
        data = parse(csvContent, {
          skip_empty_lines: true,
          trim: true
        });
        console.log(`Amazon CSV has ${data.length} rows`);
      } catch (csvError) {
        throw new Error(`Failed to parse file as Excel or CSV: ${(excelError as Error).message}, ${(csvError as Error).message}`);
      }
    }

    if (!data || data.length < 2) {
      throw new Error('File appears to be empty or has insufficient data');
    }

    // Find header row (look for common Amazon sales report columns)
    let headerRowIndex = -1;
    const expectedColumns = ['sku', 'asin', 'product', 'quantity', 'sales', 'amount', 'date'];
    
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      if (Array.isArray(row)) {
        const rowStr = row.join('|').toLowerCase();
        const matchCount = expectedColumns.filter(col => rowStr.includes(col)).length;
        if (matchCount >= 3) {
          headerRowIndex = i;
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('Could not find valid header row in Amazon sales data');
    }

    const headers = data[headerRowIndex].map((h: unknown) => String(h || '').toLowerCase().trim());
    const dataRows = data.slice(headerRowIndex + 1);

    // Map common Amazon column variations
    const columnMappings = {
      sku: ['sku', 'seller-sku', 'seller sku', 'product sku', 'item sku'],
      asin: ['asin', 'product-id', 'product id', 'amazon-product-id'],
      productName: ['product-name', 'product name', 'title', 'item-name', 'item name', 'product title'],
      quantity: ['quantity', 'quantity-sold', 'units sold', 'qty', 'quantity shipped'],
      unitPrice: ['unit-price', 'unit price', 'price', 'selling-price', 'item-price'],
      totalSales: ['total-sales', 'total sales', 'sales-amount', 'amount', 'gross-sales'],
      commissionRate: ['commission-rate', 'commission rate', 'referral-fee-rate', 'fee-rate'],
      commissionAmount: ['commission', 'commission-amount', 'referral-fee', 'fees', 'amazon-fees'],
      transactionDate: ['date', 'transaction-date', 'sale-date', 'order-date', 'posted-date'],
      orderId: ['order-id', 'order id', 'transaction-id', 'amazon-order-id'],
      category: ['category', 'product-category', 'item-category', 'category-name'],
      brand: ['brand', 'brand-name', 'manufacturer'],
      customerLocation: ['ship-city', 'customer-location', 'destination', 'city'],
      fulfillmentMethod: ['fulfillment', 'fulfillment-method', 'fulfilled-by', 'ship-method']
    };

    // Find column indices
    const getColumnIndex = (mappings: string[]): number => {
      for (const mapping of mappings) {
        const index = headers.findIndex(h => h.includes(mapping));
        if (index !== -1) return index;
      }
      return -1;
    };

    const columnIndices = {
      sku: getColumnIndex(columnMappings.sku),
      asin: getColumnIndex(columnMappings.asin),
      productName: getColumnIndex(columnMappings.productName),
      quantity: getColumnIndex(columnMappings.quantity),
      unitPrice: getColumnIndex(columnMappings.unitPrice),
      totalSales: getColumnIndex(columnMappings.totalSales),
      commissionRate: getColumnIndex(columnMappings.commissionRate),
      commissionAmount: getColumnIndex(columnMappings.commissionAmount),
      transactionDate: getColumnIndex(columnMappings.transactionDate),
      orderId: getColumnIndex(columnMappings.orderId),
      category: getColumnIndex(columnMappings.category),
      brand: getColumnIndex(columnMappings.brand),
      customerLocation: getColumnIndex(columnMappings.customerLocation),
      fulfillmentMethod: getColumnIndex(columnMappings.fulfillmentMethod)
    };

    // Validate required columns
    if (columnIndices.productName === -1 && columnIndices.sku === -1) {
      throw new Error('Could not find product name or SKU column');
    }
    if (columnIndices.quantity === -1) {
      throw new Error('Could not find quantity column');
    }

    console.log('Column mapping:', columnIndices);

    // Parse data rows
    const items: InsertSecondarySalesItems[] = [];
    let lineNumber = 1;
    let totalQuantity = 0;
    let totalSalesAmount = 0;

    for (const row of dataRows) {
      if (!Array.isArray(row) || row.length === 0) continue;

      // Skip empty rows
      const hasData = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
      if (!hasData) continue;

      try {
        const getValue = (index: number): string => {
          return index >= 0 && row[index] !== null && row[index] !== undefined 
            ? String(row[index]).trim() 
            : '';
        };

        const getNumericValue = (index: number): number => {
          if (index < 0) return 0;
          const value = row[index];
          if (value === null || value === undefined) return 0;
          const numStr = String(value).replace(/[,$\s]/g, '');
          const num = parseFloat(numStr);
          return isNaN(num) ? 0 : num;
        };

        const productSku = getValue(columnIndices.sku);
        const productName = getValue(columnIndices.productName) || productSku || `Product ${lineNumber}`;
        const quantitySold = Math.max(0, getNumericValue(columnIndices.quantity));
        const unitPrice = getNumericValue(columnIndices.unitPrice);
        const totalSales = getNumericValue(columnIndices.totalSales) || (quantitySold * unitPrice);
        const commissionRate = getNumericValue(columnIndices.commissionRate);
        const commissionAmount = getNumericValue(columnIndices.commissionAmount) || (totalSales * commissionRate / 100);

        // Skip rows with no quantity or sales
        if (quantitySold === 0 && totalSales === 0) {
          continue;
        }

        const item: InsertSecondarySalesItems = {
          line_number: lineNumber,
          product_sku: productSku || null,
          product_name: productName,
          product_asin: getValue(columnIndices.asin) || null,
          category: getValue(columnIndices.category) || null,
          brand: getValue(columnIndices.brand) || null,
          quantity_sold: quantitySold,
          unit_price: unitPrice > 0 ? unitPrice.toString() : null,
          total_sales: totalSales > 0 ? totalSales.toString() : "0.00",
          commission_rate: commissionRate > 0 ? commissionRate.toString() : null,
          commission_amount: commissionAmount > 0 ? commissionAmount.toString() : null,
          shipping_fee: null, // Could be added if column is found
          promotion_discount: null, // Could be added if column is found
          net_amount: (totalSales - commissionAmount).toString(),
          transaction_date: parseDate(getValue(columnIndices.transactionDate)),
          order_id: getValue(columnIndices.orderId) || null,
          customer_location: getValue(columnIndices.customerLocation) || null,
          fulfillment_method: getValue(columnIndices.fulfillmentMethod) || 'FBA'
        };

        items.push(item);
        totalQuantity += quantitySold;
        totalSalesAmount += totalSales;
        lineNumber++;

        console.log(`Parsed Amazon sales item ${lineNumber - 1}:`, {
          product_name: item.product_name,
          quantity_sold: item.quantity_sold,
          total_sales: item.total_sales
        });

      } catch (itemError) {
        console.warn(`Error parsing Amazon sales row ${lineNumber}:`, (itemError as Error).message);
        continue;
      }
    }

    if (items.length === 0) {
      throw new Error('No valid sales items found in the file');
    }

    // Create header
    const header: InsertSecondarySalesHeader = {
      platform: 'amazon',
      business_unit: businessUnit,
      period_start: null, // Could be calculated from transaction dates
      period_end: null, // Could be calculated from transaction dates
      report_generated_date: new Date(),
      total_items: items.length,
      total_quantity: totalQuantity.toString(),
      total_sales_amount: totalSalesAmount.toFixed(2),
      total_commission: items.reduce((sum, item) => 
        sum + (parseFloat(item.commission_amount || '0')), 0
      ).toFixed(2),
      currency: 'INR',
      status: 'Active',
      uploaded_by: uploadedBy
    };

    console.log(`Amazon Secondary Sales parsed successfully:`, {
      platform: header.platform,
      business_unit: header.business_unit,
      total_items: header.total_items,
      total_quantity: header.total_quantity,
      total_sales_amount: header.total_sales_amount
    });

    return { header, lines: items };

  } catch (error) {
    console.error('Error parsing Amazon Secondary Sales:', error);
    throw new Error(`Failed to parse Amazon Secondary Sales: ${(error as Error).message}`);
  }
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    // Try various date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
    ];
    
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch {
    return null;
  }
}