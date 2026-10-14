-- Migration: índices para claves foráneas sin indexar.
-- Postgres no indexa las FK: las consultas por jugador del historial de suplementación
-- y los borrados en cascada (jugador, suplemento, lista) recorrían la tabla entera.
-- PREPARADA, NO APLICADA. Aplicar con: npm run db:migrate

create index if not exists teams_jugador_suplementacion_historial_jugador_id_idx
  on teams.jugador_suplementacion_historial (jugador_id);

create index if not exists teams_jugador_suplementacion_historial_lista_id_idx
  on teams.jugador_suplementacion_historial (lista_id);

create index if not exists teams_jugador_suplementacion_lista_id_idx
  on teams.jugador_suplementacion (lista_id);

create index if not exists teams_jugador_suplementos_extra_suplemento_id_idx
  on teams.jugador_suplementos_extra (suplemento_id);

create index if not exists teams_suplementacion_lista_items_suplemento_id_idx
  on teams.suplementacion_lista_items (suplemento_id);

create index if not exists teams_partido_tomas_jugador_id_idx
  on teams.partido_tomas (jugador_id);
