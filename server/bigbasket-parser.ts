import XLSX from 'xlsx';
import type { InsertBigbasketPoHeader, InsertBigbasketPoLines } from '@shared/schema';

export interface BigBasketParsedData {
  header: InsertBigbasketPoHeader;
  lines: InsertBigbasketPoLines[];
  totalItems: number;
  totalQuantity: number;
  totalAmount: string;
  detectedVendor: string;
}

export async function parseBigBasketPO(buffer: Buffer, uploadedBy: string): Promise<BigBasketParsedData> {
  try {
    // Read Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    console.log("Processing BigBasket Excel file with", jsonData.length, "rows");
    
    // Initialize header data
    let header: InsertBigbasketPoHeader = {
      po_number: "",
      po_date: null,
      po_expiry_date: null,
      warehouse_address: "",
      delivery_address: "",
      supplier_name: "",
      supplier_address: "",
      supplier_gstin: "",
      dc_address: "",
      dc_gstin: "",
      total_items: 0,
      total_quantity: 0,
      total_basic_cost: "0",
      total_gst_amount: "0",
      total_cess_amount: "0",
      grand_total: "0",
      status: "pending",
      created_by: uploadedBy
    };
    
    const lines: InsertBigbasketPoLines[] = [];
    
    // Parse header information
    for (let i = 0; i < Math.min(30, jsonData.length); i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      const firstCell = String(row[0] || '').trim();
      
      // Extract PO Number, PO Date, and PO Expiry Date from row 17
      if (firstCell.includes('PO Number:')) {
        const poMatch = firstCell.match(/PO Number:(.*?)(?:,|$)/);
        if (poMatch) {
          header.po_number = poMatch[1].trim();
        }
        
        // Check for PO Date in row[3]
        if (row[3] && String(row[3]).includes('PO Date:')) {
          const dateMatch = String(row[3]).match(/PO Date:(.*?)(?:,|$)/);
          if (dateMatch) {
            const dateStr = dateMatch[1].trim();
            header.po_date = parseDate(dateStr);
          }
        }
        
        // Check for PO Expiry Date in row[7]
        if (row[7] && String(row[7]).includes('PO Expiry date:')) {
          const expiryMatch = String(row[7]).match(/PO Expiry date:(.*?)(?:,|$)/);
          if (expiryMatch) {
            const expiryStr = expiryMatch[1].trim();
            header.po_expiry_date = parseDate(expiryStr);
          }
        }
      }
      
      // Extract DC Address (rows 1-4)
      if (i >= 0 && i <= 3 && firstCell && !firstCell.includes('Address') && !firstCell.includes('Warehouse')) {
        if (!header.dc_address) {
          header.dc_address = firstCell;
        } else {
          header.dc_address += ', ' + firstCell;
        }
      }
      
      // Extract Warehouse Address (row 6)
      if (i === 5 && firstCell === 'Noida-New-FC') {
        header.warehouse_address = firstCell;
      }
      
      // Extract Supplier info (rows 11-13)
      if (i === 11 && firstCell.includes('Sustainquest')) {
        header.supplier_name = firstCell;
      }
      if (i === 12 && firstCell.includes('Plot No')) {
        header.supplier_address = firstCell;
      }
      if (i === 15 && firstCell.includes('GSTIN No:')) {
        const gstinMatch = firstCell.match(/GSTIN No:\s*(.*)/);
        if (gstinMatch) {
          header.supplier_gstin = gstinMatch[1].trim();
        }
      }
    }
    
    // Find data rows (starting from row with headers)
    let dataStartRow = -1;
    for (let i = 15; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row[0] === 'S.No' && row[1] === 'HSN Code') {
        dataStartRow = i + 1;
        break;
      }
    }
    
    if (dataStartRow === -1) {
      throw new Error('Could not find data headers in BigBasket file');
    }
    
    // Parse line items
    let totalQuantity = 0;
    let totalValue = 0;
    let totalGST = 0;
    let totalCess = 0;
    
    for (let i = dataStartRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length < 23) continue;
      
      // Check if this is a valid data row (has S.No as number)
      const sNo = parseInt(String(row[0] || ''));
      if (isNaN(sNo) || sNo <= 0) continue;
      
      const line: InsertBigbasketPoLines = {
        s_no: sNo,
        hsn_code: String(row[1] || ''),
        sku_code: String(row[2] || ''),
        description: String(row[3] || ''),
        ean_upc_code: String(row[4] || ''),
        case_quantity: parseInt(String(row[5] || '0')) || 0,
        quantity: parseInt(String(row[6] || '0')) || 0,
        basic_cost: parseFloat(String(row[7] || '0')).toFixed(2),
        sgst_percent: parseFloat(String(row[8] || '0')).toFixed(2),
        sgst_amount: parseFloat(String(row[9] || '0')).toFixed(2),
        cgst_percent: parseFloat(String(row[10] || '0')).toFixed(2),
        cgst_amount: parseFloat(String(row[11] || '0')).toFixed(2),
        igst_percent: parseFloat(String(row[12] || '0')).toFixed(2),
        igst_amount: parseFloat(String(row[13] || '0')).toFixed(2),
        gst_percent: parseFloat(String(row[14] || '0')).toFixed(2),
        gst_amount: parseFloat(String(row[15] || '0')).toFixed(2),
        cess_percent: parseFloat(String(row[16] || '0')).toFixed(2),
        cess_value: parseFloat(String(row[17] || '0')).toFixed(2),
        state_cess_percent: parseFloat(String(row[18] || '0')).toFixed(2),
        state_cess: parseFloat(String(row[19] || '0')).toFixed(2),
        landing_cost: parseFloat(String(row[20] || '0')).toFixed(2),
        mrp: parseFloat(String(row[21] || '0')).toFixed(2),
        total_value: parseFloat(String(row[22] || '0')).toFixed(2)
      };
      
      lines.push(line);
      
      // Calculate totals
      totalQuantity += line.quantity;
      totalValue += parseFloat(line.total_value || '0');
      totalGST += parseFloat(line.gst_amount || '0');
      totalCess += parseFloat(line.cess_value || '0');
      
      console.log(`Parsed BigBasket line item ${sNo}:`, {
        sku_code: line.sku_code,
        description: line.description?.substring(0, 50) + '...',
        quantity: line.quantity,
        total_value: line.total_value
      });
    }
    
    // Update header totals
    header.total_items = lines.length;
    header.total_quantity = totalQuantity;
    header.grand_total = totalValue.toFixed(2);
    header.total_gst_amount = totalGST.toFixed(2);
    header.total_cess_amount = totalCess.toFixed(2);
    header.total_basic_cost = lines.reduce((sum, line) => sum + (parseFloat(line.basic_cost || '0') * line.quantity), 0).toFixed(2);
    
    console.log("BigBasket PO parsed successfully:", {
      po_number: header.po_number,
      total_items: header.total_items,
      total_quantity: header.total_quantity,
      grand_total: header.grand_total
    });
    
    return {
      header,
      lines,
      totalItems: lines.length,
      totalQuantity,
      totalAmount: totalValue.toFixed(2),
      detectedVendor: 'bigbasket'
    };
    
  } catch (error) {
    console.error("Error parsing BigBasket PO:", error);
    throw new Error(`Failed to parse BigBasket file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    // Handle DD/MMM/YYYY format (e.g., "08/Aug/2025")
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const year = parseInt(parts[2]);
      
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const month = monthMap[monthStr];
      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }
    
    // Fallback to Date.parse
    const parsed = Date.parse(dateStr);
    return isNaN(parsed) ? null : new Date(parsed);
  } catch (error) {
    console.error("Error parsing date:", dateStr, error);
    return null;
  }
}