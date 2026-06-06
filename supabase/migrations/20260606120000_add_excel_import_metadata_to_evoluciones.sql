alter table teams.evoluciones
  add column if not exists metricas_excel jsonb not null default '{}'::jsonb,
  add column if not exists fuente_hoja text,
  add column if not exists fuente_fila integer,
  add column if not exists fecha_original_excel date,
  add column if not exists fecha_corregida boolean not null default false;

notify pgrst, 'reload schema';
