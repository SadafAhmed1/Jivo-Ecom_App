import Papa from "papaparse";

// Data structure matching BigBasket CSV format
export interface BigBasketData {
  date_range: string;
  source_city_name: string;
  brand_name: string;
  top_slug: string;
  mid_slug: string;
  leaf_slug: string;
  source_sku_id: string;
  sku_description: string;
  sku_weight: string;
  total_quantity: number;
  total_mrp: number;
  total_sales: number;
  attachment_path?: string | null;
}

export interface ParseResult {
  platform: string;
  businessUnit: string;
  periodType: string;
  reportDate?: Date;
  periodStart?: Date;
  periodEnd?: Date;
  totalItems: number;
  items: BigBasketData[];
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

export function parseBigBasketSecondarySales(
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
        'date_range': 'date_range',
        'source_city_name': 'source_city_name',
        'brand_name': 'brand_name',
        'top_slug': 'top_slug',
        'mid_slug': 'mid_slug',
        'leaf_slug': 'leaf_slug',
        'source_sku_id': 'source_sku_id',
        'sku_description': 'sku_description',
        'sku_weight': 'sku_weight',
        'total_quantity': 'total_quantity',
        'total_mrp': 'total_mrp',
        'total_sales': 'total_sales'
      };
      return headerMap[header] || header;
    }
  });

  if (parseResult.errors && parseResult.errors.length > 0) {
    console.warn('CSV parsing errors:', parseResult.errors);
  }

  const rawData = parseResult.data as any[];
  
  const items: BigBasketData[] = rawData
    .filter(row => row && row['source_sku_id']) // Filter out empty rows
    .map(row => {
      return {
        date_range: row['date_range'] || '',
        source_city_name: row['source_city_name'] || '',
        brand_name: row['brand_name'] || '',
        top_slug: row['top_slug'] || '',
        mid_slug: row['mid_slug'] || '',
        leaf_slug: row['leaf_slug'] || '',
        source_sku_id: row['source_sku_id'] || '',
        sku_description: row['sku_description'] || '',
        sku_weight: row['sku_weight'] || '',
        total_quantity: parseNumber(row['total_quantity']),
        total_mrp: parseNumber(row['total_mrp']),
        total_sales: parseNumber(row['total_sales']),
        attachment_path: null
      };
    });

  // Calculate summary
  const totalSalesValue = items.reduce((sum, item) => sum + item.total_sales, 0);
  const uniqueProducts = new Set(items.map(item => item.source_sku_id).filter(Boolean)).size;
  
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