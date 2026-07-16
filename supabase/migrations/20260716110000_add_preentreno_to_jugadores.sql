alter table teams.jugadores
  add column if not exists preentreno boolean default false;

notify pgrst, 'reload schema';
