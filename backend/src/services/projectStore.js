const { metadataPool } = require("../config/db");
const { encryptJson, decryptJson } = require("../lib/crypto");
const { createApiKey, verifyApiKey } = require("../lib/apiKeys");

class ProjectStore {
  async list(options = {}) {
    const [projects] = await metadataPool.execute(
      `SELECT
        id, name, site_id, enabled, db_host, db_port, db_name, db_user,
        encrypted_db_password, encrypted_credentials,
        pool_connection_limit, pool_queue_limit, created_at, updated_at
       FROM projects
       ORDER BY created_at DESC`
    );

    const [keys] = await metadataPool.execute(
      `SELECT id, project_id, name, key_prefix, encrypted_api_key, created_at, revoked_at
       FROM project_api_keys
       ORDER BY created_at DESC`
    );

    const keysByProject = new Map();
    for (const key of keys) {
      if (!keysByProject.has(key.project_id)) keysByProject.set(key.project_id, []);
      keysByProject.get(key.project_id).push(this.sanitizeKey(key, options));
    }

    return projects.map((project) => this.sanitize(project, keysByProject.get(project.id) || [], options));
  }

  async get(siteId, options = {}) {
    const [rows] = await metadataPool.execute(
      `SELECT id, name, site_id, enabled, db_host, db_port, db_name, db_user,
        encrypted_db_password, encrypted_credentials,
        pool_connection_limit, pool_queue_limit, created_at, updated_at
       FROM projects
       WHERE site_id = ?
       LIMIT 1`,
      [siteId]
    );
    if (!rows.length) return null;

    const [keys] = await metadataPool.execute(
      `SELECT id, project_id, name, key_prefix, encrypted_api_key, created_at, revoked_at
       FROM project_api_keys
       WHERE project_id = ?
       ORDER BY created_at DESC`,
      [rows[0].id]
    );

    return this.sanitize(rows[0], keys.map((key) => this.sanitizeKey(key, options)), options);
  }

  async getRaw(siteId) {
    const [rows] = await metadataPool.execute(
      `SELECT *
       FROM projects
       WHERE site_id = ?
       LIMIT 1`,
      [siteId]
    );
    return rows[0] || null;
  }

  async getCredentials(siteId) {
    const project = await this.getRaw(siteId);
    if (!project) return null;

    if (project.encrypted_credentials) {
      return decryptJson(JSON.parse(project.encrypted_credentials));
    }

    return {
      host: project.db_host || "localhost",
      port: Number(project.db_port || 3306),
      database: project.db_name,
      user: project.db_user || "root",
      password: project.encrypted_db_password ? decryptJson(JSON.parse(project.encrypted_db_password)).password : "",
      connectionLimit: Number(project.pool_connection_limit || 10),
      queueLimit: Number(project.pool_queue_limit || 0)
    };
  }

  async create(input) {
    const existing = await this.get(input.siteId);
    if (existing) {
      const error = new Error("Project siteId already exists");
      error.status = 409;
      throw error;
    }

    const credentials = normalizeCredentials(input.credentials);
    const apiKey = createApiKey();
    const connection = await metadataPool.getConnection();

    try {
      await connection.beginTransaction();
      const [projectResult] = await connection.execute(
        `INSERT INTO projects (
          name, site_id, enabled, db_host, db_port, db_name, db_user,
          encrypted_db_password, encrypted_credentials,
          pool_connection_limit, pool_queue_limit
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.name,
          input.siteId,
          input.enabled !== false ? 1 : 0,
          credentials.host,
          credentials.port,
          credentials.database,
          credentials.user,
          JSON.stringify(encryptJson({ password: credentials.password })),
          JSON.stringify(encryptJson(credentials)),
          credentials.connectionLimit,
          credentials.queueLimit
        ]
      );

      await connection.execute(
        `INSERT INTO project_api_keys (project_id, name, key_prefix, key_hash, encrypted_api_key)
         VALUES (?, ?, ?, ?, ?)`,
        [projectResult.insertId, "Default key", apiKey.prefix, apiKey.hash, JSON.stringify(encryptJson({ apiKey: apiKey.raw }))]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return { project: await this.get(input.siteId, { includeSecrets: true }), apiKey: apiKey.raw };
  }

  async update(siteId, input) {
    const project = await this.getRaw(siteId);
    if (!project) return null;

    const enabled = input.enabled ?? Boolean(project.enabled);
    const values = [input.name ?? project.name, enabled ? 1 : 0];
    let credentialSql = "";

    if (input.credentials) {
      const credentials = normalizeCredentials(input.credentials);
      credentialSql = `,
        db_host = ?,
        db_port = ?,
        db_name = ?,
        db_user = ?,
        encrypted_db_password = ?,
        encrypted_credentials = ?,
        pool_connection_limit = ?,
        pool_queue_limit = ?`;
      values.push(
        credentials.host,
        credentials.port,
        credentials.database,
        credentials.user,
        JSON.stringify(encryptJson({ password: credentials.password })),
        JSON.stringify(encryptJson(credentials)),
        credentials.connectionLimit,
        credentials.queueLimit
      );
    }

    values.push(siteId);
    await metadataPool.execute(
      `UPDATE projects
       SET name = ?, enabled = ?${credentialSql}
       WHERE site_id = ?`,
      values
    );

    return this.get(siteId, { includeSecrets: true });
  }

  async delete(siteId) {
    const [result] = await metadataPool.execute("DELETE FROM projects WHERE site_id = ?", [siteId]);
    return result.affectedRows > 0;
  }

  async rotateApiKey(siteId, name = "Rotated key") {
    const project = await this.getRaw(siteId);
    if (!project) return null;

    const apiKey = createApiKey();
    const [result] = await metadataPool.execute(
      `INSERT INTO project_api_keys (project_id, name, key_prefix, key_hash, encrypted_api_key)
       VALUES (?, ?, ?, ?, ?)`,
      [project.id, name, apiKey.prefix, apiKey.hash, JSON.stringify(encryptJson({ apiKey: apiKey.raw }))]
    );

    const [keys] = await metadataPool.execute(
      `SELECT id, project_id, name, key_prefix, encrypted_api_key, created_at, revoked_at
       FROM project_api_keys
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return { key: this.sanitizeKey(keys[0], { includeSecrets: true }), apiKey: apiKey.raw };
  }

  async deleteApiKey(siteId, keyId) {
    const project = await this.getRaw(siteId);
    if (!project) return null;

    const [result] = await metadataPool.execute("DELETE FROM project_api_keys WHERE id = ? AND project_id = ?", [
      keyId,
      project.id
    ]);

    return result.affectedRows > 0;
  }

  async verifyApiKey(siteId, apiKey) {
    const project = await this.getRaw(siteId);
    if (!project || !project.enabled) return null;

    const [keys] = await metadataPool.execute(
      `SELECT id, key_hash, revoked_at
       FROM project_api_keys
       WHERE project_id = ? AND revoked_at IS NULL`,
      [project.id]
    );

    const matched = keys.find((key) => verifyApiKey(apiKey, key.key_hash));
    if (!matched) return null;

    await metadataPool.execute("UPDATE project_api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?", [
      matched.id
    ]);
    return this.sanitize(project, []);
  }

  sanitize(project, apiKeys = [], options = {}) {
    const sanitized = {
      id: project.id,
      name: project.name,
      siteId: project.site_id,
      enabled: Boolean(project.enabled),
      apiKeys,
      createdAt: toIso(project.created_at),
      updatedAt: toIso(project.updated_at)
    };

    if (options.includeSecrets) {
      sanitized.credentials = this.credentialsFromProject(project);
    }

    return sanitized;
  }

  sanitizeKey(key, options = {}) {
    const sanitized = {
      id: key.id,
      name: key.name,
      prefix: key.key_prefix,
      createdAt: toIso(key.created_at),
      revokedAt: key.revoked_at ? toIso(key.revoked_at) : null
    };

    if (options.includeSecrets) {
      sanitized.apiKey = key.encrypted_api_key ? decryptJson(JSON.parse(key.encrypted_api_key)).apiKey : null;
    }

    return sanitized;
  }

  credentialsFromProject(project) {
    if (project.encrypted_credentials) {
      return decryptJson(JSON.parse(project.encrypted_credentials));
    }

    return {
      host: project.db_host || "localhost",
      port: Number(project.db_port || 3306),
      database: project.db_name,
      user: project.db_user || "root",
      password: project.encrypted_db_password ? decryptJson(JSON.parse(project.encrypted_db_password)).password : "",
      connectionLimit: Number(project.pool_connection_limit || 10),
      queueLimit: Number(project.pool_queue_limit || 0)
    };
  }
}

function normalizeCredentials(credentials = {}) {
  return {
    host: credentials.host || "localhost",
    port: Number(credentials.port || 3306),
    database: credentials.database,
    user: credentials.user || "root",
    password: credentials.password || "",
    connectionLimit: Number(credentials.connectionLimit || 10),
    queueLimit: Number(credentials.queueLimit || 0)
  };
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

module.exports = { ProjectStore };
