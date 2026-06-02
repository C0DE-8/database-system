const mysql = require("mysql2/promise");
const { config } = require("./config");

const metadataPool = mysql.createPool({
  host: config.metadataDb.host,
  port: config.metadataDb.port,
  database: config.metadataDb.database,
  user: config.metadataDb.user,
  password: config.metadataDb.password,
  waitForConnections: true,
  connectionLimit: config.metadataDb.connectionLimit,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  namedPlaceholders: true
});

async function query(sql, params = []) {
  const [rows] = await metadataPool.execute(sql, params);
  return rows;
}

async function testDbConnection() {
  await metadataPool.query("SELECT 1");
  return true;
}

async function closeDbConnection() {
  await metadataPool.end();
}

module.exports = {
  metadataPool,
  query,
  testDbConnection,
  closeDbConnection
};
