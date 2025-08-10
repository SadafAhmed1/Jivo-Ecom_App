import xlsx from 'xlsx';
import fs from 'fs';

try {
  // Read the Zomato Excel file
  const workbook = xlsx.readFile('attached_assets/Zomoto Po_1754820109811.xlsx');
  const sheetNames = workbook.SheetNames;
  console.log('Available sheets:', sheetNames);

  // Read the first sheet
  const firstSheet = workbook.Sheets[sheetNames[0]];
  
  // Convert to JSON to see the structure
  const jsonData = xlsx.utils.sheet_to_json(firstSheet, { header: 1 });
  
  console.log('\n=== First 10 rows of Zomato PO ===');
  jsonData.slice(0, 10).forEach((row, index) => {
    console.log(`Row ${index + 1}:`, row);
  });

  // Also get column headers
  console.log('\n=== Column Headers ===');
  if (jsonData.length > 0) {
    console.log('Headers:', jsonData[0]);
  }

  // Sample a few data rows
  console.log('\n=== Sample Data Rows ===');
  jsonData.slice(1, 6).forEach((row, index) => {
    console.log(`Data Row ${index + 1}:`, row);
  });

} catch (error) {
  console.error('Error reading Zomato file:', error);
}