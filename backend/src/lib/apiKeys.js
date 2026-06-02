const crypto = require("crypto");

function createApiKey() {
  const raw = `dbms_${crypto.randomBytes(32).toString("base64url")}`;
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, 12)
  };
}

function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

function verifyApiKey(apiKey, hash) {
  if (!apiKey || !hash) return false;
  const incoming = Buffer.from(hashApiKey(apiKey), "hex");
  const stored = Buffer.from(hash, "hex");
  return incoming.length === stored.length && crypto.timingSafeEqual(incoming, stored);
}

module.exports = { createApiKey, hashApiKey, verifyApiKey };
