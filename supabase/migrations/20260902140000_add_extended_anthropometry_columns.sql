-- 1. Añadir columnas antropométricas extendidas a teams.evoluciones
alter table teams.evoluciones
  add column if not exists perimetro_brazo_relajado double precision,
  add column if not exists perimetro_antebrazo double precision,
  add column if not exists perimetro_muneca double precision,
  add column if not exists diametro_humero double precision,
  add column if not exists diametro_femur double precision,
  add column if not exists diametro_muneca double precision,
  add column if not exists somatocarta_x double precision,
  add column if not exists somatocarta_y double precision,
  add column if not exists indice_ponderal double precision;

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

-- 3. Poblar los registros históricos existentes desde metricas_excel
update teams.evoluciones
set
  perimetro_brazo_relajado = coalesce(
    perimetro_brazo_relajado,
    pg_temp.excel_metric_number(metricas_excel ->> 'Perímetro Brazo Relajado Derecho'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Perimetro Brazo Relajado Derecho'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Perímetro Brazo Relajado'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Perimetro Brazo Relajado')
  ),
  perimetro_antebrazo = coalesce(
    perimetro_antebrazo,
    pg_temp.excel_metric_number(metricas_excel ->> 'Perímetro Antebrazo'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Perimetro Antebrazo')
  ),
  perimetro_muneca = coalesce(
    perimetro_muneca,
    pg_temp.excel_metric_number(metricas_excel ->> 'Perímetro Muñeca'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Perimetro Muñeca')
  ),
  diametro_humero = coalesce(
    diametro_humero,
    pg_temp.excel_metric_number(metricas_excel ->> 'Máx. de DH'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Max. de DH'),
    case
      when pg_temp.excel_metric_number(metricas_excel ->> 'DH*10') is not null
        then pg_temp.excel_metric_number(metricas_excel ->> 'DH*10') / 10.0
      else null
    end
  ),
  diametro_femur = coalesce(
    diametro_femur,
    pg_temp.excel_metric_number(metricas_excel ->> 'Máx. de DF'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Max. de DF'),
    case
      when pg_temp.excel_metric_number(metricas_excel ->> 'DF*10') is not null
        then pg_temp.excel_metric_number(metricas_excel ->> 'DF*10') / 10.0
      else null
    end
  ),
  diametro_muneca = coalesce(
    diametro_muneca,
    pg_temp.excel_metric_number(metricas_excel ->> 'Máx. de DE'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Max. de DE')
  ),
  somatocarta_x = coalesce(
    somatocarta_x,
    pg_temp.excel_metric_number(metricas_excel ->> 'EJE X'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Eje X')
  ),
  somatocarta_y = coalesce(
    somatocarta_y,
    pg_temp.excel_metric_number(metricas_excel ->> 'EJE Y'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Eje Y')
  ),
  indice_ponderal = coalesce(
    indice_ponderal,
    pg_temp.excel_metric_number(metricas_excel ->> 'IP'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Indice Ponderal')
  );

-- 4. Asegurar que peso_graso está calculado en todos los registros donde existan peso y % grasa
update teams.evoluciones
set
  peso_graso = round((peso_kg * (porcentaje_grasa / 100))::numeric, 2)::double precision
where peso_graso is null and peso_kg is not null and porcentaje_grasa is not null;

notify pgrst, 'reload schema';
