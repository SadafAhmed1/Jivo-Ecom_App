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
    
    // Convert to JSON to get all data - use different options to handle merged cells
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      range: 0,
      raw: false,
      dateNF: 'mmm d, yyyy'
    }) as any[][];
    
    // Also try to get raw cell data to find dates
    const rawData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      range: 0,
      raw: true
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
    for (let i = 0; i < Math.min(25, jsonData.length); i++) {
      const row = jsonData[i];
      if (!row) continue;

      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (!cell) continue;
        
        const cellStr = cell.toString().trim();
        

        

        
        // Extract PO Number - check current and next several cells
        if (cellStr === 'PO No :') {
          // Look in next few cells for the PO number
          for (let k = j + 1; k < Math.min(j + 10, row.length); k++) {
            if (row[k] && row[k].toString().trim()) {
              const potentialPO = row[k].toString().trim();
              if (potentialPO.startsWith('JCNPO') || potentialPO.startsWith('SOTY-')) {
                poNumber = potentialPO;
                break;
              }
            }
          }
        }
        
        // Also check if the cell itself contains a PO number
        if (cellStr.startsWith('JCNPO') || cellStr.startsWith('SOTY-')) {
          poNumber = cellStr;
        }
        
        // Extract dates - look in next several cells for the date value
        if (cellStr === 'PO Date :') {
          for (let k = j + 1; k < Math.min(j + 15, row.length); k++) {
            if (row[k] && row[k].toString().trim()) {
              const dateStr = row[k].toString().trim();
              if (dateStr.includes('Aug') || dateStr.includes('2024') || dateStr.includes('2025')) {
                poDate = parseSwiggyDate(dateStr);
                break;
              }
            }
          }
          // Also check raw data for the same position
          if (!poDate && rawData[i]) {
            for (let k = j + 1; k < Math.min(j + 15, rawData[i].length); k++) {
              if (rawData[i][k] && rawData[i][k].toString().trim()) {
                const dateStr = rawData[i][k].toString().trim();
                if (dateStr.includes('Aug') || dateStr.includes('2024') || dateStr.includes('2025')) {
                  poDate = parseSwiggyDate(dateStr);
                  break;
                }
              }
            }
          }
        }
        if (cellStr === 'PO Release Date :') {
          for (let k = j + 1; k < Math.min(j + 15, row.length); k++) {
            if (row[k] && row[k].toString().trim()) {
              const dateStr = row[k].toString().trim();
              if (dateStr.includes('Aug') || dateStr.includes('2024') || dateStr.includes('2025')) {
                poReleaseDate = parseSwiggyDate(dateStr);
                break;
              }
            }
          }
        }
        if (cellStr === 'Expected Delivery Date:') {
          for (let k = j + 1; k < Math.min(j + 15, row.length); k++) {
            if (row[k] && row[k].toString().trim()) {
              const dateStr = row[k].toString().trim();
              if (dateStr.includes('Aug') || dateStr.includes('2024') || dateStr.includes('2025')) {
                expectedDeliveryDate = parseSwiggyDate(dateStr);
                break;
              }
            }
          }
        }
        if (cellStr === 'PO Expiry Date: ') {
          for (let k = j + 1; k < Math.min(j + 15, row.length); k++) {
            if (row[k] && row[k].toString().trim()) {
              const dateStr = row[k].toString().trim();
              if (dateStr.includes('Aug') || dateStr.includes('2024') || dateStr.includes('2025')) {
                poExpiryDate = parseSwiggyDate(dateStr);
                break;
              }
            }
          }
        }
        
        // Extract payment terms - check multiple approaches
        if (cellStr === 'Payment Terms :' || cellStr.includes('Payment Terms')) {
          // Look in next few cells for the value
          for (let k = j + 1; k < Math.min(j + 10, row.length); k++) {
            if (row[k] && row[k].toString().trim()) {
              const value = row[k].toString().trim();
              if (value && value !== '' && !value.includes('PO') && !value.includes('Date')) {
                paymentTerms = value;
                break;
              }
            }
          }
        }
        
        // Also look for "0 Days" or similar patterns directly
        if ((cellStr === '0 Days' || cellStr.includes('Days')) && !paymentTerms) {
          paymentTerms = cellStr;
        }
        
        // Extract vendor information - check for "Vendor Name :" in separate cells  
        if (cellStr === 'Vendor Name :' || cellStr.includes('Vendor Name')) {
          // The vendor name might be in merged cells or subsequent rows
          // Check the current row and next few rows for vendor information
          for (let nextRow = i; nextRow < Math.min(i + 5, jsonData.length); nextRow++) {
            const searchRow = jsonData[nextRow];
            if (searchRow) {
              for (let k = 0; k < searchRow.length; k++) {
                if (searchRow[k] && searchRow[k].toString().trim()) {
                  const value = searchRow[k].toString().trim();
                  // Look for vendor name that's not a label or empty
                  if (value && value !== '' && 
                      !value.includes(':') && 
                      !value.includes('PO') && 
                      !value.includes('Date') && 
                      !value.includes('Payment') &&
                      !value.includes('Expected') &&
                      !value.includes('Vendor Name') &&
                      !value.includes('Aug') &&
                      !value.includes('2025') &&
                      value.length > 3) {
                    vendorName = value;
                    break;
                  }
                }
              }
              if (vendorName) break;
            }
          }
        }
        
        // Extract vendor information from multi-line cells
        if (cellStr.includes('Vendor Name :')) {
          const lines = cellStr.split('\n');
          if (lines.length > 1) {
            vendorName = lines[0].replace('Vendor Name :', '').trim();
            vendorAddress = lines.slice(1, -2).join(', ');
            const gstinLine = lines.find((line: any) => line.includes('GSTIN'));
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
            hsn_code: findHsnCode(row),
            quantity: parseInt(row[5]?.toString() || '0'),
            mrp: parseDecimal(row[6]?.toString()),
            unit_base_cost: findUnitCost(row)?.toString() || null,
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
            line_total: parseDecimal(row[22]?.toString()),
            created_by: uploadedBy
          };

          lines.push(line);

          // Update totals
          totalQuantity += line.quantity || 0;
          totalTaxableValue += Number(line.taxable_value || 0);
          totalTaxAmount += (Number(line.cgst_amount || 0) + Number(line.sgst_amount || 0) + 
                            Number(line.igst_amount || 0) + Number(line.cess_amount || 0) + 
                            Number(line.additional_cess || 0));
          totalAmount += Number(line.line_total || 0);
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
    
    // Set default vendor name if not found - but don't use problematic values
    if (!vendorName || vendorName === "N/A" || vendorName.includes("Aug") || vendorName.includes("2025")) {
      vendorName = null;
    }
    
    // Filter out empty line items
    const filteredLines = lines.filter(line => 
      line.item_code && line.item_code.trim() !== '' && 
      line.quantity > 0
    );

    const header: InsertSwiggyPo = {
      po_number: poNumber,
      po_date: poDate ? new Date(poDate + 'T00:00:00Z') : null,
      po_release_date: poReleaseDate ? new Date(poReleaseDate + 'T00:00:00Z') : null,
      expected_delivery_date: expectedDeliveryDate ? new Date(expectedDeliveryDate + 'T00:00:00Z') : null,
      po_expiry_date: poExpiryDate ? new Date(poExpiryDate + 'T00:00:00Z') : null,
      vendor_name: vendorName && vendorName !== "N/A" && vendorName !== "Aug 4, 2025" ? vendorName : null,
      payment_terms: paymentTerms || null,
      total_items: filteredLines.length,
      total_quantity: totalQuantity,
      total_taxable_value: totalTaxableValue > 0 ? totalTaxableValue.toString() : null,
      total_tax_amount: totalTaxAmount > 0 ? totalTaxAmount.toString() : null,
      grand_total: totalAmount > 0 ? totalAmount.toString() : null,
      unique_hsn_codes: Array.from(new Set(filteredLines.map(line => line.hsn_code).filter(Boolean))),
      status: 'pending',
      created_by: uploadedBy
    };

    return { header, lines: filteredLines };
  } catch (error) {
    throw new Error(`Failed to parse Swiggy PO: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseSwiggyDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  
  try {
    const cleanDateStr = dateStr.toString().trim();
    
    // Handle Excel date format (e.g., "Aug 4, 2025")
    const date = new Date(cleanDateStr);
    
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    }
    
    return null;
  } catch (error) {
    console.warn('Error parsing Swiggy date:', dateStr, error);
    return null;
  }
}

// Helper function to find HSN code in a row (could be in different columns)
function findHsnCode(row: any[]): string | null {
  // Common positions for HSN codes in Swiggy files
  const possibleIndexes = [3, 4, 5];
  
  for (const index of possibleIndexes) {
    if (row[index]) {
      const value = row[index].toString().trim();
      // HSN codes are typically 8-digit numbers
      if (/^\d{8}$/.test(value)) {
        return value;
      }
    }
  }
  
  // Also check for HSN codes anywhere in the row
  for (let i = 0; i < row.length; i++) {
    if (row[i]) {
      const value = row[i].toString().trim();
      if (/^\d{8}$/.test(value) && !isNaN(Number(value))) {
        return value;
      }
    }
  }
  
  return null;
}

// Helper function to find unit cost in a row (could be in different columns)
function findUnitCost(row: any[]): number | null {
  // Common positions for unit cost in Swiggy files
  const possibleIndexes = [7, 8, 9];
  
  for (const index of possibleIndexes) {
    if (row[index]) {
      const value = parseDecimal(row[index].toString());
      // Unit costs are typically reasonable decimal values
      if (value && Number(value) > 0 && Number(value) < 10000) {
        return Number(value);
      }
    }
  }
  
  return null;
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