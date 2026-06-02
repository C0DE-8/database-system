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

  return router;
}

module.exports = { createProjectRouter };
