// Login — valida usuário/senha e cria uma sessão.
// POST /api/login { username, password } -> { token, user }
const { getSql, verifyPassword, newToken } = require("../lib/auth");

function parseBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  return body || {};
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "método não permitido" });
    return;
  }
  try {
    const sql = getSql();
    const body = parseBody(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    if (!username || !password) {
      res.status(400).json({ error: "Informe usuário e senha." });
      return;
    }
    const rows = await sql`
      select id, username, password_hash
      from users
      where lower(username) = lower(${username})
    `;
    if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
      res.status(401).json({ error: "Usuário ou senha incorretos." });
      return;
    }
    const token = newToken();
    await sql`
      insert into sessions (token, user_id, expires_at)
      values (${token}, ${rows[0].id}, now() + interval '30 days')
    `;
    res.status(200).json({ ok: true, token, user: { id: rows[0].id, username: rows[0].username } });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
