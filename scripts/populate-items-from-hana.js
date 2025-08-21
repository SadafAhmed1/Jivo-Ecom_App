/**
 * Script to populate items table from HANA SP_GET_ITEM_DETAILS
 * Run this script to sync all items from HANA to PostgreSQL
 */

import sql from 'mssql';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// SQL Server configuration for HANA connection
const sqlConfig = {
  server: process.env.SQLSERVER_HOST || '103.89.44.240',
  port: parseInt(process.env.SQLSERVER_PORT || '1433'),
  user: process.env.SQLSERVER_USER || 'webm2',
  password: process.env.SQLSERVER_PASSWORD || 'foxpro@7',
  database: process.env.SQLSERVER_DATABASE || 'jsap',
  options: {
    encrypt: process.env.SQLSERVER_ENCRYPT === 'true',
    trustServerCertificate: process.env.SQLSERVER_TRUST_SERVER_CERT === 'true'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// PostgreSQL configuration
const pgConfig = {
  host: process.env.PGHOST || '103.89.44.240',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'root',
  database: process.env.PGDATABASE || 'ecom',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
};

async function populateItemsTable() {
  let sqlPool = null;
  let pgClient = null;
  
  try {
    console.log('🚀 Starting items table population...\n');
    
    // Step 1: Connect to SQL Server
    console.log('📡 Connecting to SQL Server...');
    sqlPool = await sql.connect(sqlConfig);
    console.log('✅ Connected to SQL Server\n');
    
    // Step 2: Execute stored procedure
    console.log('📞 Calling SP_GET_ITEM_DETAILS stored procedure...');
    const startTime = Date.now();
    
    const result = await sqlPool.request()
      .execute('SP_GET_ITEM_DETAILS');
    
    const executionTime = Date.now() - startTime;
    const items = result.recordset || [];
    
    console.log(`✅ Retrieved ${items.length} items from HANA`);
    console.log(`⏱️  Execution time: ${executionTime}ms\n`);
    
    if (items.length === 0) {
      console.log('⚠️  No items returned from stored procedure');
      return;
    }
    
    // Step 3: Connect to PostgreSQL
    console.log('🐘 Connecting to PostgreSQL...');
    pgClient = new pg.Client(pgConfig);
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL\n');
    
    // Step 4: Clear existing items (optional)
    console.log('🧹 Clearing existing items...');
    await pgClient.query('TRUNCATE TABLE items RESTART IDENTITY CASCADE');
    console.log('✅ Items table cleared\n');
    
    // Step 5: Insert items in batches
    console.log('💾 Inserting items into PostgreSQL...');
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Build insert query with UPSERT
      const values = [];
      const placeholders = [];
      let paramIndex = 1;
      
      for (const item of batch) {
        const row = [];
        row.push(`$${paramIndex++}`); // itemcode
        row.push(`$${paramIndex++}`); // itemname
        row.push(`$${paramIndex++}`); // itmsgrpnam
        row.push(`$${paramIndex++}`); // u_type
        row.push(`$${paramIndex++}`); // u_variety
        row.push(`$${paramIndex++}`); // u_sub_group
        row.push(`$${paramIndex++}`); // u_brand
        row.push(`$${paramIndex++}`); // invntryuom
        row.push(`$${paramIndex++}`); // salpackun
        row.push(`$${paramIndex++}`); // u_islitre
        row.push(`$${paramIndex++}`); // u_tax_rate
        
        placeholders.push(`(${row.join(', ')})`);
        
        // Add values in order matching the existing table columns
        values.push(item.ItemCode || item.itemcode || '');
        values.push(item.ItemName || item.itemname || '');
        values.push(item.ItmsGrpNam || item.ItemGroup || null);
        values.push(item.U_TYPE || null);
        values.push(item.U_Variety || null);
        values.push(item.U_Sub_Group || item.SubGroup || null);
        values.push(item.U_Brand || item.Brand || null);
        values.push(item.InvntryUom || item.UOM || null);
        values.push(item.SalPackUn || null);
        values.push(item.U_IsLitre || 'N');
        values.push(item.U_Tax_Rate || null);
      }
      
      const insertQuery = `
        INSERT INTO items (
          itemcode, itemname, itmsgrpnam, u_type, u_variety, 
          u_sub_group, u_brand, invntryuom, salpackun, u_islitre, u_tax_rate
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (itemcode) 
        DO UPDATE SET
          itemname = EXCLUDED.itemname,
          itmsgrpnam = EXCLUDED.itmsgrpnam,
          u_type = EXCLUDED.u_type,
          u_variety = EXCLUDED.u_variety,
          u_sub_group = EXCLUDED.u_sub_group,
          u_brand = EXCLUDED.u_brand,
          invntryuom = EXCLUDED.invntryuom,
          salpackun = EXCLUDED.salpackun,
          u_islitre = EXCLUDED.u_islitre,
          u_tax_rate = EXCLUDED.u_tax_rate
      `;
      
      await pgClient.query(insertQuery, values);
      insertedCount += batch.length;
      
      // Progress indicator
      const progress = Math.round((insertedCount / items.length) * 100);
      process.stdout.write(`\r  Progress: ${progress}% (${insertedCount}/${items.length} items)`);
    }
    
    console.log('\n✅ All items inserted successfully\n');
    
    // Step 6: Verify the data
    console.log('🔍 Verifying data...');
    const countResult = await pgClient.query('SELECT COUNT(*) as count FROM items');
    const sampleResult = await pgClient.query('SELECT itemcode, itemname, u_brand, itmsgrpnam FROM items LIMIT 5');
    
    console.log(`📊 Total items in table: ${countResult.rows[0].count}`);
    console.log('\n📋 Sample items:');
    sampleResult.rows.forEach((item, index) => {
      console.log(`  ${index + 1}. [${item.itemcode}] ${item.itemname}`);
      if (item.u_brand) console.log(`     Brand: ${item.u_brand}`);
      if (item.itmsgrpnam) console.log(`     Group: ${item.itmsgrpnam}`);
    });
    
    console.log('\n🎉 Items table population completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    // Clean up connections
    if (sqlPool) {
      await sqlPool.close();
      console.log('\n🔌 SQL Server connection closed');
    }
    if (pgClient) {
      await pgClient.end();
      console.log('🔌 PostgreSQL connection closed');
    }
  }
}

// Run the script
console.log('========================================');
console.log('  ITEMS TABLE POPULATION FROM HANA');
console.log('========================================\n');

populateItemsTable()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });