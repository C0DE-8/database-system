require("dotenv").config({ override: true });

const http = require("http");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const { Server } = require("socket.io");

const { config } = require("./src/config/config");
const { authenticateAdmin } = require("./src/middleware/auth");
const { createAuthRouter } = require("./src/routes/auth.routes");
const { createProjectRouter } = require("./src/routes/projects.routes");
const { createGatewayRouter } = require("./src/routes/gateway.routes");
const { createMonitorRouter } = require("./src/routes/monitor.routes");
const { ProjectStore } = require("./src/services/projectStore");
const { ConnectionManager } = require("./src/services/connectionManager");
const { ActivityLog } = require("./src/services/activityLog");
const { testDbConnection, closeDbConnection } = require("./src/config/db");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
  },
});

const projectStore = new ProjectStore();
const activityLog = new ActivityLog(io);
const connectionManager = new ConnectionManager(
  projectStore,
  activityLog,
  io
);

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", createAuthRouter());

app.use(
  "/api/projects",
  authenticateAdmin,
  createProjectRouter(projectStore, connectionManager, activityLog)
);

app.use(
  "/api/monitor",
  authenticateAdmin,
  createMonitorRouter(projectStore, connectionManager, activityLog)
);

app.use(
  "/gateway",
  createGatewayRouter(projectStore, connectionManager, activityLog)
);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "dbms-gateway",
  });
});

app.get("/health/db", async (req, res) => {
  try {
    await testDbConnection();

    res.json({
      ok: true,
      database: config.metadataDb.database,
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: error.message,
    });
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${config.port} is already in use. Stop the existing server or set PORT to another value.`
    );
    process.exit(1);
  }

  throw error;
});

server.listen(config.port, () => {
  console.log(`DBMS Gateway listening on http://localhost:${config.port}`);
  console.log("Metadata DB:", {
    host: config.metadataDb.host,
    database: config.metadataDb.database,
    user: config.metadataDb.user,
  });
});

process.on("SIGINT", async () => {
  await connectionManager.closeAll();
  await closeDbConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await connectionManager.closeAll();
  await closeDbConnection();
  process.exit(0);
});