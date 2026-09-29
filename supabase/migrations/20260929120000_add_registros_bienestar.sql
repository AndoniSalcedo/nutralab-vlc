-- Migration: cuestionario diario de bienestar (hexágono de wellness)
create table if not exists teams.registros_bienestar (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  fecha date not null,
  sueno smallint not null check (sueno between 1 and 5),
  fatiga smallint not null check (fatiga between 1 and 5),
  dolor_muscular smallint not null check (dolor_muscular between 1 and 5),
  estres smallint not null check (estres between 1 and 5),
  estado_animo smallint not null check (estado_animo between 1 and 5),
  alimentacion smallint not null check (alimentacion between 1 and 5),
  molestia boolean default false not null,
  molestia_detalle text,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (jugador_id, fecha)
);

create index if not exists teams_registros_bienestar_jugador_fecha_idx ON teams.registros_bienestar USING btree (jugador_id, fecha);
