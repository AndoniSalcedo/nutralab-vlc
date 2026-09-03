-- ==============================================================================
-- NUTRALAB VLC - BASELINE ESQUEMA V1.0.0
-- Consolidación total de la base de datos para la versión 1.0.0
-- ==============================================================================

create schema if not exists teams;

-- ------------------------------------------------------------------------------
-- Tabla: teams.equipos
-- ------------------------------------------------------------------------------
create table if not exists teams.equipos (
  id bigserial primary key,
  owner_id text not null,
  nombre text not null,
  temporada text not null,
  descripcion text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  configuracion_nutricional jsonb default '{}'::jsonb,
  foto bytea,
  foto_mime text default 'image/webp'::text,
  foto_size integer
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.tecnicos
-- ------------------------------------------------------------------------------
create table if not exists teams.tecnicos (
  id bigserial primary key,
  auth_user_id uuid,
  nombre text not null,
  apellidos text,
  email text not null,
  owner_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  avatar bytea,
  avatar_mime text default 'image/webp'::text,
  avatar_size integer,
  unique (auth_user_id),
  unique (email)
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.tecnico_equipos
-- ------------------------------------------------------------------------------
create table if not exists teams.tecnico_equipos (
  id bigserial primary key,
  tecnico_id bigint not null references teams.tecnicos(id) on delete cascade,
  equipo_id bigint not null references teams.equipos(id) on delete cascade,
  created_at timestamptz default now(),
  unique (tecnico_id, equipo_id)
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.nutricionista_tecnicos
-- ------------------------------------------------------------------------------
create table if not exists teams.nutricionista_tecnicos (
  id bigserial primary key,
  nutricionista_id text not null,
  tecnico_id bigint not null references teams.tecnicos(id) on delete cascade,
  status text default 'accepted'::text not null,
  created_at timestamptz default now(),
  unique (nutricionista_id, tecnico_id)
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.jugadores
-- ------------------------------------------------------------------------------
create table if not exists teams.jugadores (
  id bigserial primary key,
  auth_user_id uuid,
  nombre text not null,
  apellidos text,
  posicion text,
  fecha_nacimiento date,
  num_comidas text,
  objetivo text,
  gustos_preferencias text,
  aversiones text,
  intolerancias text,
  alergias text,
  contexto_clinico text,
  notas_hidratacion text,
  notas_suplementacion text,
  notas_protocolos text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  auth_email text,
  credentials_created_at timestamptz,
  equipo_id bigint references teams.equipos(id) on delete cascade,
  postentreno boolean default false,
  recomendaciones_defecto jsonb default '{}'::jsonb,
  preentreno boolean default false,
  config_prepartido jsonb default '{}'::jsonb,
  avatar bytea,
  avatar_mime text default 'image/webp'::text,
  avatar_size integer,
  porcentaje_grasa_objetivo double precision default 10,
  unique (auth_user_id)
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.evoluciones
-- ------------------------------------------------------------------------------
create table if not exists teams.evoluciones (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  fecha date not null,
  peso_kg double precision,
  porcentaje_grasa double precision,
  suma_6_pliegues double precision,
  notas text,
  created_at timestamptz default now(),
  altura_cm double precision,
  pliegue_biceps double precision,
  pliegue_triceps double precision,
  pliegue_subescapular double precision,
  pliegue_cresta_iliaca double precision,
  pliegue_supraeliaco double precision,
  pliegue_abdominal double precision,
  pliegue_pantorrilla double precision,
  pliegue_muslo double precision,
  suma_8_pliegues double precision,
  porcentaje_grasa_faulkner double precision,
  porcentaje_grasa_yuhasz double precision,
  peso_oseo double precision,
  peso_residual double precision,
  peso_graso double precision,
  peso_muscular double precision,
  peso_magro double precision,
  peso_deseable double precision,
  endomorfia double precision,
  mesomorfia double precision,
  ectomorfia double precision,
  perimetro_brazo_contraido double precision,
  metricas_excel jsonb default '{}'::jsonb not null,
  fuente_hoja text,
  fuente_fila integer,
  fecha_original_excel date,
  fecha_corregida boolean default false not null,
  perimetro_pantorrilla_derecha double precision,
  perimetro_pantorrilla_izquierda double precision,
  perimetro_muslo_derecho double precision,
  perimetro_muslo_izquierdo double precision,
  porcentaje_musculo double precision,
  perimetro_brazo_relajado double precision,
  perimetro_antebrazo double precision,
  perimetro_muneca double precision,
  diametro_humero double precision,
  diametro_femur double precision,
  diametro_muneca double precision,
  somatocarta_x double precision,
  somatocarta_y double precision,
  indice_ponderal double precision,
  unique (jugador_id, fecha)
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.pesajes
-- ------------------------------------------------------------------------------
create table if not exists teams.pesajes (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  fecha date not null,
  peso_kg double precision not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (jugador_id, fecha)
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.comidas
-- ------------------------------------------------------------------------------
create table if not exists teams.comidas (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  taken_at timestamptz default now() not null,
  dish_name text,
  meal_type text not null,
  ingredients text[] default '{}'::text[] not null,
  calories integer,
  notes text,
  photo bytea,
  photo_mime text default 'image/webp'::text,
  photo_size integer,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.analiticas
-- ------------------------------------------------------------------------------
create table if not exists teams.analiticas (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  fecha_extraccion date,
  parametros jsonb default '[]'::jsonb not null,
  pdf_nombre text,
  created_at timestamptz default now(),
  visible_para_jugador boolean default false
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.registros_hidratacion
-- ------------------------------------------------------------------------------
create table if not exists teams.registros_hidratacion (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  fecha date not null,
  hora text,
  tipo text default 'sosm'::text not null,
  valor double precision,
  unidad text,
  estado text,
  notas text,
  cuestionario text,
  created_at timestamptz default now(),
  unique (jugador_id, fecha, tipo)
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.mensajes
-- ------------------------------------------------------------------------------
create table if not exists teams.mensajes (
  id bigserial primary key,
  jugador_id bigint references teams.jugadores(id) on delete cascade,
  titulo text not null,
  contenido text not null,
  created_by text,
  created_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  owner_id text,
  equipo_id bigint references teams.equipos(id) on delete cascade
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.menu_semanal
-- ------------------------------------------------------------------------------
create table if not exists teams.menu_semanal (
  id bigserial primary key,
  semana date not null,
  dias jsonb default '[]'::jsonb not null,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  equipo_id bigint not null references teams.equipos(id) on delete cascade,
  unique (semana, equipo_id)
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.planes_ia
-- ------------------------------------------------------------------------------
create table if not exists teams.planes_ia (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  nombre text not null,
  contexto text,
  contexto_adicional text,
  contenido text default ''::text not null,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  datos jsonb
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.informes_semanales
-- ------------------------------------------------------------------------------
create table if not exists teams.informes_semanales (
  id bigserial primary key,
  equipo_id bigint not null references teams.equipos(id) on delete cascade,
  semana date not null,
  meta jsonb default '{}'::jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (equipo_id, semana)
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.suplementos
-- ------------------------------------------------------------------------------
create table if not exists teams.suplementos (
  id bigserial primary key,
  slug text not null,
  nombre text not null,
  categoria text,
  descripcion text,
  pauta text,
  timing text,
  dose_type text default 'fixed'::text not null,
  dose_unit text,
  dose_min double precision,
  dose_max double precision,
  dose_text text,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (slug)
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.suplementacion_listas
-- ------------------------------------------------------------------------------
create table if not exists teams.suplementacion_listas (
  id bigserial primary key,
  slug text not null,
  nombre text not null,
  orden integer not null,
  descripcion text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (slug)
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.suplementacion_lista_items
-- ------------------------------------------------------------------------------
create table if not exists teams.suplementacion_lista_items (
  id bigserial primary key,
  lista_id bigint not null references teams.suplementacion_listas(id) on delete cascade,
  suplemento_id bigint not null references teams.suplementos(id) on delete cascade,
  orden integer default 0 not null,
  notas text,
  created_at timestamptz default now(),
  unique (lista_id, suplemento_id)
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.jugador_suplementacion
-- ------------------------------------------------------------------------------
create table if not exists teams.jugador_suplementacion (
  jugador_id bigint not null primary key references teams.jugadores(id) on delete cascade,
  lista_id bigint references teams.suplementacion_listas(id) on delete set null,
  notas text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.jugador_suplementacion_historial
-- ------------------------------------------------------------------------------
create table if not exists teams.jugador_suplementacion_historial (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  lista_id bigint references teams.suplementacion_listas(id) on delete set null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- Tabla: teams.jugador_suplementos_extra
-- ------------------------------------------------------------------------------
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

-- ==============================================================================
-- ÍNDICES
-- ==============================================================================

create index if not exists teams_analiticas_jugador_id_idx ON teams.analiticas USING btree (jugador_id);
create index if not exists teams_comidas_jugador_taken_at_idx ON teams.comidas USING btree (jugador_id, taken_at);
create index if not exists teams_equipos_owner_temporada_idx ON teams.equipos USING btree (owner_id, temporada);
create index if not exists teams_evoluciones_jugador_id_idx ON teams.evoluciones USING btree (jugador_id);
create index if not exists teams_informes_semanales_equipo_semana_idx ON teams.informes_semanales USING btree (equipo_id, semana);
create index if not exists teams_jugador_suplementos_extra_jugador_id_idx ON teams.jugador_suplementos_extra USING btree (jugador_id);
create unique index if not exists teams_jugadores_auth_email_idx ON teams.jugadores USING btree (lower(auth_email)) WHERE (auth_email IS NOT NULL);
create index if not exists teams_jugadores_auth_user_id_idx ON teams.jugadores USING btree (auth_user_id);
create index if not exists teams_jugadores_equipo_id_idx ON teams.jugadores USING btree (equipo_id);
create index if not exists teams_mensajes_created_at_idx ON teams.mensajes USING btree (created_at DESC);
create index if not exists teams_mensajes_equipo_id_idx ON teams.mensajes USING btree (equipo_id);
create index if not exists teams_mensajes_jugador_id_idx ON teams.mensajes USING btree (jugador_id);
create unique index if not exists menu_semanal_semana_equipo_unique ON teams.menu_semanal USING btree (semana, equipo_id);
create index if not exists teams_menu_semanal_equipo_id_idx ON teams.menu_semanal USING btree (equipo_id);
create index if not exists teams_nutricionista_tecnicos_nutricionista_id_idx ON teams.nutricionista_tecnicos USING btree (nutricionista_id);
create index if not exists teams_nutricionista_tecnicos_tecnico_id_idx ON teams.nutricionista_tecnicos USING btree (tecnico_id);
create index if not exists teams_pesajes_jugador_id_idx ON teams.pesajes USING btree (jugador_id);
create index if not exists teams_planes_ia_jugador_id_idx ON teams.planes_ia USING btree (jugador_id);
create index if not exists teams_registros_hidratacion_jugador_fecha_idx ON teams.registros_hidratacion USING btree (jugador_id, fecha);
create index if not exists teams_registros_hidratacion_jugador_fecha_tipo_idx ON teams.registros_hidratacion USING btree (jugador_id, fecha, tipo);
create index if not exists teams_suplementacion_lista_items_lista_id_idx ON teams.suplementacion_lista_items USING btree (lista_id);
create index if not exists teams_tecnico_equipos_equipo_id_idx ON teams.tecnico_equipos USING btree (equipo_id);
create index if not exists teams_tecnico_equipos_tecnico_id_idx ON teams.tecnico_equipos USING btree (tecnico_id);
create index if not exists teams_tecnicos_auth_user_id_idx ON teams.tecnicos USING btree (auth_user_id);
create index if not exists teams_tecnicos_owner_id_idx ON teams.tecnicos USING btree (owner_id);

-- ==============================================================================
-- CATÁLOGO INICIAL DE SUPLEMENTACIÓN
-- ==============================================================================

insert into teams.suplementos (slug, nombre, categoria, descripcion, pauta, timing, dose_type, dose_unit, dose_min, dose_max, dose_text, notas)
values
  ('creatina', 'Creatina', 'Base', 'Soporte para potencia, sprint repetido, fuerza y recuperación neuromuscular.', '0.1 g/kg', 'Post-entreno o con comida', 'per_kg_range', 'g', 0.1, 0.1, '0.1 g/kg', 'Mantener constancia diaria.'),
  ('cafeina', 'Cafeína', 'Rendimiento', 'Mejora atención, sprint y potencia en sesiones clave o partido.', '3 mg/kg', '45-60 min pre-entreno o partido', 'per_kg_range', 'mg', 3, 3, '3 mg/kg', 'Ajustar por tolerancia individual.'),
  ('beta-alanina', 'B-alanina', 'Rendimiento', 'Mejora la capacidad de alta intensidad en bloques de carga.', '0.06 g/kg', 'Diario, dividido en tomas', 'per_kg_range', 'g', 0.06, 0.06, '0.06 g/kg', 'Dividir tomas para reducir parestesias.'),
  ('nitratos', 'Nitratos', 'Rendimiento', 'Apoyo a economía de esfuerzo y flujo sanguíneo.', '500 mg de nitratos.', '2-3 h pre', 'custom', null, null, null, '500 mg de nitratos.', 'Probar en entrenamiento antes de competir.'),
  ('sodio-electrolitos', 'Sodio/electrolitos', 'Hidratación', 'Reposición de sodio según pérdidas individuales.', '500 mg/h', 'Durante entrenamiento o partido', 'custom', 'mg', 300, 1000, '500 mg/h', 'Ajustar por sudoración, calor y duración.'),
  ('mentol', 'Mentol', 'Termorregulación', 'Cooling perceptivo mediante mouth rinse o bebidas frías.', 'Mouth rinse o bebida fría.', 'Antes o durante calor', 'custom', null, null, null, 'Mouth rinse o bebida fría', 'Usar en escenarios de calor.'),
  ('proteina-whey', 'Proteína whey', 'Recuperación', 'Apoyo a recuperación muscular post partido o post sesión.', '0.4 g/kg', 'Post partido o post entreno', 'per_kg_range', 'g', 0.4, 0.4, '0.4 g/kg', null),
  ('caseina', 'Caseína', 'Recuperación', 'Apoyo a síntesis proteica nocturna.', '0.4 g/kg', 'Pre sueño', 'per_kg_range', 'g', 0.4, 0.4, '0.4 g/kg', null),
  ('tart-cherry', 'Tart Cherry', 'Recuperación', 'Apoyo para DOMS y sueño en semanas de carga.', '30 ml 2 veces/día', 'Mañana y noche', 'fixed', 'ml', 30, 60, '30 ml 2 veces/día', null),
  ('doms', 'DOMS', 'Recuperación', 'Fórmulas para semanas congestionadas y periodos de alta carga.', 'Según producto.', 'Según carga', 'custom', null, null, null, 'Según producto', 'Personalizar producto y dosis.'),
  ('colageno-vit-c', 'Colágeno + vitamina C', 'Lesión', 'Apoyo en tendón, tejido conectivo y return to play.', '15 g colágeno + 50 mg vitamina C', 'Antes de rehab', 'fixed', 'g', 10, 15, '15 g + 50 mg vitamina C', null),
  ('omega-3', 'Omega 3', 'Base', 'Soporte inflamatorio, recuperación y salud cerebral.', '2 g/día EPA+DHA', 'Con comidas grasas', 'fixed', 'g', 1, 3, '2 g/día EPA+DHA', 'Valorar ingesta de pescado azul.'),
  ('vitamina-d', 'Vitamina D', 'Base', 'Apoyo a función muscular e inmunidad.', 'Según analítica', 'Con comida grasa', 'custom', null, null, null, 'Según analítica', 'Cruzar con analítica y exposición solar.'),
  ('magnesio', 'Magnesio', 'Base', 'Apoyo a descanso, recuperación y función muscular.', '400 mg/día elemental', 'Preferible por la noche', 'fixed', 'mg', 200, 400, '400 mg/día elemental', 'Formas: bisglicinato, citrato o malato.'),
  ('turmeric', 'Turmeric/Curcumina', 'Recuperación', 'Apoyo para DOMS, recuperación y dolor articular.', '1000 mg/día', 'Con comida', 'fixed', 'mg', 500, 2000, '1000 mg/día', null),
  ('ashwagandha', 'Ashwagandha', 'Estrés y sueño', 'Apoyo para estrés, sueño y recuperación.', '600 mg/día', 'Tarde/noche o según tolerancia', 'fixed', 'mg', 300, 600, '600 mg/día', null),
  ('hmb', 'HMB', 'Lesión', 'Más útil en lesión, inmovilización o pérdida muscular.', '3 g/día.', 'Diario', 'fixed', 'g', 3, 3, '3 g/día', null),
  ('melatonina', 'Melatonina', 'Sueño', 'Apoyo para jet lag e inicio del sueño.', '2 mg', 'Pre sueño', 'fixed', 'mg', 0.5, 5, '2 mg', null),
  ('vit-c-mg-zinc', 'Vit C + Mg + Zinc', 'Micronutrientes', 'Combinación de micronutrientes de apoyo general.', 'Según producto.', 'Diario', 'custom', null, null, null, 'Según producto', 'Completar pauta exacta del producto.'),
  ('100-vit', '100 - VIT', 'Micronutrientes', 'Producto multivitamínico de apoyo puntual.', 'Según producto.', 'Diario', 'custom', null, null, null, 'Según producto', 'Completar pauta exacta del producto.'),
  ('multivitaminico', 'Multivitamínico', 'Micronutrientes', 'Apoyo general cuando la pauta alimentaria lo requiera.', 'Según producto.', 'Con comida', 'custom', null, null, null, 'Según producto', 'Completar pauta exacta del producto.'),
  ('lip-glunol', 'Lip Glunol', 'Custom', 'Suplemento incluido en planificación mensual.', 'Según producto.', 'Según pauta', 'custom', null, null, null, 'Según producto', 'Completar descripción y pauta exacta.'),
  ('glutamina', 'Glutamina', 'Recuperación', 'Apoyo digestivo/recuperación según contexto individual.', 'Según producto.', 'Según pauta', 'custom', null, null, null, 'Según producto', 'Personalizar según objetivo.'),
  ('prebioticos', 'Probióticos', 'Digestivo', 'Apoyo digestivo dentro de la periodización.', 'Según producto.', 'Con comida', 'custom', null, null, null, 'Según producto.', 'Personalizar producto y tolerancia.'),
  ('malato-citrulina', 'Malato citrulina', 'Rendimiento', 'Apoyo a rendimiento en sesiones de alta intensidad.', 'Según producto.', 'Pre-entreno', 'custom', null, null, null, 'Según producto', 'Completar pauta exacta.'),
  ('valeriano', 'Valeriano', 'Sueño', 'Apoyo puntual al descanso.', 'Según producto.', 'Pre sueño', 'custom', null, null, null, 'Según producto', 'Valorar somnolencia residual.'),
  ('taurina', 'Taurina', 'Entrenamiento', 'Interesante para estrés térmico y función muscular.', '3 g pre', 'Diario o pre-entreno', 'fixed', 'g', 1, 3, '3 g pre', 'Valorar especialmente en calor o sesiones demandantes.'),
  ('carbohidratos-intra', 'Carbohidratos intra', 'Matchday', 'Aporte intraesfuerzo; hasta 90 g/h en jugadores entrenados gastrointestinalmente.', '60 g/h', 'Durante partido o sesión larga', 'fixed', 'g', 30, 60, '60 g/h', 'Hasta 90 g/h si hay entrenamiento gastrointestinal.'),
  ('stack-nocturno', 'Stack nocturno habitual', 'Sueño', 'Combinación nocturna habitual para descanso y recuperación.', 'Magnesio + caseína + tart cherry + ashwagandha.', 'Pre sueño', 'custom', null, null, null, 'Magnesio + caseína + tart cherry + ashwagandha', 'Usar cuando encaje con el contexto de sueño, viajes o estrés.'),
  ('hierro-liposomado', 'Hierro liposomado', 'Micronutrientes', null, '30mg/día', 'Desayuno', 'custom', null, null, null, '30mg/día', null)
on conflict (slug) do nothing;

insert into teams.suplementacion_listas (slug, nombre, orden, descripcion)
values
  ('base-del-dia-a-dia', 'Base del día a día', 1, 'Suplementación de base diaria'),
  ('entrenamiento', 'Entrenamiento', 2, 'Suplementación enfocada al entrenamiento'),
  ('matchday', 'Matchday', 3, 'Suplementación de día de partido'),
  ('post-partido', 'Post partido', 4, 'Suplementación post partido'),
  ('lesiones-y-rtp', 'Lesiones y RTP', 5, 'Suplementación para lesiones y Return To Play'),
  ('sueno-viajes-y-estres', 'Sueño, viajes y estrés', 6, 'Suplementación para descanso, jet lag o estrés'),
  ('general', 'General', 7, 'Suplementación general'),
  ('pretemporada', 'Pretemporada', 8, 'Fase de volumen alto')
on conflict (slug) do nothing;

with items_data(lista_slug, supl_slug, orden, notas) as (
  values
    ('base-del-dia-a-dia', 'turmeric', 5, null),
    ('base-del-dia-a-dia', 'magnesio', 4, null),
    ('base-del-dia-a-dia', 'vitamina-d', 3, null),
    ('base-del-dia-a-dia', 'omega-3', 2, null),
    ('base-del-dia-a-dia', 'creatina', 1, null),
    ('entrenamiento', 'taurina', 4, null),
    ('entrenamiento', 'nitratos', 3, null),
    ('entrenamiento', 'beta-alanina', 2, null),
    ('entrenamiento', 'cafeina', 1, null),
    ('matchday', 'carbohidratos-intra', 1, null),
    ('matchday', 'mentol', 3, null),
    ('matchday', 'sodio-electrolitos', 2, null),
    ('post-partido', 'doms', 4, null),
    ('post-partido', 'tart-cherry', 3, null),
    ('post-partido', 'caseina', 2, null),
    ('post-partido', 'proteina-whey', 1, null),
    ('lesiones-y-rtp', 'hmb', 5, null),
    ('lesiones-y-rtp', 'turmeric', 4, null),
    ('lesiones-y-rtp', 'omega-3', 3, null),
    ('lesiones-y-rtp', 'colageno-vit-c', 1, null),
    ('lesiones-y-rtp', 'creatina', 2, null),
    ('sueno-viajes-y-estres', 'stack-nocturno', 2, null),
    ('sueno-viajes-y-estres', 'melatonina', 1, null),
    ('general', 'taurina', 8, null),
    ('general', 'ashwagandha', 12, null),
    ('general', 'turmeric', 9, null),
    ('general', 'vitamina-d', 6, null),
    ('general', 'omega-3', 5, null),
    ('general', 'colageno-vit-c', 10, null),
    ('general', 'tart-cherry', 11, null),
    ('general', 'proteina-whey', 4, null),
    ('general', 'sodio-electrolitos', 3, null),
    ('general', 'nitratos', 7, null),
    ('general', 'cafeina', 2, null),
    ('general', 'creatina', 1, null),
    ('pretemporada', 'colageno-vit-c', 1, null),
    ('pretemporada', 'creatina', 2, null),
    ('pretemporada', 'omega-3', 3, null),
    ('pretemporada', 'turmeric', 4, null),
    ('pretemporada', 'hierro-liposomado', 5, null)
)
insert into teams.suplementacion_lista_items (lista_id, suplemento_id, orden, notas)
select l.id, s.id, d.orden, d.notas
from items_data d
join teams.suplementacion_listas l on l.slug = d.lista_slug
join teams.suplementos s on s.slug = d.supl_slug
on conflict (lista_id, suplemento_id) do nothing;

notify pgrst, 'reload schema';
