create table if not exists teams.jugador_suplementacion_historial (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  lista_id bigint references teams.suplementacion_listas(id) on delete set null,
  created_at timestamptz default now()
);

create or replace function teams.log_suplementacion_history()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') or (TG_OP = 'UPDATE' and new.lista_id is distinct from old.lista_id) then
    insert into teams.jugador_suplementacion_historial (jugador_id, lista_id)
    values (new.jugador_id, new.lista_id);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_log_suplementacion_history on teams.jugador_suplementacion;
create trigger trigger_log_suplementacion_history
  after insert or update on teams.jugador_suplementacion
  for each row
  execute function teams.log_suplementacion_history();

grant all on teams.jugador_suplementacion_historial to anon, authenticated, service_role;
grant all on all sequences in schema teams to anon, authenticated, service_role;

notify pgrst, 'reload schema';
