#!/usr/bin/env node

// Script to create users via backend API
// Usage: node create-user.js

import fetch from 'node-fetch';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createUser() {
  console.log('📝 Backend User Creation Tool');
  console.log('=====================================\n');

  try {
    const username = await question('Username: ');
    const email = await question('Email: ');
    const fullName = await question('Full Name: ');
    const phone = await question('Phone (optional): ');
    const password = await question('Password: ');
    const department = await question('Department (E-Com/IT Six) [default: E-Com]: ') || 'E-Com';
    const role = await question('Role [default: user]: ') || 'user';

    console.log('\n🔄 Creating user...');

    const userData = {
      username,
      email: email || null,
      full_name: fullName,
      phone: phone || null,
      password,
      department,
      role,
      is_active: true
    };

    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      const user = await response.json();
      console.log('\n✅ User created successfully!');
      console.log(`👤 Username: ${user.username}`);
      console.log(`📧 Email: ${user.email || 'Not provided'}`);
      console.log(`👨‍💼 Role: ${user.role}`);
      console.log(`🏢 Department: ${user.department}`);
      console.log(`📱 Phone: ${user.phone || 'Not provided'}`);
    } else {
      const error = await response.json();
      console.error('\n❌ Failed to create user:', error.error);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
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
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('❌ Server is not running on http://localhost:3000');
    console.log('Please start the server first: npm run dev');
    process.exit(1);
  }

  await createUser();
}

main();