function createGatewayRouter(projectStore, connectionManager, activityLog) {
  const router = require("express").Router();

  router.use(async (req, res, next) => {
    try {
      const siteId = req.headers["x-site-id"] || req.body.siteId;
      const apiKey = req.headers["x-api-key"];
      const project = await projectStore.verifyApiKey(siteId, apiKey);

      if (!project) {
        await activityLog.add("auth", `Gateway auth failed for ${siteId || "unknown"}`, { siteId });
        return res.status(401).json({ error: "Invalid API key" });
      }

      req.siteId = siteId;
      return next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/status", async (req, res) => {
    const online = await connectionManager.ping(req.siteId);
    res.json({ siteId: req.siteId, online });
  });

  router.post("/query", async (req, res) => {
    const { sql, params } = req.body;
    if (!sql || typeof sql !== "string") {
      return res.status(400).json({ error: "sql is required" });
    }

    try {
      const rows = await connectionManager.query(req.siteId, sql, params || []);
      return res.json({ rows });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createGatewayRouter };
