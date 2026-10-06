// Helpers de autenticação — hash de senha (scrypt) e sessões no Neon.
const crypto = require("crypto");
const { neon } = require("@neondatabase/serverless");

function getSql() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED;
  if (!url) throw new Error("DATABASE_URL não configurada. Conecte o Neon na Vercel.");
  return neon(url);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return salt + ":" + hash;
}

function verifyPassword(password, stored) {
  if (!stored || stored.indexOf(":") < 0) return false;
  const parts = stored.split(":");
  const salt = parts[0];
  const hash = parts[1];
  const test = crypto.scryptSync(String(password), salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(test, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function newToken() {
  return crypto.randomBytes(32).toString("hex");
}

function bearer(req) {
  const auth = req.headers["authorization"] || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

async function currentUser(req, sql) {
  const token = bearer(req);
  if (!token) return null;
  const rows = await sql`
    select u.id, u.username
    from sessions s
    join users u on u.id = s.user_id
    where s.token = ${token} and s.expires_at > now()
  `;
  return rows.length ? rows[0] : null;
}

module.exports = { getSql, hashPassword, verifyPassword, newToken, bearer, currentUser };
