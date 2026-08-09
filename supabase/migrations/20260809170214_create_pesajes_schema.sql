create table if not exists teams.pesajes (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  fecha date not null,
  peso_kg double precision not null,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (jugador_id, fecha)
);

create index if not exists teams_pesajes_jugador_id_idx
  on teams.pesajes (jugador_id);

grant usage on schema teams to anon, authenticated, service_role;
grant all on all tables in schema teams to anon, authenticated, service_role;
grant all on all sequences in schema teams to anon, authenticated, service_role;

-- Migrate data from evoluciones to pesajes
-- Only measurements that have peso_kg and ALL OTHER metrics as null
with weight_only as (
  select id, jugador_id, fecha, peso_kg
  from teams.evoluciones
  where peso_kg is not null
    and altura_cm is null
    and porcentaje_grasa is null
    and masa_magra_kg is null
    and pliegue_biceps is null
    and pliegue_triceps is null
    and pliegue_subescapular is null
    and pliegue_cresta_iliaca is null
    and pliegue_supraeliaco is null
    and pliegue_abdominal is null
    and pliegue_pantorrilla is null
    and pliegue_muslo is null
    and suma_6_pliegues is null
    and suma_8_pliegues is null
    and porcentaje_grasa_faulkner is null
    and porcentaje_grasa_yuhasz is null
    and peso_oseo is null
    and peso_residual is null
    and peso_graso is null
    and peso_muscular is null
    and peso_magro is null
    and peso_deseable is null
    and endomorfia is null
    and mesomorfia is null
    and ectomorfia is null
    and perimetro_brazo_contraido is null
    and perimetro_pantorrilla_derecha is null
    and perimetro_pantorrilla_izquierda is null
    and perimetro_muslo_derecho is null
    and perimetro_muslo_izquierdo is null
    and perimetro_pantorrilla is null
    and perimetro_muslo is null
    and (notas is null or notas = '')
)
insert into teams.pesajes (jugador_id, fecha, peso_kg)
select jugador_id, fecha, peso_kg
from weight_only
on conflict (jugador_id, fecha) do update set peso_kg = excluded.peso_kg;

-- Delete the migrated records from evoluciones
delete from teams.evoluciones
where id in (
  select id from teams.evoluciones
  where peso_kg is not null
    and altura_cm is null
    and porcentaje_grasa is null
    and masa_magra_kg is null
    and pliegue_biceps is null
    and pliegue_triceps is null
    and pliegue_subescapular is null
    and pliegue_cresta_iliaca is null
    and pliegue_supraeliaco is null
    and pliegue_abdominal is null
    and pliegue_pantorrilla is null
    and pliegue_muslo is null
    and suma_6_pliegues is null
    and suma_8_pliegues is null
    and porcentaje_grasa_faulkner is null
    and porcentaje_grasa_yuhasz is null
    and peso_oseo is null
    and peso_residual is null
    and peso_graso is null
    and peso_muscular is null
    and peso_magro is null
    and peso_deseable is null
    and endomorfia is null
    and mesomorfia is null
    and ectomorfia is null
    and perimetro_brazo_contraido is null
    and perimetro_pantorrilla_derecha is null
    and perimetro_pantorrilla_izquierda is null
    and perimetro_muslo_derecho is null
    and perimetro_muslo_izquierdo is null
    and perimetro_pantorrilla is null
    and perimetro_muslo is null
    and (notas is null or notas = '')
);

notify pgrst, 'reload schema';
