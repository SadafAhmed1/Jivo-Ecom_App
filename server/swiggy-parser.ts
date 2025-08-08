import XLSX from 'xlsx';
import type { InsertSwiggyPo, InsertSwiggyPoLine } from '@shared/schema';

interface ParsedSwiggyPO {
  header: InsertSwiggyPo;
  lines: InsertSwiggyPoLine[];
}

export function parseSwiggyPO(fileBuffer: Buffer, uploadedBy: string): ParsedSwiggyPO {
  try {
    // Read the Excel XML file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to JSON to get all data
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      range: 0 
    }) as any[][];

    // Initialize header variables
    let poNumber = '';
    let poDate: Date | undefined;
    let poReleaseDate: Date | undefined;
    let expectedDeliveryDate: Date | undefined;
    let poExpiryDate: Date | undefined;
    let paymentTerms = '';
    let vendorName = '';
    let vendorAddress = '';
    let vendorGstin = '';
    let billingAddress = '';
    let shippingAddress = '';

    // Extract header information from the first rows
    for (let i = 0; i < Math.min(20, jsonData.length); i++) {
      const row = jsonData[i];
      if (!row) continue;

      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (!cell) continue;
        
        const cellStr = cell.toString().trim();
        
        // Extract PO Number
        if (cellStr === 'PO No :' && j + 1 < row.length && row[j + 1]) {
          poNumber = row[j + 1].toString().trim();
        }
        
        // Extract dates
        if (cellStr === 'PO Date :' && j + 1 < row.length && row[j + 1]) {
          poDate = parseSwiggyDate(row[j + 1].toString());
        }
        if (cellStr === 'PO Release Date :' && j + 1 < row.length && row[j + 1]) {
          poReleaseDate = parseSwiggyDate(row[j + 1].toString());
        }
        if (cellStr === 'Expected Delivery Date:' && j + 1 < row.length && row[j + 1]) {
          expectedDeliveryDate = parseSwiggyDate(row[j + 1].toString());
        }
        if (cellStr === 'PO Expiry Date: ' && j + 1 < row.length && row[j + 1]) {
          poExpiryDate = parseSwiggyDate(row[j + 1].toString());
        }
        
        // Extract payment terms
        if (cellStr === 'Payment Terms :' && j + 1 < row.length && row[j + 1]) {
          paymentTerms = row[j + 1].toString().trim();
        }
        
        // Extract vendor information from multi-line cells
        if (cellStr.includes('Vendor Name :')) {
          const lines = cellStr.split('\n');
          if (lines.length > 1) {
            vendorName = lines[0].replace('Vendor Name :', '').trim();
            vendorAddress = lines.slice(1, -2).join(', ');
            const gstinLine = lines.find(line => line.includes('GSTIN'));
            if (gstinLine) {
              vendorGstin = gstinLine.replace('GSTIN :', '').trim();
            }
          }
        }
      }
    }

    // Find the item data section - look for column headers
    let itemDataStartRow = -1;
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row) continue;
      
      const hasSerialNo = row.some(cell => cell && cell.toString().trim() === 'S.');
      const hasItemCode = row.some(cell => cell && cell.toString().trim() === 'Item Code');
      const hasItemDesc = row.some(cell => cell && cell.toString().trim() === 'Item Desc');
      
      if (hasSerialNo && hasItemCode && hasItemDesc) {
        // Skip the header row and the next row (which contains "No")
        itemDataStartRow = i + 2;
        break;
      }
    }

    const lines: InsertSwiggyPoLine[] = [];
    let totalQuantity = 0;
    let totalTaxableValue = 0;
    let totalTaxAmount = 0;
    let totalAmount = 0;

    // Parse item data
    if (itemDataStartRow > 0) {
      for (let i = itemDataStartRow; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 10) continue;
        
        // Check if this is an item row by looking at the first cell
        const serialNumber = parseInt(row[0]?.toString() || '0');
        if (isNaN(serialNumber) || serialNumber === 0) continue;

        try {
          const line: InsertSwiggyPoLine = {
            line_number: serialNumber,
            item_code: row[1]?.toString() || '',
            item_description: row[2]?.toString().replace(/\n/g, ' ') || '',
            hsn_code: row[4]?.toString() || '',
            quantity: parseInt(row[5]?.toString() || '0'),
            mrp: parseDecimal(row[6]?.toString()),
            unit_base_cost: parseDecimal(row[8]?.toString()),
            taxable_value: parseDecimal(row[9]?.toString()),
            cgst_rate: parseDecimal(row[10]?.toString()),
            cgst_amount: parseDecimal(row[12]?.toString()),
            sgst_rate: parseDecimal(row[13]?.toString()),
            sgst_amount: parseDecimal(row[15]?.toString()),
            igst_rate: parseDecimal(row[16]?.toString()),
            igst_amount: parseDecimal(row[17]?.toString()),
            cess_rate: parseDecimal(row[19]?.toString()),
            cess_amount: parseDecimal(row[20]?.toString()),
            additional_cess: parseDecimal(row[21]?.toString()),
            total_amount: parseDecimal(row[22]?.toString()),
            status: 'Pending',
            created_by: uploadedBy
          };

          lines.push(line);

          // Update totals
          totalQuantity += line.quantity || 0;
          totalTaxableValue += Number(line.taxable_value || 0);
          totalTaxAmount += (Number(line.cgst_amount || 0) + Number(line.sgst_amount || 0) + 
                            Number(line.igst_amount || 0) + Number(line.cess_amount || 0) + 
                            Number(line.additional_cess || 0));
          totalAmount += Number(line.total_amount || 0);
        } catch (error) {
          console.warn(`Error parsing Swiggy PO line ${i}:`, error);
          continue;
        }
      }
    }

    // Generate PO number if not found
    if (!poNumber) {
      const timestamp = Date.now();
      poNumber = `SW_${timestamp}`;
    }

    const header: InsertSwiggyPo = {
      po_number: poNumber,
      po_date: poDate,
      po_release_date: poReleaseDate,
      expected_delivery_date: expectedDeliveryDate,
      po_expiry_date: poExpiryDate,
      payment_terms: paymentTerms,
      vendor_name: vendorName,
      vendor_address: vendorAddress,
      vendor_gstin: vendorGstin,
      billing_address: billingAddress,
      shipping_address: shippingAddress,
      total_quantity: totalQuantity,
      total_taxable_value: totalTaxableValue.toString(),
      total_tax_amount: totalTaxAmount.toString(),
      total_amount: totalAmount.toString(),
      status: 'Open',
      created_by: uploadedBy,
      uploaded_by: uploadedBy
    };

    return { header, lines };
  } catch (error) {
    throw new Error(`Failed to parse Swiggy PO: ${error.message}`);
  }
}

function parseSwiggyDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  
  try {
    const cleanDateStr = dateStr.toString().trim();
    
    // Handle Excel date format (e.g., "Aug 4, 2025")
    if (cleanDateStr.includes(',')) {
      return new Date(cleanDateStr);
    }
    
    // Handle other date formats
    return new Date(cleanDateStr);
  } catch (error) {
    console.warn('Error parsing Swiggy date:', dateStr, error);
    return undefined;
  }
}

function parseDecimal(value: string | undefined): string | null {
  if (!value) return null;
  
  try {
    const cleanValue = value.toString().replace(/[^\d.-]/g, '').trim();
    if (cleanValue === '') return null;
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed.toString();
  } catch (error) {
    return null;
  }
}