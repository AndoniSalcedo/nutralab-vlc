alter table teams.planes_ia
  add column if not exists datos jsonb;

notify pgrst, 'reload schema';
