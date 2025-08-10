import XLSX from 'xlsx';
import fs from 'fs';

// Read the Zomato Excel file
const filePath = 'attached_assets/Zomoto Po_1754821079870.xlsx';
const workbook = XLSX.readFile(filePath);

console.log('Sheet Names:', workbook.SheetNames);

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON to see the structure
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('\n=== FIRST 20 ROWS OF DATA ===');
jsonData.slice(0, 20).forEach((row, index) => {
  console.log(`Row ${index + 1}:`, row);
});

console.log('\n=== LOOKING FOR HEADER ROW ===');
// Look for potential header row
jsonData.slice(0, 15).forEach((row, index) => {
  if (row.some(cell => typeof cell === 'string' && 
    (cell.toLowerCase().includes('product') || 
     cell.toLowerCase().includes('item') || 
     cell.toLowerCase().includes('quantity') ||
     cell.toLowerCase().includes('rate') ||
     cell.toLowerCase().includes('amount')))) {
    console.log(`Potential header at Row ${index + 1}:`, row);
  }
});

console.log('\n=== PO HEADER INFORMATION ===');
// Look for PO details
jsonData.slice(0, 15).forEach((row, index) => {
  if (row.some(cell => typeof cell === 'string' && 
    (cell.toLowerCase().includes('po') || 
     cell.toLowerCase().includes('order') || 
     cell.toLowerCase().includes('date') ||
     cell.toLowerCase().includes('vendor') ||
     cell.toLowerCase().includes('bill')))) {
    console.log(`PO Info at Row ${index + 1}:`, row);
  }
});

console.log('\n=== FULL SHEET RANGE ===');
console.log('Sheet range:', worksheet['!ref']);