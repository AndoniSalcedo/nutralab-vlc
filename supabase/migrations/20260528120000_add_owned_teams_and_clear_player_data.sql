create table if not exists teams.equipos (
  id bigserial primary key,
  owner_id text not null,
  nombre text not null,
  temporada text not null,
  descripcion text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table teams.jugadores
  add column if not exists equipo_id bigint references teams.equipos(id) on delete cascade;

alter table teams.mensajes
  add column if not exists owner_id text,
  add column if not exists equipo_id bigint references teams.equipos(id) on delete cascade;

create index if not exists teams_equipos_owner_temporada_idx
  on teams.equipos (owner_id, temporada);

create index if not exists teams_jugadores_equipo_id_idx
  on teams.jugadores (equipo_id);

create index if not exists teams_mensajes_equipo_id_idx
  on teams.mensajes (equipo_id);

truncate table
  teams.menu_semanal,
  teams.mensajes,
  teams.equipos,
  teams.jugadores
restart identity cascade;

grant all on table teams.equipos to anon, authenticated, service_role;
grant all on sequence teams.equipos_id_seq to anon, authenticated, service_role;

notify pgrst, 'reload schema';
