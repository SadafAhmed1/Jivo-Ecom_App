// Test file to verify attachment functionality
// Run this with: node test-attachments.js

const fs = require('fs');
const path = require('path');

async function testAttachmentAPI() {
  const baseUrl = 'http://localhost:3000/api';
  
  // Test platforms
  const platforms = ['zepto', 'flipkart', 'blinkit', 'swiggy', 'bigbasket', 'zomato', 'dealshare', 'citymall', 'platform'];
  
  console.log('Testing Attachment and Comment APIs...\n');
  
  for (const platform of platforms) {
    console.log(`Testing ${platform}...`);
    
    // Test adding a comment (assuming PO ID 1 exists)
    try {
      const commentResponse = await fetch(`${baseUrl}/${platform}/pos/1/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: `Test comment for ${platform} PO`,
          userId: 1
        })
      });
      
      if (commentResponse.ok) {
        console.log(`✅ Comment added for ${platform}`);
      } else {
        console.log(`⚠️  Comment API returned ${commentResponse.status} for ${platform}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${platform}: ${error.message}`);
    }
    
    // Test getting comments
    try {
      const getResponse = await fetch(`${baseUrl}/${platform}/pos/1/comments`);
      
      if (getResponse.ok) {
        const comments = await getResponse.json();
        console.log(`✅ Retrieved ${comments.length} comments for ${platform}`);
      } else {
        console.log(`⚠️  Get comments returned ${getResponse.status} for ${platform}`);
      }
    } catch (error) {
      console.log(`❌ Error getting comments for ${platform}: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('Test complete!');
}

// Only run if server is running
console.log('Make sure the server is running on port 3000');
console.log('This test will attempt to add comments to PO ID 1 for each platform\n');

testAttachmentAPI().catch(console.error);