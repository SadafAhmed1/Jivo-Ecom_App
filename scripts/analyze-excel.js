import XLSX from 'xlsx';
import fs from 'fs';

// Read the Excel file
const filePath = 'attached_assets/Sales_ASIN_Manufacturing_Retail_India_Custom_1-8-2025_8-8-2025_1754829343165.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON to see the structure
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('Sheet Names:', workbook.SheetNames);
  console.log('First 10 rows:');
  console.log(JSON.stringify(jsonData.slice(0, 10), null, 2));
  
  // Get headers
  const headers = jsonData[0];
  console.log('\nHeaders:');
  console.log(headers);
  
  // Sample data row
  console.log('\nSample data row:');
  console.log(jsonData[1]);
  
} catch (error) {
  console.error('Error reading Excel file:', error.message);
}