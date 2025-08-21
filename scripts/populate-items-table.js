/**
 * Migration script to populate the items table from HANA stored procedure
 * This script will call SP_GET_ITEM_DETAILS and insert all data into PostgreSQL items table
 */

import { sqlServerService } from '../server/sql-service.js';
import { storage } from '../server/storage.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function populateItemsTable() {
  console.log('🚀 Starting items table population from HANA stored procedure...');
  
  try {
    // Step 1: Call the stored procedure to get all items from HANA
    console.log('📞 Calling SP_GET_ITEM_DETAILS stored procedure...');
    const result = await sqlServerService.getItemDetails();
    
    if (!result.success || !result.data) {
      console.error('❌ Failed to get items from HANA:', result.error);
      process.exit(1);
    }
    
    console.log(`✅ Successfully retrieved ${result.data.length} items from HANA`);
    console.log(`⏱️ Query execution time: ${result.executionTime}ms`);
    
    // Step 2: Sync all items to PostgreSQL items table
    console.log('💾 Syncing items to PostgreSQL items table...');
    const syncedCount = await storage.syncItemsFromHana(result.data);
    
    console.log(`🎉 Successfully synced ${syncedCount} items to PostgreSQL`);
    console.log(`📊 Total items processed: ${result.data.length}`);
    console.log(`✨ Items table is now populated and ready to use!`);
    
    // Step 3: Show some sample data
    console.log('\n📋 Sample items from the table:');
    const sampleItems = await storage.getAllItems();
    const samples = sampleItems.slice(0, 5);
    
    samples.forEach((item, index) => {
      console.log(`${index + 1}. ${item.itemcode} - ${item.itemname}`);
      if (item.brand) console.log(`   Brand: ${item.brand}`);
      if (item.itemgroup) console.log(`   Group: ${item.itemgroup}`);
    });
    
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`🔍 You can now use the items table for fast local queries`);
    
  } catch (error) {
    console.error('❌ Error during items table population:', error);
    process.exit(1);
  }
}

// Add endpoint to trigger this migration
async function createMigrationEndpoint() {
  console.log('🛠️ Creating migration endpoint...');
  
  // This can be called via POST /api/migrate-items
  return {
    path: '/api/migrate-items',
    method: 'POST',
    handler: async (req, res) => {
      try {
        console.log('🔄 Starting items migration...');
        await populateItemsTable();
        res.json({ 
          success: true, 
          message: 'Items table populated successfully' 
        });
      } catch (error) {
        console.error('Migration failed:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to populate items table',
          details: error.message 
        });
      }
    }
  };
}

// Run directly if called as script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateItemsTable()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { populateItemsTable, createMigrationEndpoint };