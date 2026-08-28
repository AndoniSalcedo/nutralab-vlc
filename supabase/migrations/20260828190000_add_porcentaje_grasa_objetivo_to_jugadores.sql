ALTER TABLE teams.jugadores
  ADD COLUMN IF NOT EXISTS porcentaje_grasa_objetivo double precision DEFAULT 10;

NOTIFY pgrst, 'reload schema';
