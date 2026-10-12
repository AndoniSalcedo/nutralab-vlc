-- Migration: borrador del control intrapartido
-- El partido se guarda tras cada etapa (estado = 'borrador') para poder retomarlo si se
-- cierra la app; al guardar el balance final pasa a 'finalizado'.
-- Los partidos existentes quedan como 'finalizado'.

alter table teams.partidos_intrapartido
  add column if not exists estado text default 'finalizado' not null
    check (estado in ('borrador', 'finalizado')),
  add column if not exists fase_actual smallint default 0 not null,
  add column if not exists paso text default 'alineacion' not null
    check (paso in ('alineacion', 'fases', 'resumen'));

create index if not exists teams_partidos_intrapartido_estado_idx
  on teams.partidos_intrapartido using btree (estado, equipo_id);

drop function if exists teams.guardar_intrapartido(bigint, bigint, text, text, text, date, text, jsonb, jsonb);

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
  p_paso text default 'alineacion'
) returns bigint
language plpgsql
security invoker
set search_path = teams, public
as $$
declare
  v_id bigint;
begin
  if p_partido_id is null then
    insert into partidos_intrapartido (equipo_id, rival, competicion, lugar, fecha, created_by, estado, fase_actual, paso)
    values (p_equipo_id, p_rival, p_competicion, p_lugar, p_fecha, p_created_by, p_estado, p_fase_actual, p_paso)
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

revoke all on function teams.guardar_intrapartido(bigint, bigint, text, text, text, date, text, jsonb, jsonb, text, smallint, text) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function teams.guardar_intrapartido(bigint, bigint, text, text, text, date, text, jsonb, jsonb, text, smallint, text) to service_role;
  end if;
end
$$;
