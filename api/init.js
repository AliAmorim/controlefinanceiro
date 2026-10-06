// Cria a tabela do app no banco Neon.
// Acesse UMA VEZ depois do deploy:  https://SEU-APP.vercel.app/api/init

const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED;

  if (!url) {
    res.status(500).json({ error: "DATABASE_URL não configurada." });
    return;
  }

  try {
    const sql = neon(url);
    await sql`create table if not exists app_state (
      id         text primary key,
      data       jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    )`;
    res.status(200).json({ ok: true, message: "Tabela app_state criada/verificada." });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
