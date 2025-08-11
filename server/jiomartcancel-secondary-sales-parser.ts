import Papa from 'papaparse';

interface JioMartCancelData {
  shipment_number: string;
  ean: string;
  sku: string;
  product: string;
  invoice_id: string;
  invoice_amount: number;
  quantity: number;
  amount: number;
  status: string;
  reason: string;
  payment_method: string;
  fulfiller_name: string;
  report_date?: Date;
  period_start?: Date;
  period_end?: Date;
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
  items: JioMartCancelData[];
  summary: {
    totalRecords: number;
    totalSalesValue: number;
    uniqueProducts: number;
    dateRange: string;
  };
}

function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  
  const parsed = parseFloat(value.toString());
  return isNaN(parsed) ? 0 : parsed;
}

export function parseJioMartCancelSecondarySales(
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
        'Shipment number': 'Shipment number',
        'EAN': 'EAN',
        'SKU': 'SKU',
        'Product': 'Product',
        'Invoice Id': 'Invoice Id',
        'Invoice amount': 'Invoice amount',
        'Quantity': 'Quantity',
        'Amount': 'Amount',
        'Status': 'Status',
        'Reason': 'Reason',
        'Payment method': 'Payment method',
        'Fulfiller Name': 'Fulfiller Name'
      };
      return headerMap[header] || header;
    }
  });

  if (parseResult.errors && parseResult.errors.length > 0) {
    console.warn('CSV parsing errors:', parseResult.errors);
  }

  const rawData = parseResult.data as any[];
  
  const items: JioMartCancelData[] = rawData
    .filter(row => row && row['Shipment number']) // Filter out empty rows
    .map(row => {
      return {
        shipment_number: row['Shipment number'] || '',
        ean: row['EAN'] || '',
        sku: row['SKU'] || '',
        product: row['Product'] || '',
        invoice_id: row['Invoice Id'] || '',
        invoice_amount: parseNumber(row['Invoice amount']),
        quantity: parseNumber(row['Quantity']),
        amount: parseNumber(row['Amount']),
        status: row['Status'] || '',
        reason: row['Reason'] || '',
        payment_method: row['Payment method'] || '',
        fulfiller_name: row['Fulfiller Name'] || '',
        attachment_path: null
      };
    });

  // Calculate summary
  const totalSalesValue = items.reduce((sum, item) => sum + item.amount, 0);
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