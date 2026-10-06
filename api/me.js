// Verifica a sessão atual.
// GET /api/me (header Authorization: Bearer <token>) -> { user } ou 401
const { getSql, currentUser } = require("../lib/auth");

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();
    const user = await currentUser(req, sql);
    if (!user) {
      res.status(401).json({ error: "não autenticado" });
      return;
    }
    res.status(200).json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
