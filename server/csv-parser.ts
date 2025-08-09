import { parse } from 'csv-parse/sync';
import XLSX from 'xlsx';
import * as xml2js from 'xml2js';
import Papa from 'papaparse';
import type { InsertFlipkartGroceryPoHeader, InsertFlipkartGroceryPoLines, InsertZeptoPoHeader, InsertZeptoPoLines, InsertCityMallPoHeader, InsertCityMallPoLines, InsertBlinkitPoHeader, InsertBlinkitPoLines, InsertSwiggyPo, InsertSwiggyPoLine } from '@shared/schema';

interface ParsedFlipkartPO {
  header: InsertFlipkartGroceryPoHeader;
  lines: InsertFlipkartGroceryPoLines[];
}

export function parseFlipkartGroceryPO(csvContent: string, uploadedBy: string): ParsedFlipkartPO {
  const records = parse(csvContent, {
    skip_empty_lines: true,
    relax_column_count: true
  });

  let header: InsertFlipkartGroceryPoHeader;
  const lines: InsertFlipkartGroceryPoLines[] = [];

  // Parse header information from the first few rows
  let poNumber = '';
  let supplierName = '';
  let supplierAddress = '';
  let supplierContact = '';
  let supplierEmail = '';
  let supplierGstin = '';
  let billedToAddress = '';
  let billedToGstin = '';
  let shippedToAddress = '';
  let shippedToGstin = '';
  let natureOfSupply = '';
  let natureOfTransaction = '';
  let poExpiryDate: Date | undefined;
  let category = '';
  let orderDate: Date = new Date();
  let modeOfPayment = '';
  let contractRefId = '';
  let contractVersion = '';
  let creditTerm = '';

  // Extract header data from structured CSV
  for (let i = 0; i < Math.min(10, records.length); i++) {
    const row = records[i];
    if (!row || row.length === 0) continue;

    // PO Number from row 1
    if (row[0]?.includes('PURCHASE ORDER #')) {
      poNumber = row[0].split('#')[1]?.trim() || '';
    }
    
    // PO details from row 2
    if (row[0] === 'PO#' && row[1]) {
      poNumber = row[1].trim();
      
      // Extract other details from this row
      for (let j = 0; j < row.length; j++) {
        if (row[j] === 'Nature Of Supply' && row[j + 1]) {
          natureOfSupply = row[j + 1];
        }
        if (row[j] === 'Nature of Transaction' && row[j + 1]) {
          natureOfTransaction = row[j + 1];
        }
        if (row[j] === 'PO Expiry' && row[j + 1]) {
          poExpiryDate = parseDate(row[j + 1]);
        }
        if (row[j] === 'CATEGORY' && row[j + 1]) {
          category = row[j + 1];
        }
        if (row[j] === 'ORDER DATE' && row[j + 1]) {
          orderDate = parseDate(row[j + 1]) || new Date();
        }
      }
    }

    // Supplier details from row 3
    if (row[0] === 'SUPPLIER NAME' && row[1]) {
      supplierName = row[1];
      
      for (let j = 0; j < row.length; j++) {
        if (row[j] === 'SUPPLIER ADDRESS' && row[j + 1]) {
          supplierAddress = row[j + 1];
        }
        if (row[j] === 'SUPPLIER CONTACT' && row[j + 1]) {
          supplierContact = row[j + 1];
        }
        if (row[j] === 'EMAIL' && row[j + 1]) {
          supplierEmail = row[j + 1];
        }
      }
    }

    // Billing and shipping details from row 4
    if (row[0] === 'Billed by') {
      for (let j = 0; j < row.length; j++) {
        if (row[j] === 'GSTIN' && row[j + 1] && !supplierGstin) {
          supplierGstin = row[j + 1];
        }
      }
    }

    // Billed to address from row 5
    if (row[0] === 'BILLED TO ADDRESS' && row[2]) {
      billedToAddress = row[2];
      
      for (let j = 0; j < row.length; j++) {
        if (row[j] === 'GSTIN' && row[j + 1] && !billedToGstin) {
          billedToGstin = row[j + 1];
        }
        if (row[j] === 'SHIPPED TO ADDRESS' && row[j + 2]) {
          shippedToAddress = row[j + 2];
        }
        if (row[j] === 'GSTIN' && row[j + 1] && billedToGstin && !shippedToGstin) {
          shippedToGstin = row[j + 1];
        }
      }
    }

    // Payment details from row 7
    if (row[0] === 'MODE OF PAYMENT' && row[2]) {
      modeOfPayment = row[2];
      
      for (let j = 0; j < row.length; j++) {
        if (row[j] === 'CONTRACT REF ID' && row[j + 1]) {
          contractRefId = row[j + 1];
        }
        if (row[j] === 'CONTRACT VERSION' && row[j + 1]) {
          contractVersion = row[j + 1];
        }
        if (row[j] === 'CREDIT TERM' && row[j + 2]) {
          creditTerm = row[j + 2];
        }
      }
    }
  }

  // Find the header row for order details
  let orderDetailsStartIndex = -1;
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    if (row && row[0] === 'S. no.' && row.includes('HSN/SA Code')) {
      orderDetailsStartIndex = i + 1;
      break;
    }
  }

  // Parse line items
  let totalQuantity = 0;
  let totalTaxableValue = 0;
  let totalTaxAmount = 0;
  let totalAmount = 0;

  if (orderDetailsStartIndex > 0) {
    for (let i = orderDetailsStartIndex; i < records.length; i++) {
      const row = records[i];
      if (!row || row.length < 5) continue;
      
      // Stop if we hit summary or notification rows
      if (row[0]?.toString().includes('Total Quantity') || 
          row[0]?.toString().includes('Important Notification') ||
          !row[0] || row[0].toString().trim() === '') {
        break;
      }

      try {
        const lineNumber = parseInt(row[0]?.toString() || '0');
        if (lineNumber > 0) {
          const line: InsertFlipkartGroceryPoLines = {
            line_number: lineNumber,
            hsn_code: row[1]?.toString() || null,
            fsn_isbn: row[2]?.toString() || null,
            quantity: parseInt(row[3]?.toString() || '0'),
            pending_quantity: parseInt(row[4]?.toString() || '0'),
            uom: row[5]?.toString() || null,
            title: row[6]?.toString() || '',
            brand: row[8]?.toString() || null,
            type: row[9]?.toString() || null,
            ean: row[10]?.toString() || null,
            vertical: row[11]?.toString() || null,
            required_by_date: parseDate(row[12]?.toString()),
            supplier_mrp: parseDecimal(row[13]?.toString()),
            supplier_price: parseDecimal(row[14]?.toString()),
            taxable_value: parseDecimal(row[15]?.toString()),
            igst_rate: parseDecimal(row[16]?.toString()),
            igst_amount_per_unit: parseDecimal(row[17]?.toString()),
            sgst_rate: parseDecimal(row[18]?.toString()),
            sgst_amount_per_unit: parseDecimal(row[19]?.toString()),
            cgst_rate: parseDecimal(row[20]?.toString()),
            cgst_amount_per_unit: parseDecimal(row[21]?.toString()),
            cess_rate: parseDecimal(row[22]?.toString()),
            cess_amount_per_unit: parseDecimal(row[23]?.toString()),
            tax_amount: parseDecimal(row[24]?.toString()),
            total_amount: parseDecimal(row[25]?.toString()),
            status: 'Pending',
            created_by: uploadedBy
          };

          lines.push(line);
          
          // Update totals
          totalQuantity += line.quantity;
          totalTaxableValue += Number(line.taxable_value) || 0;
          totalTaxAmount += Number(line.tax_amount) || 0;
          totalAmount += Number(line.total_amount) || 0;
        }
      } catch (error) {
        console.warn(`Error parsing line ${i}:`, error);
        continue;
      }
    }
  }

  header = {
    po_number: poNumber,
    supplier_name: supplierName,
    supplier_address: supplierAddress,
    supplier_contact: supplierContact,
    supplier_email: supplierEmail,
    supplier_gstin: supplierGstin,
    billed_to_address: billedToAddress,
    billed_to_gstin: billedToGstin,
    shipped_to_address: shippedToAddress,
    shipped_to_gstin: shippedToGstin,
    nature_of_supply: natureOfSupply,
    nature_of_transaction: natureOfTransaction,
    po_expiry_date: poExpiryDate,
    category: category,
    order_date: orderDate,
    mode_of_payment: modeOfPayment,
    contract_ref_id: contractRefId,
    contract_version: contractVersion,
    credit_term: creditTerm,
    total_quantity: totalQuantity,
    total_taxable_value: totalTaxableValue.toString(),
    total_tax_amount: totalTaxAmount.toString(),
    total_amount: totalAmount.toString(),
    status: 'Open',
    created_by: uploadedBy,
    uploaded_by: uploadedBy
  };

  return { header, lines };
}

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  
  try {
    // Handle DD-MM-YY format
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
        let year = parseInt(parts[2]);
        
        // Convert 2-digit year to 4-digit
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        
        return new Date(year, month, day);
      }
    }
    
    return new Date(dateStr);
  } catch (error) {
    console.warn('Error parsing date:', dateStr, error);
    return undefined;
  }
}

function parseDecimal(value: string | undefined): string | null {
  if (!value) return null;
  
  try {
    // Remove currency symbols and extra text
    const cleanValue = value.toString()
      .replace(/[^\d.-]/g, '')
      .trim();
    
    if (cleanValue === '') return null;
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed.toString();
  } catch (error) {
    return null;
  }
}

function extractBrandFromName(articleName: string): string {
  // Extract brand from article name (first word typically)
  if (!articleName) return 'Unknown';
  
  const words = articleName.trim().split(' ');
  if (words.length > 0) {
    return words[0];
  }
  return 'Unknown';
}

interface ParsedZeptoPO {
  header: InsertZeptoPoHeader;
  lines: InsertZeptoPoLines[];
}

export function parseZeptoPO(csvContent: string, uploadedBy: string): ParsedZeptoPO {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  if (records.length === 0) {
    throw new Error('CSV file is empty or invalid');
  }

  // Get PO number from first record, generate if not found
  const firstRecord = records[0] as Record<string, string>;
  let poNumber = firstRecord['PO No.'];
  if (!poNumber) {
    // Generate PO number based on timestamp and first article ID
    const timestamp = Date.now().toString().slice(-6);
    const articleId = firstRecord['Article Id'] || 'UNKNOWN';
    poNumber = `ZP${timestamp}_${articleId.slice(0, 6)}`;
  }

  const lines: InsertZeptoPoLines[] = [];
  const brands = new Set<string>();
  let totalQuantity = 0;
  let totalCostValue = 0;
  let totalTaxAmount = 0;
  let totalAmount = 0;

  // Process each line item
  records.forEach((record: Record<string, string>, index: number) => {
    try {
      const line: InsertZeptoPoLines = {
        line_number: index + 1,
        po_number: record['PO No.'] || poNumber,
        sku: record['Article Name'] || '',
        brand: record['Brand'] || extractBrandFromName(record['Article Name'] || ''),
        sku_id: record['SKU Id'] || '',
        sap_id: record['Article Id'] || '',
        hsn_code: record['HSN Code'] || '',
        ean_no: record['EAN No.'] || '',
        po_qty: parseInt(record['Quantity']) || 0,
        asn_qty: 0, // Not available in this CSV format
        grn_qty: 0, // Not available in this CSV format
        remaining_qty: parseInt(record['Quantity']) || 0, // Same as PO qty initially
        cost_price: parseDecimal(record['Base Cost Price (₹)']),
        cgst: '0.00', // Extract from IGST field if needed
        sgst: '0.00', // Extract from IGST field if needed
        igst: record['IGST (%) cess (%)'] ? record['IGST (%) cess (%)'].split('\n')[0] || '0.00' : '0.00',
        cess: record['IGST (%) cess (%)'] ? record['IGST (%) cess (%)'].split('\n')[1] || '0.00' : '0.00',
        mrp: parseDecimal(record['MRP (₹)']),
        total_value: parseDecimal(record['Total Amount (₹)']),
        status: 'Pending',
        created_by: uploadedBy
      };

      lines.push(line);

      // Add brand to set
      if (line.brand) {
        brands.add(line.brand);
      }

      // Update totals
      totalQuantity += line.po_qty || 0;
      totalCostValue += Number(line.cost_price || 0) * (line.po_qty || 0);
      totalTaxAmount += (Number(line.cgst || 0) + Number(line.sgst || 0) + Number(line.igst || 0) + Number(line.cess || 0)) * (line.po_qty || 0);
      totalAmount += Number(line.total_value) || 0;

    } catch (error) {
      console.warn(`Error parsing Zepto PO line ${index + 1}:`, error);
    }
  });

  const header: InsertZeptoPoHeader = {
    po_number: poNumber,
    status: 'Open',
    total_quantity: totalQuantity,
    total_cost_value: totalCostValue.toString(),
    total_tax_amount: totalTaxAmount.toString(),
    total_amount: totalAmount.toString(),
    unique_brands: Array.from(brands),
    created_by: uploadedBy,
    uploaded_by: uploadedBy
  };

  return { header, lines };
}

interface ParsedCityMallPO {
  header: InsertCityMallPoHeader;
  lines: InsertCityMallPoLines[];
}

export function parseCityMallPO(csvContent: string, uploadedBy: string): ParsedCityMallPO {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  if (records.length === 0) {
    throw new Error('CSV file is empty or invalid');
  }

  // Extract PO number from filename or use a generated one
  const poNumber = `CM${Date.now()}`;
  
  const lines: InsertCityMallPoLines[] = [];
  const hsnCodes = new Set<string>();
  let totalQuantity = 0;
  let totalBaseAmount = 0;
  let totalIgstAmount = 0;
  let totalCessAmount = 0;
  let totalAmount = 0;

  // Process each line item
  records.forEach((record: Record<string, string>, index: number) => {
    try {
      // Skip total row
      if (record['S.No'] === '' && record['Article Id'] === 'Total') {
        return;
      }

      // Parse IGST and CESS percentages from combined field
      const igstCessField = record['IGST (%) cess (%)'] || '';
      const igstCessLines = igstCessField.split('\n');
      const igstPercent = parseFloat(igstCessLines[0] || '0');
      const cessPercent = parseFloat(igstCessLines[1] || '0');

      // Parse IGST and CESS amounts from combined field
      const igstCessAmountField = record['IGST (₹) cess'] || '';
      const igstCessAmountLines = igstCessAmountField.split('\n');
      const igstAmount = parseFloat(igstCessAmountLines[0] || '0');
      const cessAmount = parseFloat(igstCessAmountLines[1] || '0');

      const line: InsertCityMallPoLines = {
        line_number: parseInt(record['S.No']) || index + 1,
        article_id: record['Article Id'] || '',
        article_name: record['Article Name'] || '',
        hsn_code: record['HSN Code'] || '',
        mrp: parseDecimal(record['MRP (₹)']),
        base_cost_price: parseDecimal(record['Base Cost Price (₹)']),
        quantity: parseInt(record['Quantity']) || 0,
        base_amount: parseDecimal(record['Base Amount (₹)']),
        igst_percent: igstPercent.toString(),
        cess_percent: cessPercent.toString(),
        igst_amount: igstAmount.toString(),
        cess_amount: cessAmount.toString(),
        total_amount: parseDecimal(record['Total Amount (₹)']),
        status: 'Pending',
        created_by: uploadedBy
      };

      lines.push(line);

      // Add HSN code to set
      if (line.hsn_code) {
        hsnCodes.add(line.hsn_code);
      }

      // Update totals
      totalQuantity += line.quantity || 0;
      totalBaseAmount += Number(line.base_amount || 0);
      totalIgstAmount += igstAmount;
      totalCessAmount += cessAmount;
      totalAmount += Number(line.total_amount || 0);

    } catch (error) {
      console.warn(`Error parsing City Mall PO line ${index + 1}:`, error);
    }
  });

  const header: InsertCityMallPoHeader = {
    po_number: poNumber,
    status: 'Open',
    total_quantity: totalQuantity,
    total_base_amount: totalBaseAmount.toString(),
    total_igst_amount: totalIgstAmount.toString(),
    total_cess_amount: totalCessAmount.toString(),
    total_amount: totalAmount.toString(),
    unique_hsn_codes: Array.from(hsnCodes),
    created_by: uploadedBy,
    uploaded_by: uploadedBy
  };

  return { header, lines };
}

export function parseBlinkitPO(fileContent: Buffer, uploadedBy: string): {
  poList: Array<{
    header: InsertBlinkitPoHeader;
    lines: InsertBlinkitPoLines[];
  }>;
} {
  const csvContent = fileContent.toString('utf-8');
  const parsedData = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim()
  });

  if (parsedData.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${parsedData.errors.map(e => e.message).join(', ')}`);
  }

  const rows = parsedData.data as any[];
  if (rows.length === 0) {
    throw new Error('CSV file appears to be empty');
  }

  // Check for required headers - using the actual column names from the new format
  const requiredHeaders = ['po_number', 'item_id', 'name', 'remaining_quantity'];
  const headers = Object.keys(rows[0]);
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
  }

  // Group rows by PO number
  const poGroups: { [poNumber: string]: any[] } = {};
  
  rows.forEach(row => {
    const poNumber = row.po_number?.toString().trim();
    if (!poNumber) {
      throw new Error('po no is not available please check you upload po');
    }
    
    if (!poGroups[poNumber]) {
      poGroups[poNumber] = [];
    }
    poGroups[poNumber].push(row);
  });

  // Process each PO separately
  const poList = Object.entries(poGroups).map(([poNumber, poRows]) => {
    let totalQuantity = 0;
    let totalAmount = 0;

    const blinkitLines: InsertBlinkitPoLines[] = poRows.map((row: any, index: number) => {
      // Use the correct field mappings as specified
      const quantity = Number(row.remaining_quantity) || 0; // remaining_quantity → quantity
      const lineTotal = Number(row.total_amount) || 0;
      
      totalQuantity += quantity;
      totalAmount += lineTotal;

      return {
        line_number: index + 1,
        item_code: String(row.item_id || ''), // item_id → item_code
        hsn_code: '', // Not present in this CSV format
        product_upc: String(row.upc || ''),
        product_description: String(row.name || ''), // name → item_name 
        grammage: String(row.uom_text || ''), // uom_text → uom
        basic_cost_price: (Number(row.cost_price) || 0).toString(),
        cgst_percent: (Number(row.cgst_value) || 0).toString(),
        sgst_percent: (Number(row.sgst_value) || 0).toString(),
        igst_percent: (Number(row.igst_value) || 0).toString(),
        cess_percent: (Number(row.cess_value) || 0).toString(),
        additional_cess: '0',
        tax_amount: (Number(row.tax_value) || 0).toString(),
        landing_rate: (Number(row.landing_rate) || 0).toString(),
        quantity: quantity,
        mrp: (Number(row.mrp) || 0).toString(),
        margin_percent: (Number(row.margin_percentage) || 0).toString(),
        total_amount: lineTotal.toString(),
        status: row.po_state || "Active",
        created_by: uploadedBy
      };
    });

    const blinkitHeader: InsertBlinkitPoHeader = {
      po_number: poNumber,
      status: "Open",
      total_quantity: totalQuantity,
      total_tax_amount: blinkitLines.reduce((sum, line) => sum + Number(line.tax_amount), 0).toString(),
      created_by: uploadedBy
    };

    return { header: blinkitHeader, lines: blinkitLines };
  });

  return { poList };
}

interface ParsedSwiggyPO {
  header: InsertSwiggyPo;
  lines: InsertSwiggyPoLine[];
}

export async function parseSwiggyPO(fileBuffer: Buffer, uploadedBy: string): Promise<ParsedSwiggyPO> {
  // Read the Excel file
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Convert worksheet to CSV format first to get tabular data
  const csvData = XLSX.utils.sheet_to_csv(worksheet);
  
  // Parse CSV to get structured rows
  const records = parse(csvData, {
    skip_empty_lines: true,
    relax_column_count: true
  });
  
  // Initialize variables for header
  let poNumber = '';
  let poDate = '';
  let supplierName = '';
  let totalAmount = 0;
  let totalQuantity = 0;
  
  // Extract header information from CSV rows
  for (const row of records) {
    if (!row || row.length === 0) continue;
    
    for (const value of row) {
      if (!value) continue;
      
      // Look for PO number pattern
      if (typeof value === 'string' && value.includes('SOTY-')) {
        poNumber = value.trim();
      }
      
      // Look for date patterns
      if (typeof value === 'string' && value.match(/\d{2}\/\d{2}\/\d{4}/)) {
        poDate = value;
      }
      
      // Look for supplier information
      if (typeof value === 'string' && value.toLowerCase().includes('supplier')) {
        supplierName = value;
      }
    }
  }
  
  // Parse line items from the data rows
  const lines: InsertSwiggyPoLine[] = [];
  let lineNumber = 1;
  
  // Look for tabular data starting after header rows
  let dataStartRow = -1;
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    if (!row) continue;
    
    // Check if this row contains item data headers
    const cellValues = row.map((val: any) => (val || '').toString().toLowerCase());
    if (cellValues.some((val: string) => val.includes('item') || val.includes('product') || val.includes('description'))) {
      dataStartRow = i + 1;
      break;
    }
  }
  
  // Extract line items
  if (dataStartRow > 0) {
    for (let i = dataStartRow; i < records.length; i++) {
      const row = records[i];
      if (!row || row.length < 3) continue;
      
      // Skip empty rows
      if (row.every((val: any) => !val)) continue;
      
      const itemCode = row[0]?.toString() || '';
      const itemName = row[1]?.toString() || '';
      const quantity = Number(row[2]) || 0;
      const unitPrice = Number(row[3]) || 0;
      const totalPrice = Number(row[4]) || (quantity * unitPrice);
      
      if (itemCode && quantity > 0) {
        lines.push({
          line_number: lineNumber++,
          item_code: itemCode,
          quantity: quantity,
          unit_price: unitPrice.toString(),
          total_amount: totalPrice.toString(),
          uom: 'PCS',
          status: 'Active',
          created_by: uploadedBy
        });
        
        totalQuantity += quantity;
        totalAmount += totalPrice;
      }
    }
  }
  
  // Generate PO number if not found
  if (!poNumber) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    poNumber = `SW_${timestamp}`;
  }
  
  const header: InsertSwiggyPo = {
    po_number: poNumber,
    po_date: poDate ? new Date(poDate) : new Date(),
    total_amount: totalAmount.toString(),
    total_quantity: totalQuantity,
    total_items: lines.length,
    status: 'Open',
    created_by: uploadedBy,
    uploaded_by: uploadedBy
  };
  
  return {
    header,
    lines
  };
}