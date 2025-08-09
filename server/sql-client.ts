import sql from "mssql";

const sqlConfig: sql.config = {
  server: process.env.SQLSERVER_HOST ?? "103.89.44.240",
  port: parseInt(process.env.SQLSERVER_PORT ?? "5000", 10),
  user: process.env.SQLSERVER_USER ?? "webm2",
  password: process.env.SQLSERVER_PASSWORD ?? "foxpro@7",
  database: process.env.SQLSERVER_DATABASE ?? "jsap",
  options: {
    encrypt: (process.env.SQLSERVER_ENCRYPT ?? "false") === "true",
    trustServerCertificate: (process.env.SQLSERVER_TRUST_SERVER_CERT ?? "true") === "true",
  },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;
async function getPool() {
  if (!poolPromise) poolPromise = new sql.ConnectionPool(sqlConfig).connect();
  return poolPromise;
}

export async function callSpGetItemDetails(): Promise<any[]> {
  const pool = await getPool();
  const result = await pool.request().execute("dbo.SP_GET_ITEM_DETAILS");
  return result.recordset ?? [];
}