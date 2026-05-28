create table if not exists teams.registros_hidratacion (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  fecha date not null,
  hora text,
  tipo text,
  valor double precision,
  unidad text,
  estado text,
  notas text,
  cuestionario text,
  created_at timestamptz default now(),
  unique (jugador_id, fecha)
);

create index if not exists teams_registros_hidratacion_jugador_fecha_idx
  on teams.registros_hidratacion (jugador_id, fecha);

grant all on table teams.registros_hidratacion to anon, authenticated, service_role;
grant all on sequence teams.registros_hidratacion_id_seq to anon, authenticated, service_role;

notify pgrst, 'reload schema';
