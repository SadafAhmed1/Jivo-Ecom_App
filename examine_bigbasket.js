import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the BigBasket Excel file
const filePath = path.join(__dirname, 'attached_assets', '26146854_1754816325618.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  
  console.log('Sheet Names:', sheetNames);
  
  // Examine each sheet
  sheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Show first 30 rows to understand structure
    console.log('First 30 rows:');
    jsonData.slice(0, 30).forEach((row, index) => {
      console.log(`Row ${index + 1}:`, row);
    });
    
    // Show headers if available
    if (jsonData.length > 0) {
      console.log('\nPossible Headers (Row 1):', jsonData[0]);
    }
  });
  
} catch (error) {
  console.error('Error reading file:', error.message);
}