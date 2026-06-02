const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { config } = require("../config/config");
const { metadataPool } = require("../config/db");

function createAuthRouter() {
  const router = require("express").Router();

  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      await ensureDefaultAdmin();

      const [admins] = await metadataPool.execute(
        "SELECT email, password_hash, role FROM admins WHERE email = ? LIMIT 1",
        [email]
      );
      const admin = admins[0];
      const passwordMatches = admin ? await bcrypt.compare(password, admin.password_hash) : false;

      if (!admin || !passwordMatches) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ email: admin.email, role: admin.role }, config.jwtSecret, { expiresIn: "8h" });
      return res.json({ token });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}

async function ensureDefaultAdmin() {
  const [admins] = await metadataPool.execute("SELECT id FROM admins WHERE email = ? LIMIT 1", [config.adminEmail]);
  if (admins.length) return;

  const hash = config.adminPassword.startsWith("$2")
    ? config.adminPassword
    : await bcrypt.hash(config.adminPassword, 12);
  await metadataPool.execute("INSERT INTO admins (email, password_hash, role) VALUES (?, ?, 'admin')", [
    config.adminEmail,
    hash
  ]);
}

module.exports = { createAuthRouter };
