-- Migration: los metadatos del informe semanal (portada del PDF) pasan a vivir en cada plan
-- (planes_ia.datos.meta.informe) en vez de en teams.informes_semanales.
--
-- Cada plan se enlaza con el informe de su equipo y semana. La semana se toma de
-- datos.meta.semanaMenu o, si no existe, del lunes de datos.meta.fecha / created_at.
-- calendario, preMatchConfig, semanaMenu y semana ya viven en el propio plan y no se copian.

do $$
declare
  updated_count integer;
begin
  update teams.planes_ia p
  set datos = jsonb_set(
    p.datos,
    '{meta}',
    coalesce(p.datos->'meta', '{}'::jsonb)
      || jsonb_build_object(
        'informe',
        i.meta - 'calendario' - 'preMatchConfig' - 'semanaMenu' - 'semana'
      )
  )
  from teams.jugadores j, teams.informes_semanales i
  where j.id = p.jugador_id
    and i.equipo_id = j.equipo_id
    and jsonb_typeof(p.datos) = 'object'
    and not (coalesce(p.datos->'meta', '{}'::jsonb) ? 'informe')
    and i.semana = case
      when p.datos->'meta'->>'semanaMenu' ~ '^\d{4}-\d{2}-\d{2}$'
        then (p.datos->'meta'->>'semanaMenu')::date
      else date_trunc(
        'week',
        coalesce((p.datos->'meta'->>'fecha')::timestamptz, p.created_at)
      )::date
    end;

  get diagnostics updated_count = row_count;
  raise notice 'planes_ia con metadatos de informe copiados: %', updated_count;
end $$;
