ALTER TABLE teams.jugadores
  ALTER COLUMN porcentaje_grasa_objetivo SET DEFAULT 10;

UPDATE teams.jugadores
  SET porcentaje_grasa_objetivo = 10
  WHERE porcentaje_grasa_objetivo = 8 OR porcentaje_grasa_objetivo IS NULL;

NOTIFY pgrst, 'reload schema';
