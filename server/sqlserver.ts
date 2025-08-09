import sql from "mssql";
import net from "net";

const sqlConfig: sql.config = {
  server: process.env.SQLSERVER_HOST ?? "103.89.44.240",
  port: parseInt(process.env.SQLSERVER_PORT ?? "1433", 10),
  user: process.env.SQLSERVER_USER ?? "webm2",
  password: process.env.SQLSERVER_PASSWORD ?? "foxpro@7",
  database: process.env.SQLSERVER_DATABASE ?? "jsap",
  options: {
    encrypt: (process.env.SQLSERVER_ENCRYPT ?? "false") === "true",
    trustServerCertificate: (process.env.SQLSERVER_TRUST_SERVER_CERT ?? "true") === "true",
    connectTimeout: 10000, // 10 second timeout
    requestTimeout: 30000,
  },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;
let isServerReachable = false;

// Test server connectivity before attempting SQL connection
async function testServerConnectivity(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 5000;
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(sqlConfig.port!, sqlConfig.server);
  });
}

async function getPool() {
  // Test connectivity first
  isServerReachable = await testServerConnectivity();
  
  if (!isServerReachable) {
    throw new Error(`Failed to connect to SQL Server at ${sqlConfig.server}:${sqlConfig.port}. Server is not reachable. Please check VPN connection or network access.`);
  }
  
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(sqlConfig).connect();
  }
  return poolPromise;
}

// Mock data for development/testing when SQL Server is unavailable
function getMockSapItems(): any[] {
  console.log("Using mock SAP items data for development");
  return [
    {
      ItemCode: "TEST001",
      ItemName: "Test Product 1",
      Type: "Finished Good",
      ItemGroup: "Electronics",
      Variety: "Standard",
      SubGroup: "Mobile Accessories",
      Brand: "TestBrand",
      UOM: "PCS",
      TaxRate: 18,
      UnitSize: "1",
      IsLitre: false,
      CasePack: "12"
    },
    {
      ItemCode: "TEST002",
      ItemName: "Test Product 2",
      Type: "Raw Material",
      ItemGroup: "Food & Beverage",
      Variety: "Premium",
      SubGroup: "Beverages",
      Brand: "TestBrand2",
      UOM: "LTR",
      TaxRate: 12,
      UnitSize: "2",
      IsLitre: true,
      CasePack: "6"
    },
    {
      ItemCode: "TEST003",
      ItemName: "Test Product 3",
      Type: "Finished Good",
      ItemGroup: "Grocery",
      Variety: "Standard",
      SubGroup: "Staples",
      Brand: "TestBrand3",
      UOM: "KG",
      TaxRate: 5,
      UnitSize: "5",
      IsLitre: false,
      CasePack: "4"
    }
  ];
}

export async function callSpGetItemDetails(): Promise<any[]> {
  try {
    // Check if we're in development mode and SQL Server is not reachable
    const isDevelopment = process.env.NODE_ENV === "development";
    
    // First, test if server is reachable
    const canConnect = await testServerConnectivity();
    
    if (!canConnect) {
      console.warn(`SQL Server at ${sqlConfig.server}:${sqlConfig.port} is not reachable`);
      
      if (isDevelopment || process.env.USE_MOCK_DATA === "true") {
        // Return mock data in development or when explicitly configured
        return getMockSapItems();
      } else {
        // In production, throw an error with clear message
        throw new Error(`Failed to connect to SQL Server at ${sqlConfig.server}:${sqlConfig.port}. Server is not reachable. Please check VPN connection or network access.`);
      }
    }
    
    // If server is reachable, try to connect and execute stored procedure
    const pool = await getPool();
    const result = await pool.request().execute("dbo.SP_GET_ITEM_DETAILS");
    return result.recordset ?? [];
  } catch (error) {
    console.error("Error calling SP_GET_ITEM_DETAILS:", error);
    
    // If it's a connection error in development, return mock data
    if (process.env.NODE_ENV === "development" || process.env.USE_MOCK_DATA === "true") {
      if (error instanceof Error && 
          (error.message.includes('Failed to connect') || 
           error.message.includes('ETIMEOUT') ||
           error.message.includes('ENOTFOUND'))) {
        console.log("Falling back to mock data due to connection error");
        return getMockSapItems();
      }
    }
    
    throw error;
  }
}

// Close the connection pool when the process exits
process.on('SIGINT', async () => {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
  }
  process.exit(0);
});