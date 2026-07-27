-- Permitir que owner_id sea nulo (cuando el técnico se registra solo)
alter table teams.tecnicos alter column owner_id drop not null;

-- Tabla de vinculación entre nutricionistas y técnicos
create table if not exists teams.nutricionista_tecnicos (
  id bigserial primary key,
  nutricionista_id text not null,                  -- El owner_id del nutricionista
  tecnico_id bigint not null references teams.tecnicos(id) on delete cascade,
  status text not null default 'accepted',         -- Estado de la vinculación/colaboración
  created_at timestamptz default now(),
  unique(nutricionista_id, tecnico_id)
);

-- Índices
create index if not exists teams_nutricionista_tecnicos_nutricionista_id_idx on teams.nutricionista_tecnicos(nutricionista_id);
create index if not exists teams_nutricionista_tecnicos_tecnico_id_idx on teams.nutricionista_tecnicos(tecnico_id);

-- Permisos
grant all on table teams.nutricionista_tecnicos to anon, authenticated, service_role;
grant all on sequence teams.nutricionista_tecnicos_id_seq to anon, authenticated, service_role;

notify pgrst, 'reload schema';
