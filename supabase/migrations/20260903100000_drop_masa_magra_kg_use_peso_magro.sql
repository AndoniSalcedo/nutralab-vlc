-- Consolidación de masa libre de grasa en peso_magro y eliminación de masa_magra_kg

-- 1. Asegurar que peso_magro está calculado con precisión matemática en todos los registros
update teams.evoluciones
set peso_magro = coalesce(
  case
    when peso_kg is not null and porcentaje_grasa is not null
      then round((peso_kg * (1 - porcentaje_grasa / 100))::numeric, 2)::double precision
    else null
  end,
  peso_magro,
  masa_magra_kg
);

-- 2. Eliminar la columna duplicada masa_magra_kg
alter table teams.evoluciones
  drop column if exists masa_magra_kg;

-- 3. Notificar a PostgREST para recargar el esquema
notify pgrst, 'reload schema';
