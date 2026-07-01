-- Clean up existing menus to prevent orphaned records or constraint violations
TRUNCATE TABLE teams.menu_semanal RESTART IDENTITY CASCADE;

-- Add equipo_id column referencing teams.equipos(id) on delete cascade
ALTER TABLE teams.menu_semanal 
  ADD COLUMN IF NOT EXISTS equipo_id bigint NOT NULL REFERENCES teams.equipos(id) ON DELETE CASCADE;

-- Drop the old unique constraint on semana
ALTER TABLE teams.menu_semanal 
  DROP CONSTRAINT IF EXISTS menu_semanal_semana_key;

-- Add a unique constraint on (semana, equipo_id)
ALTER TABLE teams.menu_semanal 
  ADD CONSTRAINT menu_semanal_semana_equipo_unique UNIQUE (semana, equipo_id);

-- Create index on equipo_id
CREATE INDEX IF NOT EXISTS teams_menu_semanal_equipo_id_idx ON teams.menu_semanal (equipo_id);
