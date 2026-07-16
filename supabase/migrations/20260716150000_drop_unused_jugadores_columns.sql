ALTER TABLE teams.jugadores 
  DROP COLUMN IF EXISTS club,
  DROP COLUMN IF EXISTS factor_actividad,
  DROP COLUMN IF EXISTS kcal_objetivo,
  DROP COLUMN IF EXISTS cho_objetivo_g,
  DROP COLUMN IF EXISTS proteina_objetivo_g,
  DROP COLUMN IF EXISTS grasa_objetivo_g,
  DROP COLUMN IF EXISTS agua_objetivo_ml;
