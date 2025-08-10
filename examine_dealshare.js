import XLSX from 'xlsx';
import fs from 'fs';

// Read the Dealshare Excel file
const filePath = 'attached_assets/Jivo Dasna_1754824163387.xlsx';
const workbook = XLSX.readFile(filePath);

console.log('Sheet Names:', workbook.SheetNames);

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON to see structure
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('\n=== FIRST 15 ROWS OF DATA ===');
for (let i = 0; i < Math.min(15, jsonData.length); i++) {
  console.log(`Row ${i + 1}:`, jsonData[i]);
}

console.log('\n=== FULL SHEET RANGE ===');
console.log('Sheet range:', worksheet['!ref']);

// Look for potential header patterns
console.log('\n=== LOOKING FOR HEADER PATTERNS ===');
for (let i = 0; i < Math.min(10, jsonData.length); i++) {
  const row = jsonData[i];
  if (row && row.length > 0) {
    const hasProductInfo = row.some(cell => 
      typeof cell === 'string' && 
      (cell.toLowerCase().includes('product') || 
       cell.toLowerCase().includes('item') || 
       cell.toLowerCase().includes('sku') ||
       cell.toLowerCase().includes('quantity') ||
       cell.toLowerCase().includes('price'))
    );
    if (hasProductInfo) {
      console.log(`Potential headers at row ${i + 1}:`, row);
    }
  }
}