// API do Fluxo — lê e grava o estado do app no Postgres (Neon).
// GET  /api/state  -> { data: {...} | null }
// POST /api/state  -> grava o corpo { data: {...} }
//
// Variáveis de ambiente (a Vercel configura automaticamente ao conectar o Neon):
//   DATABASE_URL  (ou POSTGRES_URL / DATABASE_URL_UNPOOLED)
//   APP_SECRET    (opcional, mas recomendado — chave de acesso do app)
//   STATE_ID      (opcional — id do registro; padrão "aline")

const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED;

  if (!url) {
    res.status(500).json({
      error:
        "DATABASE_URL não configurada. Conecte um banco Neon ao projeto na Vercel (aba Storage).",
    });
    return;
  }

  const secret = process.env.APP_SECRET || "";
  if (secret) {
    const auth = req.headers["authorization"] || "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (token !== secret) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
  }

  const sql = neon(url);
  const id = process.env.STATE_ID || "aline";

  try {
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
