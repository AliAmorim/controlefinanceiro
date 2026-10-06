-- Schema do Fluxo — controle financeiro
-- Rode isto uma vez no banco Neon (SQL Editor do Neon, ou acesse /api/init).

create table if not exists app_state (
  id         text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
