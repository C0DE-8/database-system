const mysql = require("mysql2/promise");
const { metadataPool } = require("../config/db");

class ConnectionManager {
  constructor(projectStore, activityLog, io) {
    this.projectStore = projectStore;
    this.activityLog = activityLog;
    this.io = io;
    this.pools = new Map();
    this.stats = new Map();
  }

  async getPool(siteId) {
    const project = await this.projectStore.get(siteId);
    if (!project || !project.enabled) {
      const error = new Error("Project is not available");
      error.status = 404;
      throw error;
    }

    if (this.pools.has(siteId)) {
      return this.pools.get(siteId);
    }

    const credentials = await this.projectStore.getCredentials(siteId);
    const pool = mysql.createPool({
      host: credentials.host || "localhost",
      port: credentials.port || 3306,
      user: credentials.user || "root",
      password: credentials.password || "",
      database: credentials.database,
      waitForConnections: true,
      connectionLimit: credentials.connectionLimit || 10,
      queueLimit: credentials.queueLimit || 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      namedPlaceholders: true
    });

    this.pools.set(siteId, pool);
    const stats = this.ensureStats(siteId);
    stats.status = "online";
    stats.lastConnectedAt = new Date().toISOString();
    stats.lastError = null;
    await this.recordConnectionEvent(siteId, "pool_created", `Pool created for ${siteId}`, {});
    await this.activityLog.add("connection", `Pool created for ${siteId}`, { siteId });
    await this.broadcast();
    return pool;
  }

  async query(siteId, sql, params = []) {
    const startedAt = Date.now();
    const stats = this.ensureStats(siteId);
    stats.activeQueries += 1;
    stats.totalQueries += 1;
    await this.broadcast();

    try {
      const pool = await this.getPool(siteId);
      const [rows] = await pool.execute(sql, params);
      stats.status = "online";
      stats.lastError = null;
      await this.recordQueryActivity(siteId, sql, Date.now() - startedAt, "success", null);
      await this.activityLog.add("query", `Query executed for ${siteId}`, {
        siteId,
        durationMs: Date.now() - startedAt,
        sql: redactSql(sql)
      });
      return rows;
    } catch (error) {
      stats.status = "offline";
      stats.failedQueries += 1;
      stats.lastError = error.message;
      await this.reconnect(siteId);
      await this.recordConnectionEvent(siteId, "error", error.message, { sql: redactSql(sql) });
      await this.recordQueryActivity(siteId, sql, Date.now() - startedAt, "failed", error.message);
      await this.activityLog.add("error", `Query failed for ${siteId}: ${error.message}`, {
        siteId,
        sql: redactSql(sql)
      });
      throw error;
    } finally {
      stats.activeQueries = Math.max(0, stats.activeQueries - 1);
      await this.broadcast();
    }
  }

  async ping(siteId) {
    try {
      const pool = await this.getPool(siteId);
      await pool.query("SELECT 1");
      const stats = this.ensureStats(siteId);
      stats.status = "online";
      stats.lastError = null;
      await this.recordConnectionEvent(siteId, "online", `${siteId} is online`, {});
      await this.broadcast();
      return true;
    } catch (error) {
      const stats = this.ensureStats(siteId);
      stats.status = "offline";
      stats.lastError = error.message;
      await this.recordConnectionEvent(siteId, "offline", error.message, {});
      await this.broadcast();
      return false;
    }
  }

  async reconnect(siteId) {
    const pool = this.pools.get(siteId);
    if (pool) {
      this.pools.delete(siteId);
      await pool.end().catch(() => {});
    }
    await this.recordConnectionEvent(siteId, "reconnect", `Pool reset for ${siteId}`, {});
  }

  async close(siteId) {
    const pool = this.pools.get(siteId);
    if (pool) {
      await pool.end();
      this.pools.delete(siteId);
    }
    const stats = this.ensureStats(siteId);
    stats.status = "offline";
    await this.recordConnectionEvent(siteId, "pool_closed", `Pool closed for ${siteId}`, {});
    await this.broadcast();
  }

  async closeAll() {
    await Promise.all([...this.pools.keys()].map((siteId) => this.close(siteId)));
  }

  async pingAll() {
    const projects = await this.projectStore.list();
    const results = await Promise.all(
      projects.map(async (project) => ({
        siteId: project.siteId,
        online: await this.ping(project.siteId)
      }))
    );
    return results;
  }

  async snapshot() {
    const projects = await this.projectStore.list();
    return projects.map((project) => ({
      ...project,
      connection: this.ensureStats(project.siteId),
      poolOpen: this.pools.has(project.siteId)
    }));
  }

  ensureStats(siteId) {
    if (!this.stats.has(siteId)) {
      this.stats.set(siteId, {
        status: "offline",
        activeQueries: 0,
        totalQueries: 0,
        failedQueries: 0,
        lastConnectedAt: null,
        lastError: null
      });
    }
    return this.stats.get(siteId);
  }

  async broadcast() {
    this.io.emit("status", await this.snapshot());
  }

  async recordConnectionEvent(siteId, eventType, message, metadata) {
    const project = await this.projectStore.getRaw(siteId);
    await metadataPool
      .execute(
        `INSERT INTO connection_events (project_id, site_id, event_type, message, metadata)
         VALUES (?, ?, ?, ?, ?)`,
        [project?.id || null, siteId, eventType, message.slice(0, 500), JSON.stringify(metadata || {})]
      )
      .catch((error) => {
        console.error(`Failed to write connection event: ${error.message}`);
      });
  }

  async recordQueryActivity(siteId, sql, durationMs, status, errorMessage) {
    const project = await this.projectStore.getRaw(siteId);
    await metadataPool
      .execute(
        `INSERT INTO query_activity (project_id, site_id, sql_preview, duration_ms, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          project?.id || null,
          siteId,
          redactSql(sql),
          Number(durationMs || 0),
          status,
          errorMessage ? errorMessage.slice(0, 500) : null
        ]
      )
      .catch((error) => {
        console.error(`Failed to write query activity: ${error.message}`);
      });
  }
}

function redactSql(sql) {
  if (!sql) return "";
  return sql.replace(/\s+/g, " ").trim().slice(0, 300);
}

module.exports = { ConnectionManager };
