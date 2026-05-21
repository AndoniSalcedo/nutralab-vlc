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
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  LineChart,
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
      previous: records.at(-2) || null,
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
    const previous = row.previous || {};
    return [
      `${row.nombre || ''} ${row.apellidos || ''}`.trim(),
      row.posicion || '',
      latest.fecha || '',
      latest.peso_kg ?? '',
      latest.porcentaje_grasa ?? '',
      latest.masa_magra_kg ?? '',
      latest.suma_6_pliegues ?? '',
      latest.peso_kg != null && previous.peso_kg != null ? number(latest.peso_kg - previous.peso_kg) : '',
      latest.porcentaje_grasa != null && previous.porcentaje_grasa != null ? number(latest.porcentaje_grasa - previous.porcentaje_grasa) : '',
      latest.masa_magra_kg != null && previous.masa_magra_kg != null ? number(latest.masa_magra_kg - previous.masa_magra_kg) : '',
      latest.suma_6_pliegues != null && previous.suma_6_pliegues != null ? number(latest.suma_6_pliegues - previous.suma_6_pliegues) : '',
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',');
  });
  return [headers.join(','), ...body].join('\n');
}

export default function TeamEvolutionDashboard({ players = [], evolutions = [] }) {
  const [metricKey, setMetricKey] = useState('peso_kg');
  const [position, setPosition] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const metric = METRICS.find((item) => item.key === metricKey) || METRICS[0];
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
  const latestValues = latestRows
    .map((row) => Number(row.latest?.[metric.key]))
    .filter(Number.isFinite);
  const average = latestValues.length ? number(latestValues.reduce((sum, value) => sum + value, 0) / latestValues.length) : null;
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
                <ActionIcon component={Anchor} href="/dashboard" variant="light" color="gray" radius="xl" size={42}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
              </Tooltip>
              <ThemeIcon color="blue" variant="light" radius="xl" size={42}>
                <IconChartLine size={21} />
              </ThemeIcon>
              <Box>
                <Title order={3} fw={850} c="#24291f" lh={1.1}>
                  Evolución de equipo
                </Title>
                <Text size="xs" c="dimmed" mt={2}>
                  Tendencias corporales, cobertura de mediciones y cambios recientes.
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
              <Select
                placeholder="Métrica"
                leftSection={<IconScale size={16} style={{ opacity: 0.7 }} />}
                data={METRICS.map((item) => ({ value: item.key, label: item.label }))}
                value={metricKey}
                onChange={(value) => value && setMetricKey(value)}
                variant="filled"
                radius="xl"
                size="sm"
                allowDeselect={false}
                style={{ flex: 1, minWidth: 180 }}
              />
              <Select
                placeholder="Posición"
                leftSection={<IconUsers size={16} style={{ opacity: 0.7 }} />}
                data={positionOptions}
                value={position}
                onChange={(value) => setPosition(value || '')}
                variant="filled"
                radius="xl"
                size="sm"
                allowDeselect={false}
                style={{ flex: 1, minWidth: 160 }}
              />
              <TextInput
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.currentTarget.value)}
                leftSection={<IconFilter size={16} style={{ opacity: 0.7 }} />}
                variant="filled"
                radius="xl"
                size="sm"
                style={{ flex: 1, minWidth: 150 }}
              />
              <TextInput
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.currentTarget.value)}
                variant="filled"
                radius="xl"
                size="sm"
                style={{ flex: 1, minWidth: 150 }}
              />
            </Group>
          </Paper>
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
          <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Media actual</Text>
          <Title order={2} c="dark.4" mt={4}>{average === null ? '-' : `${average} ${metric.unit}`}</Title>
          <Text size="xs" c="dimmed">{metric.label}</Text>
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
        <Paper p={{ base: 'md', sm: 'lg' }} radius="lg" withBorder shadow="sm" bg="white">
          <Group justify="space-between" align="flex-start" gap="sm" mb="md">
            <Box>
              <Title order={3} fw={800} c="dark.4">Tendencia media</Title>
              <Text size="sm" c="dimmed">Media del equipo por fecha de medición.</Text>
            </Box>
            <Badge color="blue" variant="light" radius="sm">{metric.label}</Badge>
          </Group>

          <Box h={330}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-2)" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(value) => String(value).slice(5)} stroke="var(--mantine-color-gray-5)" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} stroke="var(--mantine-color-gray-5)" axisLine={false} tickLine={false} />
                <ChartTooltip
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value) => [`${value} ${metric.unit}`, metric.label]}
                  labelStyle={{ fontWeight: 700, color: 'var(--mantine-color-dark-4)' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--mantine-color-gray-2)' }}
                />
                <Line
                  type="monotone"
                  dataKey={metric.key}
                  stroke={metric.color}
                  strokeWidth={3}
                  dot={{ r: 4, fill: metric.color, strokeWidth: 2, stroke: 'white' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
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
                  <Table.Th>Delta {metric.label}</Table.Th>
                  <Table.Th>Registros</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => {
                  const latest = row.latest || {};
                  const previous = row.previous || {};
                  const delta = latest[metric.key] != null && previous[metric.key] != null
                    ? number(Number(latest[metric.key]) - Number(previous[metric.key]))
                    : null;
                  return (
                    <Table.Tr key={row.id}>
                      <Table.Td style={{ paddingLeft: 24 }}>
                        <Text fz="sm" fw={650} c="dark.4">{row.nombre} {row.apellidos}</Text>
                        <Text fz="xs" c="dimmed">{row.posicion || 'Sin posición'}</Text>
                      </Table.Td>
                      <Table.Td>{formatDate(latest.fecha)}</Table.Td>
                      {METRICS.map((item) => (
                        <Table.Td key={item.key}>{metricDisplay(latest[item.key], item.unit)}</Table.Td>
                      ))}
                      <Table.Td>
                        {delta === null ? (
                          <Text size="sm" c="dimmed">-</Text>
                        ) : (
                          <Badge color={deltaColor(delta, metric)} variant="light" radius="sm">
                            {delta > 0 ? '+' : ''}{delta} {metric.unit}
                          </Badge>
                        )}
                      </Table.Td>
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
