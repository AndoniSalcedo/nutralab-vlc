-- Añadir la columna visible_para_jugador a la tabla analiticas
ALTER TABLE teams.analiticas ADD COLUMN visible_para_jugador BOOLEAN DEFAULT false;
