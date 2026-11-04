-- Migration: macros en el diario de comidas y varios platos por ingesta

alter table teams.comidas
  add column if not exists protein double precision,
  add column if not exists carbs double precision,
  add column if not exists fat double precision;

create table if not exists teams.comidas_platos (
  id bigserial primary key,
  comida_id bigint not null references teams.comidas(id) on delete cascade,
  position integer not null default 0,
  dish_name text,
  ingredients text[] default array[]::text[],
  calories integer,
  protein double precision,
  carbs double precision,
  fat double precision,
  photo bytea,
  photo_mime text default 'image/webp',
  photo_size integer,
  created_at timestamptz default now()
);
create index if not exists teams_comidas_platos_comida_idx on teams.comidas_platos (comida_id, position);

alter table teams.comidas_platos enable row level security;
