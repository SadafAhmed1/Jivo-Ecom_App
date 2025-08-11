import Papa from 'papaparse';

interface JioMartSaleData {
  shipment_number: string;
  fulfillment_type: string;
  shipment_created_at: string;
  shipment_status: string;
  fulfiller_name: string;
  accepted_at: string;
  product_title: string;
  ean: string;
  sku: string;
  qty: number;
  mrp: number;
  promotion_amt: number;
  shipping_charge: number;
  item_total: number;
  payment_method_used: string;
  tracking_code: string;
  shipping_agent_code: string;
  invoice_id: string;
  acceptance_tat_date_time: string;
  attachment_path?: string | null;
}

interface ParseResult {
  platform: string;
  businessUnit: string;
  periodType: string;
  reportDate?: Date;
  periodStart?: Date;
  periodEnd?: Date;
  totalItems: number;
  items: JioMartSaleData[];
  summary: {
    totalRecords: number;
    totalSalesValue: number;
    uniqueProducts: number;
    dateRange: string;
  };
}

function parseDateTime(dateTimeStr: string): Date | null {
  if (!dateTimeStr || dateTimeStr.trim() === '') return null;
  
  try {
    // Handle the format "2025-08-01 00:13:24 +0530"
    const cleanStr = dateTimeStr.replace(/\s*\+\d{4}$/, ''); // Remove timezone
    const date = new Date(cleanStr);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.warn('Error parsing date:', dateTimeStr, error);
    return null;
  }
}

function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  
  const parsed = parseFloat(value.toString());
  return isNaN(parsed) ? 0 : parsed;
}

export function parseJioMartSaleSecondarySales(
  fileBuffer: Buffer,
  platform: string,
  businessUnit: string,
  periodType: string,
  startDate?: string,
  endDate?: string
): ParseResult {
  const csvContent = fileBuffer.toString('utf8');
  
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      // Transform headers to match our database schema
      const headerMap: Record<string, string> = {
        'Shipment Number': 'Shipment Number',
        'Fulfillment Type': 'Fulfillment Type',
        'Shipment Created At': 'Shipment Created At',
        'Shipment Status': 'Shipment Status',
        'Fulfiller Name': 'Fulfiller Name',
        'Accepted At': 'Accepted At',
        'Product Title': 'Product Title',
        'EAN': 'EAN',
        'Sku': 'Sku',
        'Qty': 'Qty',
        'MRP': 'MRP',
        'Promotion Amt': 'Promotion Amt',
        'Shipping Charge': 'Shipping Charge',
        'Item Total': 'Item Total',
        'Payment Method Used': 'Payment Method Used',
        'Tracking Code': 'Tracking Code',
        'Shipping Agent Code': 'Shipping Agent Code',
        'Invoice Id': 'Invoice Id',
        'Acceptance TAT Date & Time': 'Acceptance TAT Date & Time'
      };
      return headerMap[header] || header;
    }
  });

  if (parseResult.errors && parseResult.errors.length > 0) {
    console.warn('CSV parsing errors:', parseResult.errors);
  }

  const rawData = parseResult.data as any[];
  
  const items: JioMartSaleData[] = rawData
    .filter(row => row && row['Shipment Number']) // Filter out empty rows
    .map(row => {
      return {
        shipment_number: row['Shipment Number'] || '',
        fulfillment_type: row['Fulfillment Type'] || '',
        shipment_created_at: row['Shipment Created At'] || '',
        shipment_status: row['Shipment Status'] || '',
        fulfiller_name: row['Fulfiller Name'] || '',
        accepted_at: row['Accepted At'] || '',
        product_title: row['Product Title'] || '',
        ean: row['EAN'] || '',
        sku: row['Sku'] || '',
        qty: parseNumber(row['Qty']),
        mrp: parseNumber(row['MRP']),
        promotion_amt: parseNumber(row['Promotion Amt']),
        shipping_charge: parseNumber(row['Shipping Charge']),
        item_total: parseNumber(row['Item Total']),
        payment_method_used: row['Payment Method Used'] || '',
        tracking_code: row['Tracking Code'] || '',
        shipping_agent_code: row['Shipping Agent Code'] || '',
        invoice_id: row['Invoice Id'] || '',
        acceptance_tat_date_time: row['Acceptance TAT Date & Time'] || '',
        attachment_path: null
      };
    });

  // Calculate summary
  const totalSalesValue = items.reduce((sum, item) => sum + item.item_total, 0);
  const uniqueProducts = new Set(items.map(item => item.sku).filter(Boolean)).size;
  
  const dateRangeStr = periodType === "date-range" && startDate && endDate 
    ? `${startDate} to ${endDate}` 
    : startDate || 'Unknown';

  // Set reportDate and period fields based on periodType
  const reportDate = periodType === "daily" && startDate ? new Date(startDate) : undefined;
  const periodStart = periodType === "date-range" && startDate ? new Date(startDate) : undefined;
  const periodEnd = periodType === "date-range" && endDate ? new Date(endDate) : undefined;

  return {
    platform,
    businessUnit,
    periodType,
    reportDate,
    periodStart,
    periodEnd,
    totalItems: items.length,
    items,
    summary: {
      totalRecords: items.length,
      totalSalesValue,
      uniqueProducts,
      dateRange: dateRangeStr
    }
  };
}