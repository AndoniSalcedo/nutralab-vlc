-- Migration: cuentas de acceso de jugadores y técnicos dentro de la BD de la app.
-- Sustituye a auth.users de Supabase Auth (al migrar a Neon ya no existe). Se conservan
-- los mismos ids (auth_user_id en jugadores/tecnicos) y los hashes bcrypt, así que las
-- contraseñas siguen funcionando.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists teams.auth_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  banned_until timestamptz,
  deleted_at timestamptz,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists teams_auth_users_email_key
  on teams.auth_users using btree (lower(email)) where deleted_at is null;

-- Igual que el resto de tablas del schema: la app accede con su propio rol.
alter table teams.auth_users enable row level security;
