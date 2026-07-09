function createProjectRouter(projectStore, connectionManager, activityLog) {
  const router = require("express").Router();

  router.get("/", async (req, res) => {
    try {
      res.json(await projectStore.list({ includeSecrets: true }));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:siteId", async (req, res) => {
    try {
      const project = await projectStore.get(req.params.siteId, { includeSecrets: true });
      if (!project) return res.status(404).json({ error: "Project not found" });
      return res.json(project);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const result = await projectStore.create(req.body);
      await activityLog.add("project", `Project created: ${result.project.siteId}`, { siteId: result.project.siteId });
      res.status(201).json(result);
    } catch (error) {
      res.status(error.status || 400).json({ error: error.message });
    }
  });

  router.put("/:siteId", async (req, res) => {
    try {
      const project = await projectStore.update(req.params.siteId, req.body);
      if (!project) return res.status(404).json({ error: "Project not found" });
      await connectionManager.reconnect(req.params.siteId);
      await activityLog.add("project", `Project updated: ${req.params.siteId}`, { siteId: req.params.siteId });
      return res.json(project);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.delete("/:siteId", async (req, res) => {
    try {
      const deleted = await projectStore.delete(req.params.siteId);
      if (!deleted) return res.status(404).json({ error: "Project not found" });
      await connectionManager.close(req.params.siteId);
      await activityLog.add("project", `Project deleted: ${req.params.siteId}`, { siteId: req.params.siteId });
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post("/:siteId/keys", async (req, res) => {
    try {
      const result = await projectStore.rotateApiKey(req.params.siteId, req.body.name);
      if (!result) return res.status(404).json({ error: "Project not found" });
      await activityLog.add("apikey", `API key generated for ${req.params.siteId}`, { siteId: req.params.siteId });
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.delete("/:siteId/keys/:keyId", async (req, res) => {
    try {
      const deleted = await projectStore.deleteApiKey(req.params.siteId, req.params.keyId);
      if (!deleted) return res.status(404).json({ error: "API key not found" });
      await activityLog.add("apikey", `API key deleted for ${req.params.siteId}`, { siteId: req.params.siteId });
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post("/:siteId/ping", async (req, res) => {
    try {
      const online = await connectionManager.ping(req.params.siteId);
      return res.json({ online });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/:siteId/databases", async (req, res) => {
    try {
      const rows = await connectionManager.query(
        req.params.siteId,
        `SELECT
          SCHEMA_NAME AS name,
          DEFAULT_CHARACTER_SET_NAME AS charset,
          DEFAULT_COLLATION_NAME AS collation
         FROM INFORMATION_SCHEMA.SCHEMATA
         ORDER BY SCHEMA_NAME`
      );

      return res.json(rows.map((row) => ({
        ...row,
        system: ["information_schema", "mysql", "performance_schema", "sys"].includes(row.name)
      })));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/:siteId/databases/:database/tables", async (req, res) => {
    try {
      const rows = await connectionManager.query(
        req.params.siteId,
        `SELECT
          TABLE_NAME AS name,
          TABLE_TYPE AS type,
          ENGINE AS engine,
          TABLE_ROWS AS rowCount,
          DATA_LENGTH AS dataLength,
          CREATE_TIME AS createdAt,
          UPDATE_TIME AS updatedAt
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = ?
         ORDER BY TABLE_NAME`,
        [req.params.database]
      );

      return res.json(rows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/:siteId/databases/:database/tables/:table/columns", async (req, res) => {
    try {
      const rows = await connectionManager.query(
        req.params.siteId,
        `SELECT
          COLUMN_NAME AS name,
          COLUMN_TYPE AS type,
          IS_NULLABLE AS nullable,
          COLUMN_KEY AS columnKey,
          COLUMN_DEFAULT AS defaultValue,
          EXTRA AS extra,
          ORDINAL_POSITION AS position
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [req.params.database, req.params.table]
      );

      return res.json(rows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createProjectRouter };
