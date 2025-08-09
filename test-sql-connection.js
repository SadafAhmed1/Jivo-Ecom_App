import sql from "mssql";

const sqlConfig = {
  server: "103.89.44.240",
  port: 1433,
  user: "webm2",
  password: "foxpro@7",
  database: "jsap",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: { 
    max: 5, 
    min: 0, 
    idleTimeoutMillis: 30000 
  },
};

async function testConnection() {
  console.log("Testing SQL Server connection...");
  console.log("Server:", sqlConfig.server);
  console.log("Port:", sqlConfig.port);
  console.log("Database:", sqlConfig.database);
  console.log("User:", sqlConfig.user);
  
  try {
    console.log("\nAttempting to connect...");
    const pool = await sql.connect(sqlConfig);
    console.log("✓ Successfully connected to SQL Server!");
    
    console.log("\nTesting stored procedure...");
    const result = await pool.request().execute("dbo.SP_GET_ITEM_DETAILS");
    console.log(`✓ Stored procedure executed successfully! Retrieved ${result.recordset.length} items`);
    
    if (result.recordset.length > 0) {
      console.log("\nSample item:", JSON.stringify(result.recordset[0], null, 2));
    }
    
    await pool.close();
    console.log("\n✓ Connection closed successfully");
  } catch (error) {
    console.error("\n✗ Connection failed!");
    console.error("Error type:", error.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    if (error.originalError) {
      console.error("\nOriginal error details:");
      console.error("  Code:", error.originalError.code);
      console.error("  Message:", error.originalError.message);
    }
    
    // Common connection issues
    if (error.code === 'ESOCKET') {
      console.error("\n💡 Network connectivity issue. Possible causes:");
      console.error("  - SQL Server is not accessible from this network");
      console.error("  - Firewall is blocking port 1433");
      console.error("  - VPN connection is required but not active");
    } else if (error.code === 'ELOGIN') {
      console.error("\n💡 Authentication failed. Check username and password.");
    } else if (error.code === 'ETIMEOUT') {
      console.error("\n💡 Connection timeout. Server may be unreachable or slow to respond.");
    }
  }
}

testConnection();