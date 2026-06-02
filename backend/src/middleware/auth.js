const jwt = require("jsonwebtoken");
const { config } = require("../config/config");

function authenticateAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing admin token" });
  }

  try {
    req.admin = jwt.verify(token, config.jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid admin token" });
  }
}

module.exports = { authenticateAdmin };
