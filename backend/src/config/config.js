const crypto = require("crypto");

const requiredSecret = (name, fallback) => {
  const value = process.env[name] || fallback;
  if (value === fallback && process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be configured in production`);
  }
  return value;
};

const encryptionSecret = requiredSecret("ENCRYPTION_KEY", "dev-only-encryption-key-change-this");
const defaultCorsOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://database-system-five.vercel.app",
  "https://database-system-dbms.vercel.app"
];

const corsOrigins = (process.env.CORS_ORIGIN || defaultCorsOrigins.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const config = {
  port: Number(process.env.PORT || 4001),
  jwtSecret: requiredSecret("JWT_SECRET", "dev-only-jwt-secret-change-this"),
  encryptionKey: crypto.createHash("sha256").update(encryptionSecret).digest(),
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  adminPassword: process.env.ADMIN_PASSWORD || "change-me-now",
  corsOrigins,
  metadataDb: {
    host: process.env.DBMS_DB_HOST || "localhost",
    port: Number(process.env.DBMS_DB_PORT || 3306),
    database: process.env.DBMS_DB_NAME || "dbms_gateway",
    user: process.env.DBMS_DB_USER || "root",
    password: process.env.DBMS_DB_PASSWORD || "",
    connectionLimit: Number(process.env.DBMS_DB_CONNECTION_LIMIT || 10)
  }
};

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (config.corsOrigins.includes("*")) return true;
  if (config.corsOrigins.includes(origin)) return true;
  return /^https:\/\/database-system-dbms(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
}

module.exports = { config, isAllowedOrigin };
