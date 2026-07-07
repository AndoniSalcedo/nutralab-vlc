alter table teams.equipos
  add column if not exists configuracion_nutricional jsonb default '{}'::jsonb;

notify pgrst, 'reload schema';
