-- Tabla de técnicos
create table if not exists teams.tecnicos (
  id bigserial primary key,
  auth_user_id uuid unique,        -- ID de usuario en Supabase Auth
  nombre text not null,
  apellidos text,
  email text not null unique,
  owner_id text not null,          -- El nutricionista (admin) que lo creó
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla pivote: qué equipos puede ver cada técnico
create table if not exists teams.tecnico_equipos (
  id bigserial primary key,
  tecnico_id bigint not null references teams.tecnicos(id) on delete cascade,
  equipo_id bigint not null references teams.equipos(id) on delete cascade,
  created_at timestamptz default now(),
  unique(tecnico_id, equipo_id)
);

-- Índices para mejorar rendimiento
create index if not exists teams_tecnicos_auth_user_id_idx on teams.tecnicos(auth_user_id);
create index if not exists teams_tecnicos_owner_id_idx on teams.tecnicos(owner_id);
create index if not exists teams_tecnico_equipos_tecnico_id_idx on teams.tecnico_equipos(tecnico_id);
create index if not exists teams_tecnico_equipos_equipo_id_idx on teams.tecnico_equipos(equipo_id);

-- Habilitar permisos
grant all on table teams.tecnicos to anon, authenticated, service_role;
grant all on sequence teams.tecnicos_id_seq to anon, authenticated, service_role;
grant all on table teams.tecnico_equipos to anon, authenticated, service_role;
grant all on sequence teams.tecnico_equipos_id_seq to anon, authenticated, service_role;

notify pgrst, 'reload schema';
