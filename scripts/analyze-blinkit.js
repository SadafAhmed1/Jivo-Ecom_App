import XLSX from 'xlsx';
import fs from 'fs';

// Read the Blinkit Excel file
const workbook = XLSX.readFile('attached_assets/3226110030173_20250806_061135_1754481114525.xlsx');

console.log('Sheet names:', workbook.SheetNames);

// Process each sheet
workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON to see the data structure
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Number of rows:', jsonData.length);
    if (jsonData.length > 0) {
        console.log('Headers (first row):', jsonData[0]);
        if (jsonData.length > 1) {
            console.log('Sample data (second row):', jsonData[1]);
        }
        if (jsonData.length > 2) {
            console.log('Sample data (third row):', jsonData[2]);
        }
    }
    
    // Show first 10 rows for analysis
    console.log('\nFirst 10 rows:');
    jsonData.slice(0, 10).forEach((row, index) => {
        console.log(`Row ${index}:`, row);
    });
});