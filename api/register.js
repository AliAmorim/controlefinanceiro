// Cadastro de novo usuário (permite mais pessoas usarem o app).
// POST /api/register { username, password } -> { token, user }
// Cada usuário tem seus próprios dados (app_state.id = "user:<id>").

const { getSql, hashPassword, newToken } = require("../lib/auth");

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
    if (username.length < 3) {
      res.status(400).json({ error: "O usuário precisa ter ao menos 3 caracteres." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "A senha precisa ter ao menos 6 caracteres." });
      return;
    }
    const exists = await sql`select id from users where lower(username) = lower(${username})`;
    if (exists.length) {
      res.status(409).json({ error: "Esse usuário já existe. Escolha outro ou faça login." });
      return;
    }
    const hash = hashPassword(password);
    const rows = await sql`
      insert into users (username, password_hash)
      values (${username}, ${hash})
      returning id, username
    `;
    const user = rows[0];
    const token = newToken();
    await sql`
      insert into sessions (token, user_id, expires_at)
      values (${token}, ${user.id}, now() + interval '30 days')
    `;
    res.status(200).json({ ok: true, token, user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
