-- Migration: add protocolos_custom column to teams.jugadores
alter table if exists teams.jugadores
add column if not exists protocolos_custom jsonb default '{}'::jsonb;
