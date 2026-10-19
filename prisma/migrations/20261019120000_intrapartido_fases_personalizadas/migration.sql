-- Migration: fases intrapartido personalizables por equipo
-- Cada equipo define sus fases en configuracion_nutricional.intrapartido.fases y cada partido
-- guarda una copia (fases) para que cambiar la configuración no altere el historial.
-- fases nulo = las 7 fases por defecto de config/intrapartido.js.

alter table teams.partidos_intrapartido
  add column if not exists fases jsonb;

-- El momento deja de ser una lista cerrada: ahora es el id de una fase (por defecto o creada por el equipo)
do $$
declare
  v_name text;
begin
  for v_name in
    select conname from pg_constraint
     where conrelid = 'teams.partido_tomas'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%momento%'
  loop
    execute format('alter table teams.partido_tomas drop constraint %I', v_name);
  end loop;
end
$$;

alter table teams.partido_tomas
  add constraint partido_tomas_momento_check check (momento ~ '^[a-z0-9_-]{1,40}$');

drop function if exists teams.guardar_intrapartido(bigint, bigint, text, text, text, date, text, jsonb, jsonb, text, smallint, text);

create or replace function teams.guardar_intrapartido(
  p_partido_id bigint,
  p_equipo_id bigint,
  p_rival text,
  p_competicion text,
  p_lugar text,
  p_fecha date,
  p_created_by text,
  p_convocados jsonb,
  p_tomas jsonb,
  p_estado text default 'finalizado',
  p_fase_actual smallint default 0,
  p_paso text default 'alineacion',
  p_fases jsonb default null
) returns bigint
language plpgsql
security invoker
set search_path = teams, public
as $$
declare
  v_id bigint;
begin
  if p_partido_id is null then
    insert into partidos_intrapartido (equipo_id, rival, competicion, lugar, fecha, created_by, estado, fase_actual, paso, fases)
    values (p_equipo_id, p_rival, p_competicion, p_lugar, p_fecha, p_created_by, p_estado, p_fase_actual, p_paso, p_fases)
    returning id into v_id;
  else
    update partidos_intrapartido
       set rival = p_rival,
           competicion = p_competicion,
           lugar = p_lugar,
           fecha = p_fecha,
           estado = p_estado,
           fase_actual = p_fase_actual,
           paso = p_paso,
           fases = coalesce(p_fases, fases),
           updated_at = now()
     where id = p_partido_id and equipo_id = p_equipo_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Partido no encontrado';
    end if;

    delete from partido_tomas where partido_id = v_id;
    delete from partido_convocados where partido_id = v_id;
  end if;

  insert into partido_convocados (partido_id, jugador_id, titular)
  select v_id, (c->>'jugador_id')::bigint, coalesce((c->>'titular')::boolean, false)
    from jsonb_array_elements(coalesce(p_convocados, '[]'::jsonb)) c;

  insert into partido_tomas (partido_id, jugador_id, momento, producto_id, cantidad)
  select v_id, (t->>'jugador_id')::bigint, t->>'momento', t->>'producto_id', (t->>'cantidad')::smallint
    from jsonb_array_elements(coalesce(p_tomas, '[]'::jsonb)) t;

  return v_id;
end;
$$;

revoke all on function teams.guardar_intrapartido(bigint, bigint, text, text, text, date, text, jsonb, jsonb, text, smallint, text, jsonb) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function teams.guardar_intrapartido(bigint, bigint, text, text, text, date, text, jsonb, jsonb, text, smallint, text, jsonb) to service_role;
  end if;
end
$$;
