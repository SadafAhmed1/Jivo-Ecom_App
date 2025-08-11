import XLSX from 'xlsx';
import fs from 'fs';

// Read the Flipkart file
const filePath = './attached_assets/flipkart SC_1754917958254.xlsx';
console.log('Reading Flipkart file:', filePath);

try {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  console.log('Sheet names:', workbook.SheetNames);
  
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Get headers
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log('Number of rows:', jsonData.length);
  console.log('Headers (first row):', JSON.stringify(jsonData[0], null, 2));
  
  if (jsonData.length > 1) {
    console.log('\nFirst data row:', JSON.stringify(jsonData[1], null, 2));
  }
  
  if (jsonData.length > 2) {
    console.log('\nSecond data row:', JSON.stringify(jsonData[2], null, 2));
  }
  
  // Check for date columns
  const headers = jsonData[0];
  const dateColumns = [];
  const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/;
  
  headers.forEach((header, index) => {
    if (header && (dateRegex.test(header.toString()) || header.toString().includes('/'))) {
      dateColumns.push({
        index,
        header: header.toString()
      });
    }
  });
  
  console.log(`\nFound ${dateColumns.length} date columns:`);
  dateColumns.slice(0, 10).forEach(col => {
    console.log(`  Index ${col.index}: ${col.header}`);
  });
  
} catch (error) {
  console.error('Error reading file:', error.message);
}