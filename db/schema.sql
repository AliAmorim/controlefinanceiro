-- Schema do Fluxo — controle financeiro (com login)
-- Rode uma vez: SQL Editor do Neon, ou acesse /api/init depois do deploy.

create table if not exists users (
  id            serial primary key,
  username      text unique not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists sessions (
  token      text primary key,
  user_id    integer not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists app_state (
  id         text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
