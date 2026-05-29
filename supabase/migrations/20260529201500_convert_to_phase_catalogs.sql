-- First delete monthly lists
delete from teams.suplementacion_listas where slug in ('julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre', 'enero', 'febrero', 'marzo', 'abril');

-- Then insert the phase lists
insert into teams.suplementacion_listas (slug, nombre, orden, descripcion)
values
  ('base-del-dia-a-dia', 'Base del día a día', 1, 'Suplementación de base diaria'),
  ('entrenamiento', 'Entrenamiento', 2, 'Suplementación enfocada al entrenamiento'),
  ('matchday', 'Matchday', 3, 'Suplementación de día de partido'),
  ('post-partido', 'Post partido', 4, 'Suplementación post partido'),
  ('lesiones-y-rtp', 'Lesiones y RTP', 5, 'Suplementación para lesiones y Return To Play'),
  ('sueno-viajes-y-estres', 'Sueño, viajes y estrés', 6, 'Suplementación para descanso, jet lag o estrés'),
  ('general', 'General', 7, 'Suplementación general')
on conflict (slug) do update set
  nombre = excluded.nombre,
  orden = excluded.orden,
  descripcion = excluded.descripcion,
  updated_at = now();

with planned(lista_slug, suplemento_slug, orden) as (
  values
    -- Base del día a día
    ('base-del-dia-a-dia', 'creatina', 1),
    ('base-del-dia-a-dia', 'omega-3', 2),
    ('base-del-dia-a-dia', 'vitamina-d', 3),
    ('base-del-dia-a-dia', 'magnesio', 4),
    ('base-del-dia-a-dia', 'turmeric', 5),
    ('base-del-dia-a-dia', 'ashwagandha', 6),

    -- Entrenamiento
    ('entrenamiento', 'cafeina', 1),
    ('entrenamiento', 'beta-alanina', 2),
    ('entrenamiento', 'nitratos', 3),
    ('entrenamiento', 'taurina', 4),

    -- Matchday
    ('matchday', 'carbohidratos-intra', 1),
    ('matchday', 'sodio-electrolitos', 2),
    ('matchday', 'mentol', 3),

    -- Post partido
    ('post-partido', 'proteina-whey', 1),
    ('post-partido', 'caseina', 2),
    ('post-partido', 'tart-cherry', 3),
    ('post-partido', 'doms', 4),

    -- Lesiones y RTP
    ('lesiones-y-rtp', 'colageno-vit-c', 1),
    ('lesiones-y-rtp', 'creatina', 2),
    ('lesiones-y-rtp', 'omega-3', 3),
    ('lesiones-y-rtp', 'turmeric', 4),
    ('lesiones-y-rtp', 'hmb', 5),

    -- Sueño, viajes y estrés
    ('sueno-viajes-y-estres', 'melatonina', 1),
    ('sueno-viajes-y-estres', 'stack-nocturno', 2),

    -- General
    ('general', 'creatina', 1),
    ('general', 'cafeina', 2),
    ('general', 'sodio-electrolitos', 3),
    ('general', 'proteina-whey', 4),
    ('general', 'omega-3', 5),
    ('general', 'vitamina-d', 6),
    ('general', 'nitratos', 7),
    ('general', 'taurina', 8),
    ('general', 'turmeric', 9),
    ('general', 'colageno-vit-c', 10),
    ('general', 'tart-cherry', 11),
    ('general', 'ashwagandha', 12)
)
insert into teams.suplementacion_lista_items (lista_id, suplemento_id, orden)
select l.id, s.id, p.orden
from planned p
join teams.suplementacion_listas l on l.slug = p.lista_slug
join teams.suplementos s on s.slug = p.suplemento_slug
on conflict (lista_id, suplemento_id) do update set
  orden = excluded.orden;
