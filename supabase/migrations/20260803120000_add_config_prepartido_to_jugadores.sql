alter table teams.jugadores
  add column if not exists config_prepartido jsonb default '{}'::jsonb;
