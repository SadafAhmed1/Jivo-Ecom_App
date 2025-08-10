import xlsx from 'xlsx';

interface ZomatoPoHeader {
  po_number: string;
  po_date?: Date | null;
  expected_delivery_date?: Date | null;
  account_number?: string;
  vendor_id?: string;
  bill_from_name?: string;
  bill_from_address?: string;
  bill_from_gstin?: string;
  bill_from_phone?: string;
  bill_to_name?: string;
  bill_to_address?: string;
  bill_to_gstin?: string;
  ship_from_name?: string;
  ship_from_address?: string;
  ship_from_gstin?: string;
  ship_to_name?: string;
  ship_to_address?: string;
  ship_to_gstin?: string;
  total_items?: number;
  total_quantity?: string;
  grand_total?: string;
  total_tax_amount?: string;
  uploaded_by?: string;
}

interface ZomatoPoItem {
  line_number: number;
  product_number?: string;
  product_name?: string;
  hsn_code?: string;
  quantity_ordered?: string;
  price_per_unit?: string;
  uom?: string;
  gst_rate?: string;
  total_tax_amount?: string;
  line_total?: string;
}

export async function parseZomatoPO(buffer: Buffer, uploadedBy: string) {
  try {
    console.log("Processing Zomato Excel file...");
    
    const workbook = xlsx.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });

    console.log(`Zomato Excel has ${jsonData.length} rows`);

    // Parse header information from structured rows
    let header: ZomatoPoHeader = {
      po_number: '',
      uploaded_by: uploadedBy
    };

    // Extract PO information from row 4 (index 3)
    const poInfoRow = jsonData[3] as any[];
    if (poInfoRow && poInfoRow.length > 0) {
      // Extract PO Number (first cell contains "Purchase Order Number\nZHPGJ26-PO-2009516")
      const poNumberCell = poInfoRow[0];
      if (poNumberCell && typeof poNumberCell === 'string') {
        const poMatch = poNumberCell.match(/Purchase Order Number\s*\n?(.+)/i);
        if (poMatch) {
          header.po_number = poMatch[1].trim();
        }
      }

      // Extract PO Date (4th cell contains "Purchase Order Date\n06-Aug-2025")
      const poDateCell = poInfoRow[3];
      if (poDateCell && typeof poDateCell === 'string') {
        const dateMatch = poDateCell.match(/Purchase Order Date\s*\n?(.+)/i);
        if (dateMatch) {
          header.po_date = parseDate(dateMatch[1].trim());
        }
      }

      // Extract Expected Delivery Date (8th cell)
      const deliveryDateCell = poInfoRow[7];
      if (deliveryDateCell && typeof deliveryDateCell === 'string') {
        const deliveryMatch = deliveryDateCell.match(/Expected Delivery Date\s*\n?(.+)/i);
        if (deliveryMatch) {
          header.expected_delivery_date = parseDate(deliveryMatch[1].trim());
        }
      }

      // Extract Account Number (14th cell)
      const accountCell = poInfoRow[13];
      if (accountCell && typeof accountCell === 'string') {
        const accountMatch = accountCell.match(/Account Number\s*\n?(.+)/i);
        if (accountMatch) {
          header.account_number = accountMatch[1].trim();
        }
      }

      // Extract Vendor ID (18th cell)
      const vendorCell = poInfoRow[17];
      if (vendorCell && typeof vendorCell === 'string') {
        const vendorMatch = vendorCell.match(/Vendor Id\s*\n?(.+)/i);
        if (vendorMatch) {
          header.vendor_id = vendorMatch[1].trim();
        }
      }
    }

    // Extract billing/shipping info from rows 2-3
    const billFromRow = jsonData[1] as any[];
    const billToRow = jsonData[2] as any[];

    if (billFromRow && billFromRow[0]) {
      const billFromText = billFromRow[0];
      if (typeof billFromText === 'string') {
        const lines = billFromText.split('\n');
        header.bill_from_name = lines[1]?.trim() || '';
        header.bill_from_address = lines[2]?.trim() || '';
        const gstinMatch = billFromText.match(/GSTIN\s*:\s*([^\s]+)/);
        if (gstinMatch) header.bill_from_gstin = gstinMatch[1];
        const phoneMatch = billFromText.match(/Phone\s*:\s*([^\s]+)/);
        if (phoneMatch) header.bill_from_phone = phoneMatch[1];
      }
    }

    if (billToRow && billToRow[0]) {
      const billToText = billToRow[0];
      if (typeof billToText === 'string') {
        const lines = billToText.split('\n');
        header.bill_to_name = lines[1]?.trim() || '';
        header.bill_to_address = lines[2]?.trim() || '';
        const gstinMatch = billToText.match(/GSTIN\s*:\s*([^\s]+)/);
        if (gstinMatch) header.bill_to_gstin = gstinMatch[1];
      }
    }

    // Parse line items starting from row 6 (index 5)
    const lines: ZomatoPoItem[] = [];
    let totalQuantity = 0;
    let totalValue = 0;
    let totalTax = 0;

    // Row 5 contains headers, data starts from row 6
    for (let i = 5; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      if (!row || row.length < 10) continue;

      const productNumber = row[0];
      const productName = row[1];
      const hsnCode = row[5];
      const quantity = row[8];
      const pricePerUnit = row[11];
      const uom = row[13];
      const gstRate = row[15];
      const taxAmount = row[17];
      const lineTotal = row[18];

      if (!productNumber || !quantity) continue;

      const line: ZomatoPoItem = {
        line_number: i - 4, // Adjust for header rows
        product_number: String(productNumber),
        product_name: String(productName || ''),
        hsn_code: String(hsnCode || ''),
        quantity_ordered: parseFloat(String(quantity || '0')).toFixed(2),
        price_per_unit: parseFloat(String(pricePerUnit || '0')).toFixed(2),
        uom: String(uom || ''),
        gst_rate: parseFloat(String(gstRate || '0')).toFixed(4),
        total_tax_amount: parseFloat(String(taxAmount || '0')).toFixed(2),
        line_total: parseLineTotal(lineTotal)
      };

      lines.push(line);

      // Calculate totals
      totalQuantity += parseFloat(line.quantity_ordered || '0');
      totalValue += parseFloat(line.line_total || '0');
      totalTax += parseFloat(line.total_tax_amount || '0');

      console.log(`Parsed Zomato line item ${line.line_number}:`, {
        product_number: line.product_number,
        product_name: line.product_name?.substring(0, 50) + '...',
        quantity: line.quantity_ordered,
        line_total: line.line_total
      });
    }

    // Update header totals
    header.total_items = lines.length;
    header.total_quantity = totalQuantity.toFixed(2);
    header.grand_total = totalValue.toFixed(2);
    header.total_tax_amount = totalTax.toFixed(2);

    console.log("Zomato PO parsed successfully:", {
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
      detectedVendor: 'zomato'
    };

  } catch (error) {
    console.error("Error parsing Zomato PO:", error);
    throw new Error(`Failed to parse Zomato file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    // Handle DD-MMM-YYYY format (e.g., "06-Aug-2025")
    const parts = dateStr.split('-');
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

function parseLineTotal(total: any): string {
  if (!total) return '0.00';
  
  // Convert to string and remove commas
  let totalStr = String(total).replace(/,/g, '');
  
  // Parse as float
  const parsed = parseFloat(totalStr);
  return isNaN(parsed) ? '0.00' : parsed.toFixed(2);
}