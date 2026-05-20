create schema if not exists teams;

create table if not exists teams.jugadores (
  id bigserial primary key,
  auth_user_id uuid unique,

  nombre text not null,
  apellidos text,
  posicion text,
  club text,

  fecha_nacimiento date,
  fecha_ultima_medicion date,

  altura_cm double precision,
  peso_kg double precision,
  porcentaje_grasa double precision,
  masa_magra_kg double precision,

  pliegue_biceps double precision,
  pliegue_triceps double precision,
  pliegue_subescapular double precision,
  pliegue_cresta_iliaca double precision,
  pliegue_supraeliaco double precision,
  pliegue_abdominal double precision,
  pliegue_pantorrilla double precision,
  pliegue_muslo double precision,
  suma_6_pliegues double precision,
  suma_8_pliegues double precision,

  porcentaje_grasa_faulkner double precision,
  porcentaje_grasa_yuhasz double precision,

  peso_oseo double precision,
  peso_residual double precision,
  peso_graso double precision,
  peso_muscular double precision,
  peso_magro double precision,
  peso_deseable double precision,

  endomorfia double precision,
  mesomorfia double precision,
  ectomorfia double precision,

  perimetro_brazo_contraido double precision,
  perimetro_pantorrilla double precision,
  perimetro_muslo double precision,

  num_comidas text,
  objetivo text,
  gustos_preferencias text,
  aversiones text,
  intolerancias text,
  alergias text,
  contexto_clinico text,

  factor_actividad double precision,
  kcal_objetivo double precision,
  cho_objetivo_g double precision,
  proteina_objetivo_g double precision,
  grasa_objetivo_g double precision,
  agua_objetivo_ml double precision,

  notas_hidratacion text,
  notas_suplementacion text,
  notas_protocolos text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists teams_jugadores_auth_user_id_idx
  on teams.jugadores (auth_user_id);

create table if not exists teams.evoluciones (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  fecha date not null,

  peso_kg double precision,
  porcentaje_grasa double precision,
  masa_magra_kg double precision,
  suma_6_pliegues double precision,
  notas text,

  created_at timestamptz default now(),
  unique (jugador_id, fecha)
);

create index if not exists teams_evoluciones_jugador_id_idx
  on teams.evoluciones (jugador_id);

create table if not exists teams.analiticas (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  fecha_extraccion date,
  parametros jsonb not null default '[]'::jsonb,
  pdf_nombre text,

  created_at timestamptz default now()
);

create index if not exists teams_analiticas_jugador_id_idx
  on teams.analiticas (jugador_id);

create table if not exists teams.menu_semanal (
  id bigserial primary key,
  semana date not null unique,
  dias jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists teams.planes_ia (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  nombre text not null,
  contexto text,
  contexto_adicional text,
  contenido text not null default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists teams_planes_ia_jugador_id_idx
  on teams.planes_ia (jugador_id);

grant usage on schema teams to anon, authenticated, service_role;
grant all on all tables in schema teams to anon, authenticated, service_role;
grant all on all sequences in schema teams to anon, authenticated, service_role;

alter default privileges in schema teams
  grant all on tables to anon, authenticated, service_role;

alter default privileges in schema teams
  grant all on sequences to anon, authenticated, service_role;

notify pgrst, 'reload schema';
