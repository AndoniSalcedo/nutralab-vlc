-- Create table comidas
create table if not exists teams.comidas (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  taken_at timestamptz not null default now(),
  dish_name text,
  meal_type text not null,
  ingredients text[] not null default '{}'::text[],
  calories integer,
  notes text,
  photo bytea,
  photo_mime text default 'image/webp',
  photo_size integer,
  created_at timestamptz default now()
);

-- Index for querying meals by player and date
create index if not exists teams_comidas_jugador_taken_at_idx
  on teams.comidas (jugador_id, taken_at);

-- Grants
grant all on table teams.comidas to anon, authenticated, service_role;
grant all on sequence teams.comidas_id_seq to anon, authenticated, service_role;

notify pgrst, 'reload schema';
