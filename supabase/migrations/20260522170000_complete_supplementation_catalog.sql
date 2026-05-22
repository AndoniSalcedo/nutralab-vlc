insert into teams.suplementos
  (slug, nombre, categoria, descripcion, pauta, timing, dose_type, dose_unit, dose_min, dose_max, dose_text, notas)
values
  ('taurina', 'Taurina', 'Entrenamiento', 'Interesante para estrés térmico y función muscular.', '1-3 g/día o 2-6 g pre.', 'Diario o pre-entreno', 'fixed', 'g', 1, 3, '1-3 g/día o 2-6 g pre', 'Valorar especialmente en calor o sesiones demandantes.'),
  ('carbohidratos-intra', 'Carbohidratos intra', 'Matchday', 'Aporte intraesfuerzo; hasta 90 g/h en jugadores entrenados gastrointestinalmente.', '30-60 g/h.', 'Durante partido o sesión larga', 'fixed', 'g', 30, 60, '30-60 g/h', 'Hasta 90 g/h si hay entrenamiento gastrointestinal.'),
  ('stack-nocturno', 'Stack nocturno habitual', 'Sueño', 'Combinación nocturna habitual para descanso y recuperación.', 'Magnesio + caseína + tart cherry + ashwagandha.', 'Pre sueño', 'custom', null, null, null, 'Magnesio + caseína + tart cherry + ashwagandha', 'Usar cuando encaje con el contexto de sueño, viajes o estrés.')
on conflict (slug) do update set
  nombre = excluded.nombre,
  categoria = excluded.categoria,
  descripcion = excluded.descripcion,
  pauta = excluded.pauta,
  timing = excluded.timing,
  dose_type = excluded.dose_type,
  dose_unit = excluded.dose_unit,
  dose_min = excluded.dose_min,
  dose_max = excluded.dose_max,
  dose_text = excluded.dose_text,
  notas = excluded.notas,
  updated_at = now();

notify pgrst, 'reload schema';
