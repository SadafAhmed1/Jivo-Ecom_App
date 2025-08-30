#!/usr/bin/env node

// Script to create multiple users from a CSV file
// Usage: node create-users-batch.js users.csv
// CSV format: username,email,full_name,phone,password,department,role

import fs from 'fs';
import fetch from 'node-fetch';

async function createUsersBatch(csvFile) {
  if (!fs.existsSync(csvFile)) {
    console.error(`❌ File not found: ${csvFile}`);
    process.exit(1);
  }

  console.log('📝 Batch User Creation Tool');
  console.log('============================\n');

  try {
    const csvContent = fs.readFileSync(csvFile, 'utf-8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log(`📄 Processing ${lines.length - 1} users from ${csvFile}`);
    console.log(`📋 Headers: ${headers.join(', ')}\n`);

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const userData = {};
      
      headers.forEach((header, index) => {
        userData[header] = values[index] || null;
      });

      // Set defaults
      userData.department = userData.department || 'E-Com';
      userData.role = userData.role || 'user';
      userData.is_active = true;

      console.log(`🔄 Creating user: ${userData.username}...`);

      try {
        const response = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });

        if (response.ok) {
          const user = await response.json();
          console.log(`✅ ${userData.username} created successfully (ID: ${user.id})`);
        } else {
          const error = await response.json();
          console.error(`❌ ${userData.username} failed: ${error.error}`);
        }
      } catch (error) {
        console.error(`❌ ${userData.username} error: ${error.message}`);
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✅ Batch user creation completed!');
  } catch (error) {
    console.error('❌ Error processing CSV:', error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await fetch('http://localhost:3000/api/health');
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const csvFile = process.argv[2];
  
  if (!csvFile) {
    console.error('Usage: node create-users-batch.js <csv-file>');
    console.log('\nCSV format: username,email,full_name,phone,password,department,role');
    console.log('Example:');
    console.log('username,email,full_name,phone,password,department,role');
    console.log('john.doe,john@company.com,John Doe,1234567890,password123,E-Com,user');
    console.log('jane.admin,jane@company.com,Jane Admin,9876543210,admin123,IT Six,admin');
    process.exit(1);
  }

  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('❌ Server is not running on http://localhost:3000');
    console.log('Please start the server first: npm run dev');
    process.exit(1);
  }

  await createUsersBatch(csvFile);
}

main();