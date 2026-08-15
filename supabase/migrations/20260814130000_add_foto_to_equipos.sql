-- Add foto (logo/avatar) columns to teams.equipos
alter table teams.equipos
  add column if not exists foto bytea,
  add column if not exists foto_mime text default 'image/webp',
  add column if not exists foto_size integer;

notify pgrst, 'reload schema';
