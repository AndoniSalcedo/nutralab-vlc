alter table teams.jugadores
  add column if not exists recomendaciones_defecto jsonb default '{}'::jsonb;
