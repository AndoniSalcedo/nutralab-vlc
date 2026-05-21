create table if not exists teams.mensajes (
  id bigserial primary key,
  jugador_id bigint references teams.jugadores(id) on delete cascade,
  titulo text not null,
  contenido text not null,
  created_by text,
  created_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists teams_mensajes_jugador_id_idx
  on teams.mensajes (jugador_id);

create index if not exists teams_mensajes_created_at_idx
  on teams.mensajes (created_at desc);

grant all on table teams.mensajes to anon, authenticated, service_role;
grant all on sequence teams.mensajes_id_seq to anon, authenticated, service_role;

notify pgrst, 'reload schema';
