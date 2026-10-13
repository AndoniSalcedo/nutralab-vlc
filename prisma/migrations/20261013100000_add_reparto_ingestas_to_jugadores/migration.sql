-- Migration: reparto de kcal por ingesta del jugador ({ "Desayuno": 20, "Comida": 40, ... } en %, suman 100).
-- Se rellena para los jugadores existentes con `npm run meals:distribution:sync -- --write` (reparto por defecto
-- según sus tomas); la app lo mantiene al crear jugadores y al cambiar sus tomas.

alter table teams.jugadores
  add column if not exists reparto_ingestas jsonb;
