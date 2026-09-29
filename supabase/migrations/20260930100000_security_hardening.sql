-- ==============================================================================
-- NUTRALAB - Endurecimiento de seguridad
--
-- 1. La app accede a la BD SOLO con la service_role key (que ignora RLS).
--    Activamos RLS sin políticas en todas las tablas del schema `teams` y
--    retiramos permisos a `anon`/`authenticated`: así, aunque el schema esté
--    expuesto en PostgREST y la anon key sea pública, nadie puede leer/escribir
--    datos de salud directamente.
-- ==============================================================================

do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'teams' loop
    execute format('alter table teams.%I enable row level security', t.tablename);
  end loop;
end
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema teams from anon;
    revoke all on all sequences in schema teams from anon;
    revoke all on all functions in schema teams from anon;
    revoke usage on schema teams from anon;
    alter default privileges in schema teams revoke all on tables from anon;
    alter default privileges in schema teams revoke all on sequences from anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on all tables in schema teams from authenticated;
    revoke all on all sequences in schema teams from authenticated;
    revoke all on all functions in schema teams from authenticated;
    revoke usage on schema teams from authenticated;
    alter default privileges in schema teams revoke all on tables from authenticated;
    alter default privileges in schema teams revoke all on sequences from authenticated;
  end if;
end
$$;
