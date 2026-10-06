// Logout — apaga a sessão atual.
// POST /api/logout (header Authorization: Bearer <token>)
const { getSql, bearer } = require("../lib/auth");

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();
    const token = bearer(req);
    if (token) await sql`delete from sessions where token = ${token}`;
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
