// API do Fluxo — lê e grava o estado do app no Postgres (Neon), por usuário.
// Exige sessão válida (header Authorization: Bearer <token>).
// GET  /api/state  -> { data: {...} | null }
// POST /api/state  -> grava o corpo { data: {...} }

const { getSql, currentUser } = require("../lib/auth");

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();
    const user = await currentUser(req, sql);
    if (!user) {
      res.status(401).json({ error: "não autenticado" });
      return;
    }
    const id = "user:" + user.id;

    if (req.method === "GET") {
      const rows = await sql`select data, updated_at from app_state where id = ${id}`;
      if (!rows.length) {
        res.status(200).json({ data: null });
        return;
      }
      res.status(200).json({ data: rows[0].data, updated_at: rows[0].updated_at });
      return;
    }

    if (req.method === "POST" || req.method === "PUT") {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch (e) { body = null; }
      }
      const data = body && body.data ? body.data : body;
      if (!data || typeof data !== "object") {
        res.status(400).json({ error: "payload inválido" });
        return;
      }
      await sql`
        insert into app_state (id, data, updated_at)
        values (${id}, ${JSON.stringify(data)}::jsonb, now())
        on conflict (id) do update set data = excluded.data, updated_at = now()
      `;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "método não permitido" });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
