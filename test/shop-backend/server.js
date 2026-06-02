require("dotenv").config();

const express = require("express");
const { connectProject } = require("diamond-sql");

const app = express();
const port = Number(process.env.PORT || 5050);
const siteId = process.env.SITE_ID || "shop";
const apiKey = process.env.API_KEY;
const dbmsUrl = process.env.DBMS_URL || "http://localhost:4000";

const db = connectProject(siteId, {
  apiKey,
  dbmsUrl
});

app.use(express.json());

app.get("/health", async (req, res) => {
  if (!hasFullApiKey(apiKey)) {
    return res.status(400).json({
      ok: false,
      error:
        "API_KEY must be the full key shown once when generated. The dashboard project list only shows key prefixes."
    });
  }

  try {
    const status = await db.status();
    res.json({ ok: true, gateway: status });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message });
  }
});

app.get("/products", async (req, res) => {
  try {
    const rows = await db.query("SELECT id, name, price FROM products ORDER BY id DESC LIMIT 25");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const rows = await db.query("SELECT id, name, price FROM products WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Product not found" });
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const server = app.listen(port, () => {
  console.log(`Shop test backend listening on http://localhost:${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the existing shop server or set PORT to another value.`);
    process.exit(1);
  }

  throw error;
});

function hasFullApiKey(value) {
  return typeof value === "string" && value.startsWith("dbms_") && value.length > 30;
}
