// Primeiro acesso: cria o usuário inicial (só funciona se ainda não houver nenhum).
// GET  /api/setup -> { needsSetup: true|false }
// POST /api/setup { username, password } -> cria o usuário e já devolve uma sessão
const { getSql, hashPassword, newToken } = require("../lib/auth");

function parseBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  return body || {};
}

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === "GET") {
      const rows = await sql`select count(*)::int as n from users`;
      res.status(200).json({ needsSetup: rows[0].n === 0 });
      return;
    }

    if (req.method === "POST") {
      const existing = await sql`select count(*)::int as n from users`;
      if (existing[0].n > 0) {
        res.status(403).json({ error: "Já existe um usuário cadastrado. Faça login." });
        return;
      }
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
      return;
    }

    res.status(405).json({ error: "método não permitido" });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
