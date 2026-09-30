-- Migration: control de hidratación y nutrición intrapartido
-- El catálogo de productos y momentos vive en la app (config/intrapartido.js);
-- aquí se guarda el partido, la convocatoria y las tomas registradas.

create table if not exists teams.partidos_intrapartido (
  id bigserial primary key,
  equipo_id bigint not null references teams.equipos(id) on delete cascade,
  rival text default '' not null,
  competicion text default '' not null,
  lugar text default '' not null,
  fecha date not null,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists teams_partidos_intrapartido_equipo_fecha_idx
  on teams.partidos_intrapartido using btree (equipo_id, fecha desc);

create table if not exists teams.partido_convocados (
  partido_id bigint not null references teams.partidos_intrapartido(id) on delete cascade,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  titular boolean default false not null,
  primary key (partido_id, jugador_id)
);

create index if not exists teams_partido_convocados_jugador_idx
  on teams.partido_convocados using btree (jugador_id);

create table if not exists teams.partido_tomas (
  partido_id bigint not null references teams.partidos_intrapartido(id) on delete cascade,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  momento text not null check (momento in ('llegada', 'calentamiento', 'salida', 'pausa1', 'descanso', 'pausa2', 'final')),
  producto_id text not null,
  cantidad smallint not null check (cantidad > 0),
  primary key (partido_id, jugador_id, momento, producto_id)
);

-- Seguridad: igual que el resto de tablas del schema (ver security_hardening).
-- La app solo accede con service_role, que ignora RLS.
alter table teams.partidos_intrapartido enable row level security;
alter table teams.partido_convocados enable row level security;
alter table teams.partido_tomas enable row level security;

-- Guardado atómico: crea o actualiza el partido y reemplaza convocatoria y tomas
-- en una única transacción.
--   p_convocados: [{ "jugador_id": 1, "titular": true }, ...]
--   p_tomas:      [{ "jugador_id": 1, "momento": "salida", "producto_id": "agua-250", "cantidad": 2 }, ...]
create or replace function teams.guardar_intrapartido(
  p_partido_id bigint,
  p_equipo_id bigint,
  p_rival text,
  p_competicion text,
  p_lugar text,
  p_fecha date,
  p_created_by text,
  p_convocados jsonb,
  p_tomas jsonb
) returns bigint
language plpgsql
security invoker
set search_path = teams, public
as $$
declare
  v_id bigint;
begin
  if p_partido_id is null then
    insert into partidos_intrapartido (equipo_id, rival, competicion, lugar, fecha, created_by)
    values (p_equipo_id, p_rival, p_competicion, p_lugar, p_fecha, p_created_by)
    returning id into v_id;
  else
    update partidos_intrapartido
       set rival = p_rival,
           competicion = p_competicion,
           lugar = p_lugar,
           fecha = p_fecha,
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

revoke all on function teams.guardar_intrapartido(bigint, bigint, text, text, text, date, text, jsonb, jsonb) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function teams.guardar_intrapartido(bigint, bigint, text, text, text, date, text, jsonb, jsonb) to service_role;
  end if;
end
$$;
