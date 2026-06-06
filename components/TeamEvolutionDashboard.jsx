'use client';

import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useRouter } from 'next/navigation';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  IconArrowLeft,
  IconChartLine,
  IconDownload,
  IconFilter,
  IconScale,
  IconUsers,
} from '@tabler/icons-react';
import NothingFound from '@/components/NothingFound/NothingFound';

const METRICS = [
  { key: 'peso_kg', label: 'Peso', unit: 'kg', color: '#3b82f6', goodDown: null },
  { key: 'porcentaje_grasa', label: '% grasa', unit: '%', color: '#ef4444', goodDown: true },
  { key: 'masa_magra_kg', label: 'Masa magra', unit: 'kg', color: '#22c55e', goodDown: false },
  { key: 'suma_6_pliegues', label: 'Suma 6', unit: 'mm', color: '#f59e0b', goodDown: true },
];

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`));
}

function number(value, digits = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(digits)) : null;
}

function metricDisplay(value, unit) {
  const n = number(value);
  return n === null ? '-' : `${n} ${unit}`;
}

function metricRecord(records = [], key, offset = 0) {
  return [...records]
    .filter((record) => record?.fecha && record[key] !== null && record[key] !== undefined && record[key] !== '')
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .at(-(offset + 1)) || null;
}

function deltaColor(delta, metric) {
  if (!Number.isFinite(delta) || delta === 0 || metric.goodDown === null) return 'gray';
  const improved = metric.goodDown ? delta < 0 : delta > 0;
  return improved ? 'green' : 'red';
}

function latestByPlayer(players, evolutions) {
  return players.map((player) => {
    const records = evolutions
      .filter((item) => String(item.jugador_id) === String(player.id))
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    return {
      ...player,
      records,
      latest: records.at(-1) || null,
    };
  });
}

function aggregateByDate(rows) {
  const byDate = new Map();

  rows.forEach((row) => {
    row.records.forEach((record) => {
      if (!record.fecha) return;
      if (!byDate.has(record.fecha)) {
        byDate.set(record.fecha, { fecha: record.fecha, count: 0 });
      }
      const group = byDate.get(record.fecha);
      let hasAny = false;

      METRICS.forEach((metric) => {
        const value = Number(record[metric.key]);
        if (!Number.isFinite(value)) return;
        group[`${metric.key}_sum`] = (group[`${metric.key}_sum`] || 0) + value;
        group[`${metric.key}_count`] = (group[`${metric.key}_count`] || 0) + 1;
        hasAny = true;
      });

      if (hasAny) group.count += 1;
    });
  });

  return Array.from(byDate.values())
    .map((group) => {
      const item = { fecha: group.fecha, count: group.count };
      METRICS.forEach((metric) => {
        const count = group[`${metric.key}_count`] || 0;
        item[metric.key] = count ? number(group[`${metric.key}_sum`] / count) : null;
      });
      return item;
    })
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
}

function buildCsv(rows) {
  const headers = [
    'Jugador',
    'Posicion',
    'Fecha ultima',
    'Peso',
    '% grasa',
    'Masa magra',
    'Suma 6',
    'Delta peso',
    'Delta % grasa',
    'Delta masa magra',
    'Delta suma 6',
  ];
  const body = rows.map((row) => {
    const latest = row.latest || {};
    const metricValues = Object.fromEntries(METRICS.map((metric) => {
      const latestMetric = metricRecord(row.records, metric.key, 0);
      const previousMetric = metricRecord(row.records, metric.key, 1);
      const delta = latestMetric?.[metric.key] != null && previousMetric?.[metric.key] != null
        ? number(Number(latestMetric[metric.key]) - Number(previousMetric[metric.key]))
        : '';
      return [metric.key, {
        value: latestMetric?.[metric.key] ?? '',
        delta,
      }];
    }));
    return [
      `${row.nombre || ''} ${row.apellidos || ''}`.trim(),
      row.posicion || '',
      latest.fecha || '',
      metricValues.peso_kg.value,
      metricValues.porcentaje_grasa.value,
      metricValues.masa_magra_kg.value,
      metricValues.suma_6_pliegues.value,
      metricValues.peso_kg.delta,
      metricValues.porcentaje_grasa.delta,
      metricValues.masa_magra_kg.delta,
      metricValues.suma_6_pliegues.delta,
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',');
  });
  return [headers.join(','), ...body].join('\n');
}

export default function TeamEvolutionDashboard({ players = [], evolutions = [], team }) {
  const router = useRouter();
  const [position, setPosition] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const positionOptions = useMemo(() => {
    const values = Array.from(new Set(players.map((player) => player.posicion).filter(Boolean))).sort();
    return [{ value: '', label: 'Todas' }, ...values.map((value) => ({ value, label: value }))];
  }, [players]);

  const filteredEvolutions = useMemo(() => evolutions.filter((record) => {
    if (dateFrom && String(record.fecha) < dateFrom) return false;
    if (dateTo && String(record.fecha) > dateTo) return false;
    return true;
  }), [dateFrom, dateTo, evolutions]);

  const scopedPlayers = useMemo(
    () => (position ? players.filter((player) => player.posicion === position) : players),
    [players, position]
  );

  const rows = useMemo(() => {
    return latestByPlayer(scopedPlayers, filteredEvolutions).filter((row) => row.records.length > 0);
  }, [filteredEvolutions, scopedPlayers]);

  const chartData = useMemo(() => aggregateByDate(rows), [rows]);
  const latestRows = rows.filter((row) => row.latest);
  const measuredPct = scopedPlayers.length ? Math.round((latestRows.length / scopedPlayers.length) * 100) : 0;
  const totalRecords = rows.reduce((sum, row) => sum + row.records.length, 0);
  const lastDate = chartData.at(-1)?.fecha;

  function downloadCsv() {
    const blob = new Blob([buildCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'evolucion-equipo.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Stack gap="lg">
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        shadow="sm"
        radius="xl"
        withBorder
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
          zIndex: 10,
          position: 'relative',
        }}
      >
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="sm" wrap="nowrap">
              <Tooltip label="Volver al panel" withArrow>
                <ActionIcon component={Anchor} href={team?.id ? `/dashboard/equipo/${team.id}` : '/dashboard'} variant="light" color="gray" radius="xl" size={42}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
              </Tooltip>
              <ThemeIcon color="blue" variant="light" radius="xl" size={42}>
                <IconChartLine size={21} />
              </ThemeIcon>
              <Box>
                <Title order={3} fw={850} c="#24291f" lh={1.1}>
                  Evolución de {team?.nombre || 'equipo'}
                </Title>
                <Text size="xs" c="dimmed" mt={2}>
                  {team?.temporada ? `${team.temporada} · ` : ''}Tendencias corporales, cobertura de mediciones y cambios recientes.
                </Text>
              </Box>
            </Group>

            <Button
              radius="xl"
              size="sm"
              variant="light"
              color="gray"
              leftSection={<IconDownload size={16} />}
              onClick={downloadCsv}
              disabled={rows.length === 0}
            >
              CSV
            </Button>
          </Group>

          <Paper p={6} radius="xl" shadow="xs" withBorder bg="white" w="100%">
            <Group gap={8} w="100%" wrap="wrap" align="center">
              <DateInput
                placeholder="Fecha de inicio"
                leftSection={<IconFilter size={16} style={{ opacity: 0.7 }} />}
                value={dateFrom ? new Date(`${dateFrom}T00:00:00`) : null}
                onChange={(value) => setDateFrom(value ? value.toISOString().split('T')[0] : '')}
                variant="filled"
                radius="xl"
                size="sm"
                valueFormat="DD/MM/YYYY"
                clearable
                style={{ flex: 1, minWidth: 160 }}
              />
              <DateInput
                placeholder="Fecha de fin"
                leftSection={<IconFilter size={16} style={{ opacity: 0.7 }} />}
                value={dateTo ? new Date(`${dateTo}T00:00:00`) : null}
                onChange={(value) => setDateTo(value ? value.toISOString().split('T')[0] : '')}
                variant="filled"
                radius="xl"
                size="sm"
                valueFormat="DD/MM/YYYY"
                clearable
                style={{ flex: 1, minWidth: 160 }}
              />
            </Group>
          </Paper>
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
          <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Plantilla total</Text>
          <Title order={2} c="dark.4" mt={4}>{scopedPlayers.length}</Title>
          <Text size="xs" c="dimmed">jugadores activos</Text>
        </Paper>
        <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
          <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Jugadores medidos</Text>
          <Title order={2} c="dark.4" mt={4}>{latestRows.length}/{scopedPlayers.length}</Title>
          <Text size="xs" c="dimmed">{measuredPct}% con al menos una medición</Text>
        </Paper>
        <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
          <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Registros filtrados</Text>
          <Title order={2} c="dark.4" mt={4}>{totalRecords}</Title>
          <Text size="xs" c="dimmed">mediciones en el rango</Text>
        </Paper>
        <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
          <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Última fecha</Text>
          <Title order={3} c="dark.4" mt={8}>{formatDate(lastDate)}</Title>
          <Text size="xs" c="dimmed">último registro disponible</Text>
        </Paper>
      </SimpleGrid>

      {chartData.length > 0 ? (
        <SimpleGrid cols={{ base: 1, md: 1, lg: 2 }} spacing="lg">
          {METRICS.map((item) => {
            const latestValuesForMetric = latestRows
              .map((row) => Number(row.latest?.[item.key]))
              .filter(Number.isFinite);
            const avg = latestValuesForMetric.length
              ? number(latestValuesForMetric.reduce((sum, value) => sum + value, 0) / latestValuesForMetric.length)
              : null;
            const metricData = chartData.filter(d => d[item.key] !== null);
            const reverseMetricData = [...metricData].reverse();

            return (
              <Paper key={item.key} p="md" radius="lg" withBorder bg="white">
                <Group justify="space-between" align="flex-start" gap="sm" mb="md">
                  <Box>
                    <Title order={4} fw={800} c="dark.4">{item.label}</Title>
                    <Text size="xs" c="dimmed">Tendencia media del equipo</Text>
                  </Box>
                  <Badge color={item.goodDown === true ? 'red' : item.goodDown === false ? 'green' : 'blue'} variant="light" radius="sm">
                    Media: {avg === null ? '-' : `${avg} ${item.unit}`}
                  </Badge>
                </Group>

                <Stack gap="md">
                  <Box h={200}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={metricData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`gradient_${item.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={item.color} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={item.color} stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-2)" vertical={false} />
                        <XAxis
                          dataKey="fecha"
                          tick={{ fontSize: 9 }}
                          tickFormatter={(value) => String(value).slice(5)}
                          stroke="var(--mantine-color-gray-5)"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9 }}
                          domain={['auto', 'auto']}
                          stroke="var(--mantine-color-gray-5)"
                          axisLine={false}
                          tickLine={false}
                        />
                        <ChartTooltip
                          labelFormatter={(value) => formatDate(value)}
                          formatter={(value) => [`${value} ${item.unit}`, item.label]}
                          labelStyle={{ fontWeight: 700, color: 'var(--mantine-color-dark-4)', fontSize: 10 }}
                          contentStyle={{ borderRadius: '12px', border: '1px solid var(--mantine-color-gray-2)', padding: '6px 10px', fontSize: 10 }}
                        />
                        <Bar
                          dataKey={item.key}
                          fill={`url(#gradient_${item.key})`}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                        <Line
                          type="monotone"
                          dataKey={item.key}
                          stroke={item.color}
                          strokeWidth={2}
                          dot={{ r: 3.5, fill: 'white', stroke: item.color, strokeWidth: 2 }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                          connectNulls
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Box>

                  <ScrollArea h={120} offsetScrollbars>
                    <Table verticalSpacing={4} striped highlightOnHover style={{ minWidth: 150 }}>
                      <Table.Thead bg="gray.0">
                        <Table.Tr>
                          <Table.Th style={{ fontSize: 10, padding: '4px 8px' }}>Fecha</Table.Th>
                          <Table.Th style={{ fontSize: 10, padding: '4px 8px', textAlign: 'right' }}>Media</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {reverseMetricData.map((row) => (
                          <Table.Tr key={row.fecha}>
                            <Table.Td style={{ fontSize: 10, padding: '4px 8px' }}>
                              {formatDate(row.fecha)}
                            </Table.Td>
                            <Table.Td style={{ fontSize: 10, padding: '4px 8px', textAlign: 'right', fontWeight: 650 }}>
                              {row[item.key]} {item.unit}
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      ) : (
        <NothingFound
          withPaper
          icon={IconChartLine}
          title="Sin datos"
          description="No hay mediciones para los filtros seleccionados."
        />
      )}

      {rows.length > 0 && (
        <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
          <ScrollArea>
            <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 920 }}>
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th style={{ paddingLeft: 24 }}>Jugador</Table.Th>
                  <Table.Th>Última medición</Table.Th>
                  {METRICS.map((item) => <Table.Th key={item.key}>{item.label}</Table.Th>)}
                  <Table.Th>Registros</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => {
                  const latest = row.latest || {};
                  return (
                    <Table.Tr
                      key={row.id}
                      onClick={() => router.push(`/dashboard/jugador/${row.id}/metricas/mediciones`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Td style={{ paddingLeft: 24 }}>
                        <Text fz="sm" fw={650} c="dark.4">{row.nombre} {row.apellidos}</Text>
                        <Text fz="xs" c="dimmed">{row.posicion || 'Sin posición'}</Text>
                      </Table.Td>
                      <Table.Td>{formatDate(latest.fecha)}</Table.Td>
                      {METRICS.map((item) => {
                        const latestMetric = metricRecord(row.records, item.key, 0);
                        const previousMetric = metricRecord(row.records, item.key, 1);
                        const val = latestMetric?.[item.key] ?? null;
                        const prevVal = previousMetric?.[item.key] ?? null;
                        const delta = val != null && prevVal != null ? number(Number(val) - Number(prevVal)) : null;
                        return (
                          <Table.Td key={item.key}>
                            <Group gap={6} wrap="nowrap">
                              <Text fz="sm" fw={600} c="dark.4">
                                {metricDisplay(val, item.unit)}
                              </Text>
                              {delta !== null && delta !== 0 && (
                                <Badge
                                  color={deltaColor(delta, item)}
                                  variant="light"
                                  size="xs"
                                  radius="sm"
                                  style={{ padding: '0 4px', height: 16 }}
                                >
                                  {delta > 0 ? `+${delta}` : delta}
                                </Badge>
                              )}
                            </Group>
                          </Table.Td>
                        );
                      })}
                      <Table.Td>{row.records.length}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      )}
    </Stack>
  );
}
