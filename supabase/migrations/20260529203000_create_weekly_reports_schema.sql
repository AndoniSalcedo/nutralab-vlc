create table if not exists teams.informes_semanales (
  id bigserial primary key,
  equipo_id bigint not null references teams.equipos(id) on delete cascade,
  semana date not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (equipo_id, semana)
);

create index if not exists teams_informes_semanales_equipo_semana_idx
  on teams.informes_semanales (equipo_id, semana);

grant all on table teams.informes_semanales to anon, authenticated, service_role;
grant all on sequence teams.informes_semanales_id_seq to anon, authenticated, service_role;

notify pgrst, 'reload schema';
