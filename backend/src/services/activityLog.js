const { metadataPool } = require("../config/db");

class ActivityLog {
  constructor(io) {
    this.io = io;
    this.entries = [];
  }

  async add(type, message, metadata = {}) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      message,
      metadata,
      createdAt: new Date().toISOString()
    };

    this.entries.unshift(entry);
    this.entries = this.entries.slice(0, 500);
    this.io.emit("activity", entry);

    await metadataPool
      .execute(
        `INSERT INTO gateway_logs (type, message, metadata)
         VALUES (?, ?, ?)`,
        [type, message, JSON.stringify(metadata || {})]
      )
      .catch((error) => {
        console.error(`Failed to write gateway log: ${error.message}`);
      });

    return entry;
  }

  async list(limit = 100) {
    const [rows] = await metadataPool.execute(
      `SELECT id, type, message, metadata, created_at
       FROM gateway_logs
       ORDER BY created_at DESC
       LIMIT ?`,
      [Number(limit)]
    );

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      message: row.message,
      metadata: parseJson(row.metadata),
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
    }));
  }
}

function parseJson(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

module.exports = { ActivityLog };
