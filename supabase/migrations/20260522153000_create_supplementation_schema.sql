create table if not exists teams.suplementos (
  id bigserial primary key,
  slug text not null unique,
  nombre text not null,
  categoria text,
  descripcion text,
  pauta text,
  timing text,
  dose_type text not null default 'fixed',
  dose_unit text,
  dose_min double precision,
  dose_max double precision,
  dose_text text,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists teams.suplementacion_listas (
  id bigserial primary key,
  slug text not null unique,
  nombre text not null,
  orden integer not null,
  descripcion text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists teams.suplementacion_lista_items (
  id bigserial primary key,
  lista_id bigint not null references teams.suplementacion_listas(id) on delete cascade,
  suplemento_id bigint not null references teams.suplementos(id) on delete cascade,
  orden integer not null default 0,
  notas text,
  created_at timestamptz default now(),
  unique (lista_id, suplemento_id)
);

create table if not exists teams.jugador_suplementacion (
  jugador_id bigint primary key references teams.jugadores(id) on delete cascade,
  lista_id bigint references teams.suplementacion_listas(id) on delete set null,
  notas text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists teams.jugador_suplementos_extra (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  suplemento_id bigint not null references teams.suplementos(id) on delete cascade,
  dose_override text,
  timing_override text,
  note_override text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (jugador_id, suplemento_id)
);

create index if not exists teams_suplementacion_lista_items_lista_id_idx
  on teams.suplementacion_lista_items (lista_id);

create index if not exists teams_jugador_suplementos_extra_jugador_id_idx
  on teams.jugador_suplementos_extra (jugador_id);

insert into teams.suplementos
  (slug, nombre, categoria, descripcion, pauta, timing, dose_type, dose_unit, dose_min, dose_max, dose_text, notas)
values
  ('creatina', 'Creatina', 'Base', 'Soporte para potencia, sprint repetido, fuerza y recuperación neuromuscular.', '3-5 g/día.', 'Post-entreno o con comida', 'fixed', 'g', 3, 5, '3-5 g/día', 'Mantener constancia diaria.'),
  ('cafeina', 'Cafeína', 'Rendimiento', 'Mejora atención, sprint y potencia en sesiones clave o partido.', '1-6 mg/kg.', '45-60 min pre-entreno o partido', 'per_kg_range', 'mg', 1, 6, '1-6 mg/kg', 'Ajustar por tolerancia individual.'),
  ('beta-alanina', 'B-alanina', 'Rendimiento', 'Mejora la capacidad de alta intensidad en bloques de carga.', '4-6.4 g/día durante 4-8 semanas.', 'Diario, dividido en tomas', 'fixed', 'g', 4, 6.4, '4-6.4 g/día', 'Dividir tomas para reducir parestesias.'),
  ('nitratos', 'Nitratos', 'Rendimiento', 'Apoyo a economía de esfuerzo y flujo sanguíneo.', '400-800 mg de nitratos.', '2-3 h pre', 'fixed', 'mg', 400, 800, '400-800 mg', 'Probar en entrenamiento antes de competir.'),
  ('sodio-electrolitos', 'Sodio/electrolitos', 'Hidratación', 'Reposición de sodio según pérdidas individuales.', '300-1000+ mg sodio/h.', 'Durante entrenamiento o partido', 'fixed', 'mg', 300, 1000, '300-1000+ mg sodio/h', 'Ajustar por sudoración, calor y duración.'),
  ('mentol', 'Mentol', 'Termorregulación', 'Cooling perceptivo mediante mouth rinse o bebidas frías.', 'Mouth rinse o bebida fría.', 'Antes o durante calor', 'custom', null, null, null, 'Mouth rinse o bebida fría', 'Usar en escenarios de calor.'),
  ('proteina-whey', 'Proteína whey', 'Recuperación', 'Apoyo a recuperación muscular post partido o post sesión.', '20-40 g.', 'Post partido o post entreno', 'fixed', 'g', 20, 40, '20-40 g', null),
  ('caseina', 'Caseína', 'Recuperación', 'Apoyo a síntesis proteica nocturna.', '30-40 g.', 'Pre sueño', 'fixed', 'g', 30, 40, '30-40 g', null),
  ('tart-cherry', 'Tart Cherry', 'Recuperación', 'Apoyo para DOMS y sueño en semanas de carga.', '30-60 ml concentrado 2 veces/día.', 'Mañana y noche', 'fixed', 'ml', 30, 60, '30-60 ml 2 veces/día', null),
  ('doms', 'DOMS', 'Recuperación', 'Fórmulas para semanas congestionadas y periodos de alta carga.', 'Según producto.', 'Según carga', 'custom', null, null, null, 'Según producto', 'Personalizar producto y dosis.'),
  ('colageno-vit-c', 'Colágeno + vitamina C', 'Lesión', 'Apoyo en tendón, tejido conectivo y return to play.', '10-15 g colágeno + 50-200 mg vitamina C.', 'Antes de rehab', 'fixed', 'g', 10, 15, '10-15 g + 50-200 mg vitamina C', null),
  ('omega-3', 'Omega 3', 'Base', 'Soporte inflamatorio, recuperación y salud cerebral.', '1-3 g/día EPA+DHA.', 'Con comidas grasas', 'fixed', 'g', 1, 3, '1-3 g/día EPA+DHA', 'Valorar ingesta de pescado azul.'),
  ('vitamina-d', 'Vitamina D', 'Base', 'Apoyo a función muscular e inmunidad.', '1000-4000 IU/día según analítica.', 'Con comida grasa', 'fixed', 'IU', 1000, 4000, '1000-4000 IU/día', 'Cruzar con analítica y exposición solar.'),
  ('magnesio', 'Magnesio', 'Base', 'Apoyo a descanso, recuperación y función muscular.', '200-400 mg/día elemental.', 'Preferible por la noche', 'fixed', 'mg', 200, 400, '200-400 mg/día elemental', 'Formas: bisglicinato, citrato o malato.'),
  ('turmeric', 'Turmeric/Curcumina', 'Recuperación', 'Apoyo para DOMS, recuperación y dolor articular.', '500-2000 mg/día de curcuminoides.', 'Con comida', 'fixed', 'mg', 500, 2000, '500-2000 mg/día', null),
  ('ashwagandha', 'Ashwagandha', 'Estrés y sueño', 'Apoyo para estrés, sueño y recuperación.', '300-600 mg/día.', 'Tarde/noche o según tolerancia', 'fixed', 'mg', 300, 600, '300-600 mg/día', null),
  ('hmb', 'HMB', 'Lesión', 'Más útil en lesión, inmovilización o pérdida muscular.', '3 g/día.', 'Diario', 'fixed', 'g', 3, 3, '3 g/día', null),
  ('melatonina', 'Melatonina', 'Sueño', 'Apoyo para jet lag e inicio del sueño.', '0.5-5 mg.', 'Pre sueño', 'fixed', 'mg', 0.5, 5, '0.5-5 mg', null),
  ('vit-c-mg-zinc', 'Vit C + Mg + Zinc', 'Micronutrientes', 'Combinación de micronutrientes de apoyo general.', 'Según producto.', 'Diario', 'custom', null, null, null, 'Según producto', 'Completar pauta exacta del producto.'),
  ('100-vit', '100 - VIT', 'Micronutrientes', 'Producto multivitamínico de apoyo puntual.', 'Según producto.', 'Diario', 'custom', null, null, null, 'Según producto', 'Completar pauta exacta del producto.'),
  ('multivitaminico', 'Multivitamínico', 'Micronutrientes', 'Apoyo general cuando la pauta alimentaria lo requiera.', 'Según producto.', 'Con comida', 'custom', null, null, null, 'Según producto', 'Completar pauta exacta del producto.'),
  ('lip-glunol', 'Lip Glunol', 'Custom', 'Suplemento incluido en planificación mensual.', 'Según producto.', 'Según pauta', 'custom', null, null, null, 'Según producto', 'Completar descripción y pauta exacta.'),
  ('glutamina', 'Glutamina', 'Recuperación', 'Apoyo digestivo/recuperación según contexto individual.', 'Según producto.', 'Según pauta', 'custom', null, null, null, 'Según producto', 'Personalizar según objetivo.'),
  ('prebioticos', 'Prebióticos', 'Digestivo', 'Apoyo digestivo dentro de la periodización.', 'Según producto.', 'Con comida', 'custom', null, null, null, 'Según producto', 'Personalizar producto y tolerancia.'),
  ('malato-citrulina', 'Malato citrulina', 'Rendimiento', 'Apoyo a rendimiento en sesiones de alta intensidad.', 'Según producto.', 'Pre-entreno', 'custom', null, null, null, 'Según producto', 'Completar pauta exacta.'),
  ('valeriano', 'Valeriano', 'Sueño', 'Apoyo puntual al descanso.', 'Según producto.', 'Pre sueño', 'custom', null, null, null, 'Según producto', 'Valorar somnolencia residual.')
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

insert into teams.suplementacion_listas (slug, nombre, orden, descripcion)
values
  ('julio', 'Julio', 7, 'Lista mensual de julio'),
  ('agosto', 'Agosto', 8, 'Lista mensual de agosto'),
  ('septiembre', 'Septiembre', 9, 'Lista mensual de septiembre'),
  ('octubre', 'Octubre', 10, 'Lista mensual de octubre'),
  ('noviembre', 'Noviembre', 11, 'Lista mensual de noviembre'),
  ('diciembre', 'Diciembre', 12, 'Lista mensual de diciembre'),
  ('enero', 'Enero', 1, 'Lista mensual de enero'),
  ('febrero', 'Febrero', 2, 'Lista mensual de febrero'),
  ('marzo', 'Marzo', 3, 'Lista mensual de marzo'),
  ('abril', 'Abril', 4, 'Lista mensual de abril')
on conflict (slug) do update set
  nombre = excluded.nombre,
  orden = excluded.orden,
  descripcion = excluded.descripcion,
  updated_at = now();

with planned(lista_slug, suplemento_slug, orden) as (
  values
    ('julio', 'vit-c-mg-zinc', 1), ('julio', 'beta-alanina', 2), ('julio', 'colageno-vit-c', 3), ('julio', 'nitratos', 4), ('julio', 'creatina', 5),
    ('agosto', 'vit-c-mg-zinc', 1), ('agosto', 'omega-3', 2), ('agosto', 'prebioticos', 3), ('agosto', 'nitratos', 4), ('agosto', 'creatina', 5),
    ('septiembre', 'vit-c-mg-zinc', 1), ('septiembre', 'omega-3', 2), ('septiembre', 'lip-glunol', 3), ('septiembre', 'nitratos', 4), ('septiembre', 'creatina', 5),
    ('octubre', 'vit-c-mg-zinc', 1), ('octubre', 'omega-3', 2), ('octubre', 'lip-glunol', 3), ('octubre', 'nitratos', 4), ('octubre', 'creatina', 5),
    ('noviembre', 'vit-c-mg-zinc', 1), ('noviembre', 'omega-3', 2), ('noviembre', 'turmeric', 3), ('noviembre', 'vitamina-d', 4), ('noviembre', 'nitratos', 5), ('noviembre', 'creatina', 6),
    ('diciembre', 'vit-c-mg-zinc', 1), ('diciembre', 'omega-3', 2), ('diciembre', 'turmeric', 3), ('diciembre', 'nitratos', 4), ('diciembre', 'creatina', 5),
    ('enero', 'vit-c-mg-zinc', 1), ('enero', 'omega-3', 2), ('enero', 'ashwagandha', 3), ('enero', 'prebioticos', 4), ('enero', 'nitratos', 5), ('enero', 'creatina', 6),
    ('febrero', 'vit-c-mg-zinc', 1), ('febrero', 'omega-3', 2), ('febrero', '100-vit', 3), ('febrero', 'ashwagandha', 4), ('febrero', 'nitratos', 5), ('febrero', 'creatina', 6),
    ('marzo', 'vit-c-mg-zinc', 1), ('marzo', 'omega-3', 2), ('marzo', '100-vit', 3), ('marzo', 'ashwagandha', 4), ('marzo', 'nitratos', 5), ('marzo', 'creatina', 6),
    ('abril', 'vit-c-mg-zinc', 1), ('abril', 'omega-3', 2), ('abril', 'turmeric', 3), ('abril', 'nitratos', 4), ('abril', 'creatina', 5)
)
insert into teams.suplementacion_lista_items (lista_id, suplemento_id, orden)
select l.id, s.id, p.orden
from planned p
join teams.suplementacion_listas l on l.slug = p.lista_slug
join teams.suplementos s on s.slug = p.suplemento_slug
on conflict (lista_id, suplemento_id) do update set
  orden = excluded.orden;

grant all on teams.suplementos to anon, authenticated, service_role;
grant all on teams.suplementacion_listas to anon, authenticated, service_role;
grant all on teams.suplementacion_lista_items to anon, authenticated, service_role;
grant all on teams.jugador_suplementacion to anon, authenticated, service_role;
grant all on teams.jugador_suplementos_extra to anon, authenticated, service_role;

grant all on all sequences in schema teams to anon, authenticated, service_role;

notify pgrst, 'reload schema';
