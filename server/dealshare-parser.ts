import xlsx from 'xlsx';

interface DealsharePoHeader {
  po_number: string;
  po_created_date?: Date | null;
  po_delivery_date?: Date | null;
  po_expiry_date?: Date | null;
  shipped_by?: string;
  shipped_by_address?: string;
  shipped_by_gstin?: string;
  shipped_by_phone?: string;
  vendor_code?: string;
  shipped_to?: string;
  shipped_to_address?: string;
  shipped_to_gstin?: string;
  bill_to?: string;
  bill_to_address?: string;
  bill_to_gstin?: string;
  comments?: string;
  total_items?: number;
  total_quantity?: string;
  total_gross_amount?: string;
  uploaded_by?: string;
}

interface DealsharePoItem {
  line_number: number;
  sku?: string;
  product_name?: string;
  hsn_code?: string;
  quantity?: number;
  mrp_tax_inclusive?: string;
  buying_price?: string;
  gst_percent?: string;
  cess_percent?: string;
  gross_amount?: string;
}

export async function parseDealsharePO(buffer: Buffer, uploadedBy: string) {
  try {
    console.log("Processing Dealshare Excel file...");
    
    const workbook = xlsx.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });

    console.log(`Dealshare Excel has ${jsonData.length} rows`);

    // Parse header information from structured rows
    let header: DealsharePoHeader = {
      po_number: '',
      uploaded_by: uploadedBy
    };

    // Extract PO Number from row 3 (index 2)
    const poNumberRow = jsonData[2] as any[];
    if (poNumberRow && poNumberRow[0]) {
      header.po_number = String(poNumberRow[0]);
    }

    // Extract PO dates from rows 5, 7, 9 (indices 4, 6, 8)
    const dateRows = [
      { row: jsonData[4], field: 'po_created_date' },
      { row: jsonData[6], field: 'po_delivery_date' },
      { row: jsonData[8], field: 'po_expiry_date' }
    ];

    for (const { row, field } of dateRows) {
      if (row && row[0]) {
        const excelDate = parseFloat(String(row[0]));
        if (!isNaN(excelDate)) {
          (header as any)[field] = excelDateToJSDate(excelDate);
        }
      }
    }

    // Extract Shipped By info from rows 3-10
    if (poNumberRow && poNumberRow[1]) {
      header.shipped_by = String(poNumberRow[1]);
    }
    
    // Combine address from multiple rows
    const addressParts = [];
    const addressRows = [jsonData[3], jsonData[4], jsonData[5], jsonData[6]];
    for (const row of addressRows) {
      if (row && row[1]) {
        addressParts.push(String(row[1]).trim());
      }
    }
    header.shipped_by_address = addressParts.filter(part => part).join(', ');

    // Extract GSTIN and phone from specific rows
    const gstinRow = jsonData[8] as any[];
    if (gstinRow && gstinRow[1]) {
      const gstinMatch = String(gstinRow[1]).match(/GSTIN:\s*([^\s]+)/);
      if (gstinMatch) {
        header.shipped_by_gstin = gstinMatch[1];
      }
    }

    const phoneRow = jsonData[7] as any[];
    if (phoneRow && phoneRow[1]) {
      const phoneMatch = String(phoneRow[1]).match(/Contact No\.:\s*([^\s]+)/);
      if (phoneMatch) {
        header.shipped_by_phone = phoneMatch[1];
      }
    }

    // Extract Vendor Code from row 10
    const vendorRow = jsonData[9] as any[];
    if (vendorRow && vendorRow[1]) {
      const vendorMatch = String(vendorRow[1]).match(/Vendor Code:\s*([^\s]+)/);
      if (vendorMatch) {
        header.vendor_code = vendorMatch[1];
      }
    }

    // Extract Shipped To info from row 3 and following
    const shippedToRow = jsonData[2] as any[];
    if (shippedToRow && shippedToRow[3]) {
      header.shipped_to = String(shippedToRow[3]);
    }

    // Combine Shipped To address
    const shippedToAddressParts = [];
    for (const row of addressRows) {
      if (row && row[3]) {
        shippedToAddressParts.push(String(row[3]).trim());
      }
    }
    header.shipped_to_address = shippedToAddressParts.filter(part => part).join(', ');

    // Extract Shipped To GSTIN
    const shippedToGstinRow = jsonData[5] as any[];
    if (shippedToGstinRow && shippedToGstinRow[3]) {
      const gstinMatch = String(shippedToGstinRow[3]).match(/GSTIN:\s*([^\s]+)/);
      if (gstinMatch) {
        header.shipped_to_gstin = gstinMatch[1];
      }
    }

    // Extract Bill To info from row 3 and following
    const billToRow = jsonData[2] as any[];
    if (billToRow && billToRow[7]) {
      header.bill_to = String(billToRow[7]);
    }

    // Combine Bill To address
    const billToAddressParts = [];
    for (const row of addressRows) {
      if (row && row[7]) {
        billToAddressParts.push(String(row[7]).trim());
      }
    }
    header.bill_to_address = billToAddressParts.filter(part => part).join(', ');

    // Extract Bill To GSTIN
    const billToGstinRow = jsonData[6] as any[];
    if (billToGstinRow && billToGstinRow[7]) {
      const gstinMatch = String(billToGstinRow[7]).match(/GSTIN:\s*([^\s]+)/);
      if (gstinMatch) {
        header.bill_to_gstin = gstinMatch[1];
      }
    }

    // Extract Comments from row 11
    const commentsRow = jsonData[10] as any[];
    if (commentsRow && commentsRow[0]) {
      const commentMatch = String(commentsRow[0]).match(/Comments:\s*(.+)/);
      if (commentMatch) {
        header.comments = commentMatch[1];
      }
    }

    // Parse line items starting from row 13 (index 12)
    // Row 12 contains headers: SKU, Product Name, GST%, CESS%, HSN Code (Units), Quantity, MRP (Tax Inclusive), '', Buying Price, Gross Amount
    const lines: DealsharePoItem[] = [];
    let totalQuantity = 0;
    let totalGrossAmount = 0;

    for (let i = 12; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      if (!row || row.length < 6) continue;

      const sku = row[0];
      const productName = row[1];
      const gstPercent = row[2];
      const cessPercent = row[3];
      const hsnCode = row[4];
      const quantity = row[5];
      const mrpTaxInclusive = row[6];
      const buyingPrice = row[8]; // Skip empty column at index 7
      const grossAmount = row[9];

      if (!sku || !quantity) continue;

      const line: DealsharePoItem = {
        line_number: i - 11, // Adjust for header rows
        sku: String(sku),
        product_name: String(productName || ''),
        hsn_code: String(hsnCode || ''),
        quantity: parseInt(String(quantity || '0')),
        mrp_tax_inclusive: parseFloat(String(mrpTaxInclusive || '0')).toFixed(2),
        buying_price: parseFloat(String(buyingPrice || '0')).toFixed(2),
        gst_percent: parseFloat(String(gstPercent || '0')).toFixed(2),
        cess_percent: parseFloat(String(cessPercent || '0')).toFixed(2),
        gross_amount: parseFloat(String(grossAmount || '0')).toFixed(2)
      };

      lines.push(line);

      // Calculate totals
      totalQuantity += line.quantity || 0;
      totalGrossAmount += parseFloat(line.gross_amount || '0');

      console.log(`Parsed Dealshare line item ${line.line_number}:`, {
        sku: line.sku,
        product_name: line.product_name?.substring(0, 50) + '...',
        quantity: line.quantity,
        gross_amount: line.gross_amount
      });
    }

    // Update header totals
    header.total_items = lines.length;
    header.total_quantity = totalQuantity.toString();
    header.total_gross_amount = totalGrossAmount.toFixed(2);

    console.log("Dealshare PO parsed successfully:", {
      po_number: header.po_number,
      total_items: header.total_items,
      total_quantity: header.total_quantity,
      total_gross_amount: header.total_gross_amount
    });

    return {
      header,
      lines,
      totalItems: lines.length,
      totalQuantity,
      totalAmount: totalGrossAmount.toFixed(2),
      detectedVendor: 'dealshare'
    };

  } catch (error) {
    console.error("Error parsing Dealshare PO:", error);
    throw new Error(`Failed to parse Dealshare file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function excelDateToJSDate(excelDate: number): Date {
  // Excel date is days since 1900-01-01, but Excel incorrectly treats 1900 as a leap year
  const epochDiff = 25569; // Days between 1900-01-01 and 1970-01-01
  const millisecondsPerDay = 86400000;
  return new Date((excelDate - epochDiff) * millisecondsPerDay);
}