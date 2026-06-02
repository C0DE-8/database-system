const crypto = require("crypto");

const requiredSecret = (name, fallback) => {
  const value = process.env[name] || fallback;
  if (value === fallback && process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be configured in production`);
  }
  return value;
};

const encryptionSecret = requiredSecret("ENCRYPTION_KEY", "dev-only-encryption-key-change-this");

const config = {
  port: Number(process.env.PORT || 4001),
  jwtSecret: requiredSecret("JWT_SECRET", "dev-only-jwt-secret-change-this"),
  encryptionKey: crypto.createHash("sha256").update(encryptionSecret).digest(),
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  adminPassword: process.env.ADMIN_PASSWORD || "change-me-now",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  metadataDb: {
    host: process.env.DBMS_DB_HOST || "localhost",
    port: Number(process.env.DBMS_DB_PORT || 3306),
    database: process.env.DBMS_DB_NAME || "dbms_gateway",
    user: process.env.DBMS_DB_USER || "root",
    password: process.env.DBMS_DB_PASSWORD || "",
    connectionLimit: Number(process.env.DBMS_DB_CONNECTION_LIMIT || 10)
  }
};

module.exports = { config };
