alter table teams.jugadores
  add column if not exists auth_email text,
  add column if not exists credentials_created_at timestamptz;

create unique index if not exists teams_jugadores_auth_email_idx
  on teams.jugadores (lower(auth_email))
  where auth_email is not null;

notify pgrst, 'reload schema';
