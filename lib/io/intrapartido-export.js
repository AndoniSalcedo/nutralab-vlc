import { downloadXlsx } from '@/lib/io/xlsx-download';
import {
  INTRAPARTIDO_TIMINGS,
  PRODUCTS_MAP,
  calculatePlayerTotals,
} from '@/config/intrapartido';

/**
 * Descarga el informe .xlsx de un partido: una fila por jugador convocado con
 * las tomas de cada momento y los totales nutricionales.
 * @param {{ session: object, players: object[], team?: object }} options
 */
export async function exportIntrapartidoExcel({ session, players = [], team = null }) {
  const info = session.matchInfo || {};
  const playersMap = new Map(players.map((p) => [String(p.id), p]));
  const starterSet = new Set(session.starterIds);

  const rows = [
    ['NUTRALAB - CONTROL INTRAPARTIDO'],
    ['Equipo:', team?.nombre || '', '', 'Fecha:', info.fecha || ''],
    ['Rival:', info.rival || '', '', 'Competición:', info.competicion || ''],
    ['Lugar:', info.lugar || ''],
    [],
    [
      'Jugador',
      'Rol',
      ...INTRAPARTIDO_TIMINGS.map((t) => t.label),
      'Líquidos (ml)',
      'Carbohidratos (g)',
      'Sodio (mg)',
      'Potasio (mg)',
      'Cafeína (mg)',
      'Calorías (kcal)',
    ],
  ];

  session.activeRosterIds.forEach((pId) => {
    const player = playersMap.get(pId);
    if (!player) return;
    const intakes = session.intakes[pId] || {};
    const totals = calculatePlayerTotals(intakes);
    const phases = INTRAPARTIDO_TIMINGS.map((t) =>
      Object.entries(intakes[t.id] || {})
        .map(([productId, qty]) => `${qty}x ${PRODUCTS_MAP.get(productId)?.nombre || productId}`)
        .join(', '),
    );
    rows.push([
      `${player.nombre} ${player.apellidos || ''}`.trim(),
      starterSet.has(pId) ? 'Titular' : 'Suplente',
      ...phases,
      Math.round(totals.aguaMl),
      Math.round(totals.carbsG * 10) / 10,
      Math.round(totals.sodioMg),
      Math.round(totals.potasioMg),
      Math.round(totals.cafeinaMg),
      Math.round(totals.kcal),
    ]);
  });

  await downloadXlsx({
    filename: `intrapartido-${info.fecha || 'partido'}.xlsx`,
    sheetName: 'Intrapartido',
    rows,
    colWidths: [28, 10, ...INTRAPARTIDO_TIMINGS.map(() => 24), 14, 18, 12, 12, 12, 16],
  });
}
