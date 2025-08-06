import { parse } from 'csv-parse/sync';
import XLSX from 'xlsx';
import type { InsertFlipkartGroceryPoHeader, InsertFlipkartGroceryPoLines, InsertZeptoPoHeader, InsertZeptoPoLines, InsertCityMallPoHeader, InsertCityMallPoLines, InsertBlinkitPoHeader, InsertBlinkitPoLines } from '@shared/schema';

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

  // Get PO number from first record
  const firstRecord = records[0] as Record<string, string>;
  const poNumber = firstRecord['PO No.'];
  if (!poNumber) {
    throw new Error('PO Number not found in CSV');
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
        sku: record['SKU'] || '',
        brand: record['Brand'] || '',
        sku_id: record['SKU Id'] || '',
        sap_id: record['SAP Id'] || '',
        hsn_code: record['HSN Code'] || '',
        ean_no: record['EAN No.'] || '',
        po_qty: parseInt(record['PO Qty']) || 0,
        asn_qty: parseInt(record['ASN Qty']) || 0,
        grn_qty: parseInt(record['GRN Qty']) || 0,
        remaining_qty: parseInt(record['Remaining Qty']) || 0,
        cost_price: parseDecimal(record['Cost Price']),
        cgst: parseDecimal(record['CGST']),
        sgst: parseDecimal(record['SGST']),
        igst: parseDecimal(record['IGST']),
        cess: parseDecimal(record['CESS']),
        mrp: parseDecimal(record['MRP']),
        total_value: parseDecimal(record['Total Value']),
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
  header: InsertBlinkitPoHeader;
  lines: InsertBlinkitPoLines[];
} {
  const workbook = XLSX.read(fileContent, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (jsonData.length < 2) {
    throw new Error('Excel file appears to be empty or invalid');
  }

  const headers = jsonData[0] as string[];
  
  // Validate expected headers
  const expectedHeaders = ['#', 'Item Code', 'HSN Code', 'Product UPC', 'Product Description'];
  const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
  }

  // Extract data rows (skip header and summary rows)
  const dataRows = jsonData.slice(1).filter((row: any[]) => {
    return row[0] && typeof row[0] === 'number' && row[1]; // Must have line number and item code
  });

  if (dataRows.length === 0) {
    throw new Error('No valid data rows found in Excel file');
  }

  // Find summary data from the last few rows
  const summaryRows = jsonData.slice(-3); // Last 3 rows usually contain totals
  let totalQuantity = 0;
  let totalItems = 0;
  let netAmount = 0;
  let cartDiscount = 0;

  summaryRows.forEach((row: any[]) => {
    if (row.includes('Total Quantity')) {
      const qtyIndex = row.indexOf('Total Quantity') + 1;
      totalQuantity = Number(row[qtyIndex]) || 0;
    }
    if (row.includes('Total Items')) {
      const itemsIndex = row.indexOf('Total Items') + 1;
      totalItems = Number(row[itemsIndex]) || 0;
    }
    if (row.includes('Net amount')) {
      const netIndex = row.indexOf('Net amount') + 1;
      netAmount = Number(row[netIndex]) || 0;
    }
    if (row.includes('Cart Discount')) {
      const discountIndex = row.indexOf('Cart Discount') + 1;
      cartDiscount = Number(row[discountIndex]) || 0;
    }
  });

  // Extract unique HSN codes
  const uniqueHsnCodes = [...new Set(dataRows.map((row: any[]) => String(row[2] || '')).filter(Boolean))];

  // Calculate totals from line items
  let calculatedTotalBasicCost = 0;
  let calculatedTotalTaxAmount = 0;
  let calculatedTotalLandingRate = 0;
  let calculatedTotalAmount = 0;

  const blinkitLines: InsertBlinkitPoLines[] = dataRows.map((row: any[], index: number) => {
    const basicCostPrice = Number(row[6]) || 0;
    const quantity = Number(row[14]) || 0;
    const totalAmount = Number(row[17]) || 0;

    calculatedTotalBasicCost += basicCostPrice * quantity;
    calculatedTotalTaxAmount += Number(row[12]) || 0;
    calculatedTotalLandingRate += (Number(row[13]) || 0) * quantity;
    calculatedTotalAmount += totalAmount;

    return {
      line_number: index + 1,
      item_code: String(row[1] || ''),
      hsn_code: String(row[2] || ''),
      product_upc: String(row[3] || ''),
      product_description: String(row[4] || ''),
      grammage: String(row[5] || ''),
      basic_cost_price: (Number(row[6]) || 0).toString(),
      cgst_percent: (Number(row[7]) || 0).toString(),
      sgst_percent: (Number(row[8]) || 0).toString(),
      igst_percent: (Number(row[9]) || 0).toString(),
      cess_percent: (Number(row[10]) || 0).toString(),
      additional_cess: (Number(row[11]) || 0).toString(),
      tax_amount: (Number(row[12]) || 0).toString(),
      landing_rate: (Number(row[13]) || 0).toString(),
      quantity: quantity,
      mrp: (Number(row[15]) || 0).toString(),
      margin_percent: (Number(row[16]) || 0).toString(),
      total_amount: totalAmount.toString(),
      status: "Active",
      created_by: uploadedBy
    };
  });

  // Generate PO number from timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
  const poNumber = `BK_${timestamp}`;

  const blinkitHeader: InsertBlinkitPoHeader = {
    po_number: poNumber,
    status: "Open",
    total_quantity: totalQuantity || blinkitLines.reduce((sum, line) => sum + line.quantity, 0),
    total_items: totalItems || blinkitLines.length,
    total_basic_cost: calculatedTotalBasicCost.toString(),
    total_tax_amount: calculatedTotalTaxAmount.toString(),
    total_landing_rate: calculatedTotalLandingRate.toString(),
    cart_discount: cartDiscount.toString(),
    net_amount: (netAmount || calculatedTotalAmount).toString(),
    unique_hsn_codes: uniqueHsnCodes,
    created_by: uploadedBy,
    uploaded_by: uploadedBy
  };

  return {
    header: blinkitHeader,
    lines: blinkitLines
  };
}