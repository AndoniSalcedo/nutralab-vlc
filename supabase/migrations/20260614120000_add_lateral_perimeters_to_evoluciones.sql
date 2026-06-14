alter table teams.evoluciones
  add column if not exists perimetro_pantorrilla_derecha double precision,
  add column if not exists perimetro_pantorrilla_izquierda double precision,
  add column if not exists perimetro_muslo_derecho double precision,
  add column if not exists perimetro_muslo_izquierdo double precision;

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

update teams.evoluciones
set
  perimetro_pantorrilla_derecha = coalesce(
    perimetro_pantorrilla_derecha,
    perimetro_pantorrilla,
    pg_temp.excel_metric_number(metricas_excel ->> 'Perímetro Pantorrilla Derecha'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Perimetro Pantorrilla Derecha')
  ),
  perimetro_pantorrilla_izquierda = coalesce(
    perimetro_pantorrilla_izquierda,
    pg_temp.excel_metric_number(metricas_excel ->> 'Perímetro Pantorrilla Izquierda'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Perimetro Pantorrilla Izquierda')
  ),
  perimetro_muslo_derecho = coalesce(
    perimetro_muslo_derecho,
    perimetro_muslo,
    pg_temp.excel_metric_number(metricas_excel ->> 'Perímetro Muslo Derecho'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Perimetro Muslo Derecho')
  ),
  perimetro_muslo_izquierdo = coalesce(
    perimetro_muslo_izquierdo,
    pg_temp.excel_metric_number(metricas_excel ->> 'Perímetro Muslo Izquierdo'),
    pg_temp.excel_metric_number(metricas_excel ->> 'Perimetro Muslo Izquierdo')
  )
where
  perimetro_pantorrilla_derecha is null
  or perimetro_pantorrilla_izquierda is null
  or perimetro_muslo_derecho is null
  or perimetro_muslo_izquierdo is null;

notify pgrst, 'reload schema';
