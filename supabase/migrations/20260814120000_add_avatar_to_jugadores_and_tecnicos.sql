-- Add avatar columns to teams.jugadores
alter table teams.jugadores
  add column if not exists avatar bytea,
  add column if not exists avatar_mime text default 'image/webp',
  add column if not exists avatar_size integer;

-- Add avatar columns to teams.tecnicos
alter table teams.tecnicos
  add column if not exists avatar bytea,
  add column if not exists avatar_mime text default 'image/webp',
  add column if not exists avatar_size integer;

notify pgrst, 'reload schema';
