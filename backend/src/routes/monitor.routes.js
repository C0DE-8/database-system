function createMonitorRouter(projectStore, connectionManager, activityLog) {
  const router = require("express").Router();

  router.get("/status", async (req, res) => {
    try {
      res.json(await connectionManager.snapshot());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/logs", async (req, res) => {
    try {
      res.json(await activityLog.list(Number(req.query.limit || 100)));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/summary", async (req, res) => {
    try {
      const status = await connectionManager.snapshot();
      res.json({
        projects: (await projectStore.list()).length,
        online: status.filter((project) => project.connection.status === "online").length,
        offline: status.filter((project) => project.connection.status !== "online").length,
        activeQueries: status.reduce((sum, project) => sum + project.connection.activeQueries, 0),
        totalQueries: status.reduce((sum, project) => sum + project.connection.totalQueries, 0)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/ping-all", async (req, res) => {
    try {
      res.json(await connectionManager.pingAll());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createMonitorRouter };
