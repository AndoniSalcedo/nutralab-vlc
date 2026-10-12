-- Migration: aviso único al jugador con el resumen de su control intrapartido
-- visto_at se rellena la primera vez que el jugador cierra el aviso; null = aún no lo ha visto.
-- Los controles ya existentes se marcan como vistos para no avisar de partidos antiguos.

alter table teams.partido_convocados
  add column if not exists visto_at timestamptz;

update teams.partido_convocados set visto_at = now() where visto_at is null;
