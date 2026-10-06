// Cria as tabelas do app no banco Neon.
// Acesse UMA VEZ depois do deploy:  https://SEU-APP.vercel.app/api/init

const { getSql } = require("../lib/auth");

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();
    await sql`create table if not exists users (
      id            serial primary key,
      username      text unique not null,
      password_hash text not null,
      created_at    timestamptz not null default now()
    )`;
    await sql`create table if not exists sessions (
      token      text primary key,
      user_id    integer not null references users(id) on delete cascade,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null
    )`;
    await sql`create table if not exists app_state (
      id         text primary key,
      data       jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    )`;
    res.status(200).json({ ok: true, message: "Tabelas users, sessions e app_state prontas." });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
