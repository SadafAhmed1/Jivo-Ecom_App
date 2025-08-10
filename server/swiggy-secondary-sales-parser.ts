import * as XLSX from 'xlsx';

export interface SwiggySecondarySalesItem {
  brand: string;
  report_date: Date;
  ordered_date: Date;
  city: string;
  area_name?: string;
  store_id?: string;
  l1_category?: string;
  l2_category?: string;
  l3_category?: string;
  product_name: string;
  variant?: string;
  item_code?: string;
  combo?: string;
  combo_item_code?: string;
  combo_units_sold?: number;
  base_mrp?: number;
  units_sold?: number;
  gmv?: number;
}

export interface SwiggySecondarySalesData {
  platform: string;
  businessUnit: string;
  periodType: string;
  reportDate?: string;
  periodStart?: string;
  periodEnd?: string;
  totalItems: number;
  summary: {
    totalUnits: number;
    totalGmv: number;
    totalBaseMrp: number;
    avgBaseMrp: number;
  };
  items: SwiggySecondarySalesItem[];
}

export function parseSwiggySecondarySalesFile(
  buffer: Buffer,
  businessUnit: string,
  periodType: string,
  reportDate?: string,
  periodStart?: string,
  periodEnd?: string
): SwiggySecondarySalesData {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawData.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }
    
    const headers = rawData[0] as string[];
    const dataRows = rawData.slice(1);
    
    // Expected column mapping
    const columnMap: { [key: string]: string } = {
      'BRAND': 'brand',
      'ORDERED_DATE': 'ordered_date', 
      'CITY': 'city',
      'AREA_NAME': 'area_name',
      'STORE_ID': 'store_id',
      'L1_CATEGORY': 'l1_category',
      'L2_CATEGORY': 'l2_category',
      'L3_CATEGORY': 'l3_category',
      'PRODUCT_NAME': 'product_name',
      'VARIANT': 'variant',
      'ITEM_CODE': 'item_code',
      'COMBO': 'combo',
      'COMBO_ITEM_CODE': 'combo_item_code',
      'COMBO_UNITS_SOLD': 'combo_units_sold',
      'BASE_MRP': 'base_mrp',
      'UNITS_SOLD': 'units_sold',
      'GMV': 'gmv'
    };
    
    // Create column index mapping
    const columnIndexes: { [key: string]: number } = {};
    headers.forEach((header, index) => {
      const normalizedHeader = header.toString().trim().toUpperCase();
      if (columnMap[normalizedHeader]) {
        columnIndexes[columnMap[normalizedHeader]] = index;
      }
    });
    
    // Validate required columns
    const requiredColumns = ['brand', 'ordered_date', 'city', 'product_name'];
    const missingColumns = requiredColumns.filter(col => columnIndexes[col] === undefined);
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
    
    // Parse data rows
    const items: SwiggySecondarySalesItem[] = [];
    let totalUnits = 0;
    let totalGmv = 0;
    let totalBaseMrp = 0;
    
    for (const row of dataRows as any[][]) {
      if (!row || row.length === 0) continue;
      
      // Parse ordered_date
      let orderedDate: Date;
      const orderedDateRaw = row[columnIndexes.ordered_date];
      if (orderedDateRaw) {
        if (typeof orderedDateRaw === 'number') {
          // Excel date serial number
          orderedDate = new Date((orderedDateRaw - 25569) * 86400 * 1000);
        } else {
          // String date
          const parsedDate = new Date(orderedDateRaw.toString());
          if (!isNaN(parsedDate.getTime())) {
            orderedDate = parsedDate;
          } else {
            // Fallback to current date if parsing fails
            orderedDate = new Date();
          }
        }
      } else {
        // Use report date or current date as fallback
        orderedDate = reportDate ? new Date(reportDate) : new Date();
      }
      
      const unitsRaw = row[columnIndexes.units_sold];
      const gmvRaw = row[columnIndexes.gmv];
      const baseMrpRaw = row[columnIndexes.base_mrp];
      
      const units = unitsRaw ? parseInt(unitsRaw.toString()) || 0 : 0;
      const gmv = gmvRaw ? parseFloat(gmvRaw.toString()) || 0 : 0;
      const baseMrp = baseMrpRaw ? parseFloat(baseMrpRaw.toString()) || 0 : 0;
      
      totalUnits += units;
      totalGmv += gmv;
      totalBaseMrp += baseMrp;
      
      const item: SwiggySecondarySalesItem = {
        brand: row[columnIndexes.brand]?.toString() || '',
        report_date: reportDate ? new Date(reportDate) : new Date(),
        ordered_date: orderedDate,
        city: row[columnIndexes.city]?.toString() || '',
        area_name: row[columnIndexes.area_name]?.toString() || undefined,
        store_id: row[columnIndexes.store_id]?.toString() || undefined,
        l1_category: row[columnIndexes.l1_category]?.toString() || undefined,
        l2_category: row[columnIndexes.l2_category]?.toString() || undefined,
        l3_category: row[columnIndexes.l3_category]?.toString() || undefined,
        product_name: row[columnIndexes.product_name]?.toString() || '',
        variant: row[columnIndexes.variant]?.toString() || undefined,
        item_code: row[columnIndexes.item_code]?.toString() || undefined,
        combo: row[columnIndexes.combo]?.toString() || undefined,
        combo_item_code: row[columnIndexes.combo_item_code]?.toString() || undefined,
        combo_units_sold: row[columnIndexes.combo_units_sold] ? parseInt(row[columnIndexes.combo_units_sold].toString()) || undefined : undefined,
        base_mrp: baseMrp || undefined,
        units_sold: units || undefined,
        gmv: gmv || undefined
      };
      
      items.push(item);
    }
    
    const avgBaseMrp = items.length > 0 ? totalBaseMrp / items.length : 0;
    
    return {
      platform: 'swiggy',
      businessUnit,
      periodType,
      reportDate,
      periodStart,
      periodEnd,
      totalItems: items.length,
      summary: {
        totalUnits,
        totalGmv,
        totalBaseMrp,
        avgBaseMrp
      },
      items
    };
    
  } catch (error: any) {
    console.error('Error parsing Swiggy secondary sales file:', error);
    throw new Error(`Failed to parse Swiggy secondary sales file: ${error.message}`);
  }
}