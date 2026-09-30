'use server';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import { getOwnedTeam, getAccessibleTeam } from '@/lib/auth/team-access';
import { isMockTeam } from '@/config/boneyardMockData';
import { assertPlainObject } from '@/lib/security/json';
import { INTRAPARTIDO_TIMINGS, PRODUCTS_MAP, buildSessionFromRows } from '@/config/intrapartido';
import { getPlayersByTeamSelect } from '@/repositories/playerRepository';
import {
  getIntrapartidoMatchesByTeamId,
  getIntrapartidoMatchById,
  saveIntrapartidoMatch as saveIntrapartidoMatchInRepo,
  deleteIntrapartidoMatch as deleteIntrapartidoMatchInRepo,
} from '@/repositories/intrapartidoRepository';

const TIMING_IDS = new Set(INTRAPARTIDO_TIMINGS.map((t) => t.id));
const MAX_STARTERS = 11;
const MAX_QTY_PER_INTAKE = 50;

function parseId(value, label) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) throw new Error(`${label} no válido`);
  return num;
}

async function requireTeamAccess(teamId, { write }) {
  if (!teamId) throw new Error('Falta equipo_id');
  const user = await getUser();
  if (!user) throw new Error('No autorizado');
  if (write && (user.role === 'tecnico' || user.role === 'jugador')) throw new Error('No autorizado');

  const supabase = getSupabaseAdmin();
  const team = write
    ? await getOwnedTeam(supabase, user, teamId)
    : await getAccessibleTeam(supabase, user, teamId);
  if (!team) throw new Error('No tienes acceso a este equipo');

  return { supabase, user };
}

export async function listIntrapartidoMatches(teamId) {
  const { supabase } = await requireTeamAccess(teamId, { write: false });
  const matches = await getIntrapartidoMatchesByTeamId(supabase, teamId);
  return { ok: true, matches };
}

export async function getIntrapartidoMatch(teamId, matchId) {
  const { supabase } = await requireTeamAccess(teamId, { write: false });
  const result = await getIntrapartidoMatchById(supabase, teamId, parseId(matchId, 'Partido'));
  if (!result) throw new Error('Partido no encontrado');

  const { match, convocados, tomas } = result;
  return { ok: true, session: buildSessionFromRows(match, convocados, tomas) };
}

export async function saveIntrapartidoMatch(teamId, session) {
  const { supabase, user } = await requireTeamAccess(teamId, { write: true });
  assertPlainObject(session, { label: 'Sesión' });
  // Modo demo (boneyard): nada que persistir.
  if (isMockTeam(teamId)) return { ok: true, id: null };

  const matchInfo = session.matchInfo || {};
  const fecha = String(matchInfo.fecha || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(`${fecha}T12:00:00Z`))) {
    throw new Error('Indica la fecha del partido');
  }

  const roster = Array.isArray(session.activeRosterIds) ? session.activeRosterIds : [];
  const rosterIds = Array.from(new Set(roster.map((id) => parseId(id, 'Jugador'))));
  const starterIds = new Set(
    (Array.isArray(session.starterIds) ? session.starterIds : []).map((id) => parseId(id, 'Jugador')),
  );
  if (rosterIds.length === 0) throw new Error('Convoca al menos un jugador');
  if (starterIds.size > MAX_STARTERS) throw new Error(`Un partido no puede tener más de ${MAX_STARTERS} titulares`);
  starterIds.forEach((id) => {
    if (!rosterIds.includes(id)) throw new Error('Un titular no está en la convocatoria');
  });

  // Todos los jugadores deben pertenecer al equipo indicado.
  const teamPlayers = await getPlayersByTeamSelect(supabase, teamId, 'id');
  const teamPlayerIds = new Set(teamPlayers.map((p) => Number(p.id)));
  rosterIds.forEach((id) => {
    if (!teamPlayerIds.has(id)) throw new Error('Hay jugadores que no pertenecen al equipo');
  });

  const rosterSet = new Set(rosterIds);
  const tomas = [];
  const intakes = session.intakes && typeof session.intakes === 'object' ? session.intakes : {};
  Object.entries(intakes).forEach(([rawPlayerId, timings]) => {
    const jugadorId = parseId(rawPlayerId, 'Jugador');
    if (!rosterSet.has(jugadorId) || !timings || typeof timings !== 'object') return;
    Object.entries(timings).forEach(([momento, products]) => {
      if (!TIMING_IDS.has(momento)) throw new Error('Momento de partido no válido');
      if (!products || typeof products !== 'object') return;
      Object.entries(products).forEach(([productoId, qty]) => {
        if (!PRODUCTS_MAP.has(productoId)) throw new Error('Producto no válido');
        const cantidad = Number(qty);
        if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > MAX_QTY_PER_INTAKE) {
          throw new Error('Cantidad no válida');
        }
        if (cantidad > 0) tomas.push({ jugador_id: jugadorId, momento, producto_id: productoId, cantidad });
      });
    });
  });

  const matchId = session.id ? parseId(session.id, 'Partido') : null;
  const id = await saveIntrapartidoMatchInRepo(supabase, {
    matchId,
    teamId: parseId(teamId, 'Equipo'),
    rival: String(matchInfo.rival || '').trim().slice(0, 120),
    competicion: String(matchInfo.competicion || '').trim().slice(0, 80),
    lugar: String(matchInfo.lugar || '').trim().slice(0, 80),
    fecha,
    createdBy: String(user.id || ''),
    convocados: rosterIds.map((jugador_id) => ({ jugador_id, titular: starterIds.has(jugador_id) })),
    tomas,
  });

  revalidatePath(`/dashboard/equipo/${teamId}/intrapartido`);
  return { ok: true, id: id == null ? null : String(id) };
}

export async function deleteIntrapartidoMatch(teamId, matchId) {
  const { supabase } = await requireTeamAccess(teamId, { write: true });
  await deleteIntrapartidoMatchInRepo(supabase, teamId, parseId(matchId, 'Partido'));
  revalidatePath(`/dashboard/equipo/${teamId}/intrapartido`);
  return { ok: true };
}
