-- 1. Añadir columna tipada porcentaje_musculo en teams.evoluciones
alter table teams.evoluciones
  add column if not exists porcentaje_musculo double precision;

-- 2. Función temporal para extraer números de texto/json
create or replace function pg_temp.excel_metric_number(value text)
returns double precision
language sql
immutable
as $$
  select case
    when nullif(replace(trim(value), ',', '.'), '') ~ '^-?[0-9]+(\.[0-9]+)?$'
      then replace(trim(value), ',', '.')::double precision
    else null
  end
$$;

-- 3. Poblar porcentaje_musculo a partir de metricas_excel ('%Peso Muscular Lee&cols') o cálculo (peso_muscular / peso_kg * 100)
update teams.evoluciones
set
  porcentaje_musculo = coalesce(
    porcentaje_musculo,
    pg_temp.excel_metric_number(metricas_excel ->> '%Peso Muscular Lee&cols'),
    pg_temp.excel_metric_number(metricas_excel ->> '% Peso Muscular Lee&cols'),
    case
      when peso_muscular is not null and peso_kg is not null and peso_kg > 0
        then round(((peso_muscular / peso_kg) * 100)::numeric, 2)::double precision
      else null
    end
  )
where porcentaje_musculo is null;

-- 4. Asegurar que las columnas laterales derecha/izquierda tienen datos de las legacy antes de eliminarlas
update teams.evoluciones
set
  perimetro_pantorrilla_derecha = coalesce(perimetro_pantorrilla_derecha, perimetro_pantorrilla),
  perimetro_muslo_derecho = coalesce(perimetro_muslo_derecho, perimetro_muslo)
where perimetro_pantorrilla_derecha is null or perimetro_muslo_derecho is null;

-- 5. Eliminar definitivamente las columnas legacy perimetro_muslo y perimetro_pantorrilla
alter table teams.evoluciones
  drop column if exists perimetro_muslo,
  drop column if exists perimetro_pantorrilla;

notify pgrst, 'reload schema';
