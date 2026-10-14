-- Migration: registro diario del jugador (agua bebida y suplementos tomados)
-- Antes vivía solo en el localStorage del navegador; ahora el staff puede verlo.
create table if not exists teams.registros_diarios (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  fecha date not null,
  agua_ml integer default 0 not null check (agua_ml between 0 and 20000),
  suplementos_tomados integer[] default array[]::integer[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (jugador_id, fecha)
);

alter table teams.registros_diarios enable row level security;
