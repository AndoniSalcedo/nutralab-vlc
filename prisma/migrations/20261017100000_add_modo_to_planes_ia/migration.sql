-- Migration: modo del plan nutricional ('semana' = lunes a domingo; 'tipos' = opciones por tipo de día).
-- Todos los planes existentes pasan a 'semana', en la columna y en datos.meta.modo.
-- PREPARADA, NO APLICADA. Aplicar con: npm run db:migrate
--
-- Para deshacerla (antes, borrar o convertir los planes 'tipos'):
--   alter table teams.planes_ia drop column if exists modo;
--   update teams.planes_ia set datos = datos #- '{meta,modo}' where datos is not null;

alter table teams.planes_ia
  add column if not exists modo text not null default 'semana';

alter table teams.planes_ia
  add constraint planes_ia_modo_check check (modo in ('semana', 'tipos'));

update teams.planes_ia
  set datos = jsonb_set(datos, '{meta}', coalesce(datos -> 'meta', '{}'::jsonb) || '{"modo": "semana"}'::jsonb)
  where jsonb_typeof(datos) = 'object';

create index if not exists teams_planes_ia_jugador_id_modo_idx
  on teams.planes_ia (jugador_id, modo);
