-- Migration: avisos push del jugador, partidos programados (día de partido) y retos de equipo

-- Navegadores/dispositivos suscritos a Web Push
create table if not exists teams.push_suscripciones (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists teams_push_suscripciones_jugador_idx on teams.push_suscripciones (jugador_id);

-- Preferencias de avisos del jugador (lo no guardado queda activado)
create table if not exists teams.notificaciones_preferencias (
  jugador_id bigint primary key references teams.jugadores(id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Avisos ya enviados: (jugador, tipo, clave) único para no repetir recordatorios
create table if not exists teams.notificaciones_enviadas (
  id bigserial primary key,
  jugador_id bigint not null references teams.jugadores(id) on delete cascade,
  tipo text not null,
  clave text not null,
  created_at timestamptz not null default now(),
  unique (jugador_id, tipo, clave)
);
create index if not exists teams_notificaciones_enviadas_created_idx on teams.notificaciones_enviadas (created_at);

-- Próximos partidos con hora de inicio (HH:MM, Europe/Madrid)
create table if not exists teams.partidos_programados (
  id bigserial primary key,
  equipo_id bigint not null references teams.equipos(id) on delete cascade,
  fecha date not null,
  hora text not null check (hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  rival text not null default '',
  lugar text not null default '',
  created_by text,
  created_at timestamptz default now()
);
create index if not exists teams_partidos_programados_equipo_fecha_idx on teams.partidos_programados (equipo_id, fecha);

-- Participación voluntaria en los retos de adherencia del equipo
create table if not exists teams.retos_participantes (
  jugador_id bigint primary key references teams.jugadores(id) on delete cascade,
  created_at timestamptz default now()
);

-- Misma política que el resto del esquema: RLS activa y sin políticas (solo la service role)
alter table teams.push_suscripciones enable row level security;
alter table teams.notificaciones_preferencias enable row level security;
alter table teams.notificaciones_enviadas enable row level security;
alter table teams.partidos_programados enable row level security;
alter table teams.retos_participantes enable row level security;
