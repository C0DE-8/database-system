require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { config } = require("./config");

async function ensureMetadataSchema() {
  const connection = await mysql.createConnection({
    host: config.metadataDb.host,
    port: config.metadataDb.port,
    user: config.metadataDb.user,
    password: config.metadataDb.password,
    multipleStatements: true
  });

  try {
    const migrationPath = path.join(__dirname, "..", "..", "migrations", "001_create_dbms_gateway.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");
    await connection.query(sql);
    await ensureEncryptedCredentialsColumn(connection);
    await ensureEncryptedApiKeyColumn(connection);
  } finally {
    await connection.end();
  }
}

async function ensureEncryptedCredentialsColumn(connection) {
  const [columns] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'encrypted_credentials'`,
    [config.metadataDb.database]
  );

  if (!columns.length) {
    await connection.query(
      `ALTER TABLE ${mysql.escapeId(config.metadataDb.database)}.projects
       ADD COLUMN encrypted_credentials TEXT NULL AFTER encrypted_db_password`
    );
  }
}

async function ensureEncryptedApiKeyColumn(connection) {
  const [columns] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'project_api_keys' AND COLUMN_NAME = 'encrypted_api_key'`,
    [config.metadataDb.database]
  );

  if (!columns.length) {
    await connection.query(
      `ALTER TABLE ${mysql.escapeId(config.metadataDb.database)}.project_api_keys
       ADD COLUMN encrypted_api_key TEXT NULL AFTER key_hash`
    );
  }
}

if (require.main === module) {
  ensureMetadataSchema()
    .then(() => {
      console.log(`Metadata schema is ready: ${config.metadataDb.database}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { ensureMetadataSchema };
