update teams.registros_hidratacion
set tipo = 'sosm'
where tipo is null or btrim(tipo) = '';

alter table teams.registros_hidratacion
  alter column tipo set default 'sosm',
  alter column tipo set not null;

alter table teams.registros_hidratacion
  drop constraint if exists registros_hidratacion_jugador_id_fecha_key;

alter table teams.registros_hidratacion
  add constraint registros_hidratacion_jugador_id_fecha_tipo_key
  unique (jugador_id, fecha, tipo);

drop index if exists teams_registros_hidratacion_jugador_fecha_idx;

create index if not exists teams_registros_hidratacion_jugador_fecha_tipo_idx
  on teams.registros_hidratacion (jugador_id, fecha, tipo);

notify pgrst, 'reload schema';
