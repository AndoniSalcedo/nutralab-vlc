'use client';

import { useMemo, useState } from 'react';
import { Badge, Group, ScrollArea, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import WidgetCard from '@/components/widgets/WidgetCard';
import NothingFound from '@/components/NothingFound';
import { compareRecords, formatDelta, sortByDateDesc, TREND_META } from '@/lib/analytics/compare';

function formatDate(dateStr) {
  if (!dateStr) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${dateStr}T00:00:00`));
}

const avg = (values) => values.reduce((s, v) => s + v, 0) / values.length;
const round2 = (n) => Math.round(n * 100) / 100;

// Compara, para cada jugador con 2+ analíticas, su última analítica con la anterior.
export default function TeamAnalyticsComparison({ players = [], selectedParam }) {
  const router = useRouter();
  const [view, setView] = useState('parametros');

  const comparisons = useMemo(
    () =>
      players
        .map((player) => {
          const [latest, previous] = sortByDateDesc(player.records || []);
          if (!latest || !previous) return null;
          return { player, latest, previous, rows: compareRecords(latest, previous) };
        })
        .filter(Boolean),
    [players]
  );

  // Agregado por parámetro: media del equipo antes/después y cuántos jugadores mejoran/empeoran.
  const byParam = useMemo(() => {
    const map = new Map();
    comparisons.forEach(({ rows }) => {
      rows.forEach((r) => {
        if (!map.has(r.nombre)) map.set(r.nombre, { nombre: r.nombre, unidad: r.unidad, antes: [], ahora: [], mejora: 0, empeora: 0, estable: 0 });
        const entry = map.get(r.nombre);
        entry.antes.push(r.anterior);
        entry.ahora.push(r.valor);
        entry[r.trend] += 1;
      });
    });
    return Array.from(map.values())
      .map((e) => {
        const antes = avg(e.antes);
        const ahora = avg(e.ahora);
        return { ...e, mediaAntes: round2(antes), mediaAhora: round2(ahora), delta: ahora - antes, n: e.antes.length };
      })
      .sort((a, b) => b.empeora - a.empeora || b.n - a.n);
  }, [comparisons]);

  // Cambio por jugador para el biomarcador seleccionado en el inspector.
  const byPlayer = useMemo(
    () =>
      comparisons
        .map(({ player, latest, previous, rows }) => {
          const row = rows.find((r) => r.nombre === selectedParam);
          return row ? { player, latest, previous, row } : null;
        })
        .filter(Boolean)
        .sort((a, b) => Math.abs(b.row.pct ?? 0) - Math.abs(a.row.pct ?? 0)),
    [comparisons, selectedParam]
  );

  return (
    <WidgetCard icon="history" title="Comparación de analíticas" color="salvia" style={{ height: 'auto', width: '100%', minWidth: 0 }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Text size="xs" c="dimmed">
            Última analítica de cada jugador frente a la anterior ({comparisons.length} {comparisons.length === 1 ? 'jugador' : 'jugadores'} con 2 o más)
          </Text>
          <SegmentedControl
            value={view}
            onChange={setView}
            size="xs"
            radius="xl"
            data={[
              { value: 'parametros', label: 'Por parámetro' },
              { value: 'jugadores', label: selectedParam ? `Por jugador · ${selectedParam}` : 'Por jugador' },
            ]}
          />
        </Group>

        {comparisons.length === 0 ? (
          <NothingFound
            title="Aún no hay nada que comparar"
            icon3d="chart"
            description="Hacen falta al menos dos analíticas de un mismo jugador para ver su evolución."
          />
        ) : view === 'parametros' ? (
          <ScrollArea>
            <Table verticalSpacing="xs" highlightOnHover style={{ minWidth: 640 }}>
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th>Parámetro</Table.Th>
                  <Table.Th>Media anterior</Table.Th>
                  <Table.Th>Media última</Table.Th>
                  <Table.Th>Variación</Table.Th>
                  <Table.Th>Jugadores</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {byParam.map((e) => (
                  <Table.Tr key={e.nombre}>
                    <Table.Td><Text size="sm" fw={600}>{e.nombre}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{e.mediaAntes} {e.unidad}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={700}>{e.mediaAhora} {e.unidad}</Text></Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600}>{e.delta > 0 ? '↑' : e.delta < 0 ? '↓' : '→'} {formatDelta(e.delta)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Badge variant="light" color="salvia" size="sm">{e.mejora} ↗</Badge>
                        <Badge variant="light" color="arcilla" size="sm">{e.empeora} ↘</Badge>
                        <Badge variant="light" color="gray" size="sm">{e.estable} =</Badge>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        ) : byPlayer.length === 0 ? (
          <NothingFound
            title="Sin comparativa para este parámetro"
            icon3d="chart"
            description={`Ningún jugador tiene "${selectedParam}" en dos analíticas distintas.`}
          />
        ) : (
          <ScrollArea>
            <Table verticalSpacing="xs" highlightOnHover style={{ minWidth: 640 }}>
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th>Jugador</Table.Th>
                  <Table.Th>Anterior</Table.Th>
                  <Table.Th>Última</Table.Th>
                  <Table.Th>Variación</Table.Th>
                  <Table.Th>Tendencia</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {byPlayer.map(({ player, latest, previous, row }) => {
                  const meta = TREND_META[row.trend];
                  return (
                    <Table.Tr
                      key={player.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/dashboard/jugador/${player.id}/metricas/analiticas`)}
                    >
                      <Table.Td><Text size="sm" fw={600}>{player.nombre} {player.apellidos}</Text></Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{row.anterior} {row.unidad}</Text>
                        <Text size="xs" c="dimmed">{formatDate(previous.fecha_extraccion)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={700} c={row.parametro.fuera_rango ? 'arcilla' : 'salvia'}>{row.valor} {row.unidad}</Text>
                        <Text size="xs" c="dimmed">{formatDate(latest.fecha_extraccion)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {row.delta > 0 ? '↑' : row.delta < 0 ? '↓' : '→'} {formatDelta(row.delta)}
                          {row.pct !== null && <Text span size="xs" c="dimmed"> ({formatDelta(row.pct)}%)</Text>}
                        </Text>
                      </Table.Td>
                      <Table.Td><Badge variant="light" color={meta.color} size="sm">{meta.label}</Badge></Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Stack>
    </WidgetCard>
  );
}
