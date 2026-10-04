-- Migration: el objetivo de un jugador siempre es uno de los cinco válidos; por defecto, mejora_rendimiento.
-- Corrige los jugadores sin objetivo o con un valor que no es una clave válida y fija el valor por defecto.

update teams.jugadores
set objetivo = 'mejora_rendimiento'
where objetivo is null
   or objetivo not in ('perdida_grasa', 'perdida_peso', 'ganancia_musculo', 'mejora_condicion', 'mejora_rendimiento');

alter table teams.jugadores alter column objetivo set default 'mejora_rendimiento';
