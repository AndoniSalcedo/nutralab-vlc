-- Eliminar columna obsoleta de deseleccionados
ALTER TABLE teams.jugador_suplementacion
DROP COLUMN IF EXISTS suplementos_deseleccionados;
