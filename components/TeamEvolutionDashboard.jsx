'use client';

import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  ScrollArea,
  SegmentedControl,
  Select,
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
  IconCalendarStats,
  IconChartLine,
  IconDownload,
  IconExternalLink,
  IconEye,
  IconFilter,
  IconUsers,
} from '@tabler/icons-react';
import NothingFound from '@/components/NothingFound/NothingFound';
import {
  MEASUREMENT_DETAIL_SECTIONS,
  TREND_MEASUREMENT_METRICS,
  formatMetricNumber,
  formatMetricValue,
  hasMetricValue,
  metricValue,
} from '@/lib/measurement-metrics';

const METRICS = TREND_MEASUREMENT_METRICS;

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`));
}

function dateValue(value) {
  return value ? new Date(`${value}T00:00:00`) : null;
}

function dateInputToIso(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function number(value, digits = 1) {
  return formatMetricNumber(value, digits);
}

function metricDisplay(value, unit) {
  return formatMetricValue(value, unit);
}

function playerName(player) {
  return `${player?.nombre || ''} ${player?.apellidos || ''}`.trim() || 'Jugador';
}

function metricRecord(records = [], metric, offset = 0) {
  return [...records]
    .map((record) => ({ ...record, [metric.key]: metricValue(record, metric) }))
    .filter((record) => record?.fecha && hasMetricValue(record[metric.key]))
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .at(-(offset + 1)) || null;
}

function metricNumber(record, metric) {
  const value = metricValue(record, metric);
  if (!hasMetricValue(value)) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function deltaFor(currentRecord, previousRecord, metric) {
  const current = metricNumber(currentRecord, metric);
  const previous = metricNumber(previousRecord, metric);
  if (current === null || previous === null) return null;
  return number(current - previous);
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
        const value = metricNumber(record, metric);
        if (value === null) return;
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

function buildTrendCsv(rows) {
  const headers = [
    'Jugador',
    'Posicion',
    'Fecha ultima',
    ...METRICS.map((metric) => metric.label),
    ...METRICS.map((metric) => `Delta ${metric.label}`),
  ];
  const body = rows.map((row) => {
    const latest = row.latest || {};
    const metricValues = Object.fromEntries(METRICS.map((metric) => {
      const latestMetric = metricRecord(row.records, metric, 0);
      const previousMetric = metricRecord(row.records, metric, 1);
      const delta = deltaFor(latestMetric, previousMetric, metric) ?? '';
      return [metric.key, {
        value: latestMetric?.[metric.key] ?? '',
        delta,
      }];
    }));
    return [
      playerName(row),
      row.posicion || '',
      latest.fecha || '',
      ...METRICS.map((metric) => metricValues[metric.key].value),
      ...METRICS.map((metric) => metricValues[metric.key].delta),
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',');
  });
  return [headers.join(','), ...body].join('\n');
}

function buildDayCsv(dayRows, date) {
  const headers = [
    'Jugador',
    'Posicion',
    'Fecha',
    'Origen',
    ...METRICS.map((metric) => metric.label),
    ...METRICS.map((metric) => `Delta previo ${metric.label}`),
  ];
  const body = dayRows.map((row) => [
    playerName(row),
    row.posicion || '',
    date || '',
    row.measurement?.fuente_hoja || '',
    ...METRICS.map((metric) => metricValue(row.measurement, metric) ?? ''),
    ...METRICS.map((metric) => deltaFor(row.measurement, row.previous, metric) ?? ''),
  ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','));
  return [headers.join(','), ...body].join('\n');
}

function downloadCsv(name, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function rawMetricEntries(medicion) {
  const raw = medicion?.metricas_excel;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return Object.entries(raw)
    .filter(([, value]) => hasMetricValue(value))
    .sort(([a], [b]) => a.localeCompare(b, 'es'));
}

function displayRawValue(value) {
  if (value === true) return 'Sí';
  if (value === false) return 'No';
  if (value instanceof Date) return formatDate(value.toISOString().split('T')[0]);
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value);
}

function sourceRows(medicion) {
  return [
    ['Fecha', formatDate(medicion?.fecha)],
    ['Hoja Excel', medicion?.fuente_hoja],
    ['Fila Excel', medicion?.fuente_fila],
    ['Fecha original Excel', medicion?.fecha_original_excel ? formatDate(medicion.fecha_original_excel) : null],
    ['Fecha corregida', medicion?.fecha_corregida ? 'Sí' : null],
    ['Notas', medicion?.notas],
  ].filter(([, value]) => hasMetricValue(value));
}

export default function TeamEvolutionDashboard({ players = [], evolutions = [], team }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState('trends');
  const [position, setPosition] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [detailRow, setDetailRow] = useState(null);

  const positionOptions = useMemo(() => {
    const values = Array.from(new Set(players.map((player) => player.posicion).filter(Boolean))).sort();
    return [{ value: '', label: 'Todas' }, ...values.map((value) => ({ value, label: value }))];
  }, [players]);

  const scopedPlayers = useMemo(
    () => (position ? players.filter((player) => player.posicion === position) : players),
    [players, position]
  );

  const scopedPlayerIds = useMemo(
    () => new Set(scopedPlayers.map((player) => String(player.id))),
    [scopedPlayers]
  );

  const scopedEvolutions = useMemo(
    () => evolutions.filter((record) => scopedPlayerIds.has(String(record.jugador_id))),
    [evolutions, scopedPlayerIds]
  );

  const filteredEvolutions = useMemo(() => scopedEvolutions.filter((record) => {
    if (dateFrom && String(record.fecha) < dateFrom) return false;
    if (dateTo && String(record.fecha) > dateTo) return false;
    return true;
  }), [dateFrom, dateTo, scopedEvolutions]);

  const rows = useMemo(() => {
    return latestByPlayer(scopedPlayers, filteredEvolutions).filter((row) => row.records.length > 0);
  }, [filteredEvolutions, scopedPlayers]);

  const allRows = useMemo(
    () => latestByPlayer(scopedPlayers, scopedEvolutions),
    [scopedEvolutions, scopedPlayers]
  );

  const chartData = useMemo(() => aggregateByDate(rows), [rows]);
  const latestRows = rows.filter((row) => row.latest);
  const measuredPct = scopedPlayers.length ? Math.round((latestRows.length / scopedPlayers.length) * 100) : 0;
  const totalRecords = rows.reduce((sum, row) => sum + row.records.length, 0);
  const lastDate = chartData.at(-1)?.fecha;

  const dateCounts = useMemo(() => {
    const counts = new Map();
    scopedEvolutions.forEach((record) => {
      if (!record.fecha) return;
      counts.set(record.fecha, (counts.get(record.fecha) || 0) + 1);
    });
    return counts;
  }, [scopedEvolutions]);

  const availableDates = useMemo(
    () => Array.from(dateCounts.keys()).sort(),
    [dateCounts]
  );
  const currentDay = selectedDate || availableDates.at(-1) || '';
  const daySelectValue = availableDates.includes(currentDay) ? currentDay : null;

  const dateOptions = useMemo(() => (
    [...availableDates].reverse().map((date) => ({
      value: date,
      label: `${formatDate(date)} · ${dateCounts.get(date) || 0}`,
    }))
  ), [availableDates, dateCounts]);

  const dayRows = useMemo(() => allRows.map((row) => {
    const measurement = row.records.find((record) => String(record.fecha) === String(currentDay)) || null;
    const previous = row.records.filter((record) => String(record.fecha) < String(currentDay)).at(-1) || null;
    return {
      ...row,
      measurement,
      previous,
      measuredOnDay: Boolean(measurement),
    };
  }), [allRows, currentDay]);

  const measuredDayRows = dayRows.filter((row) => row.measuredOnDay);
  const missingDayRows = dayRows.filter((row) => !row.measuredOnDay);
  const dayMeasuredPct = scopedPlayers.length ? Math.round((measuredDayRows.length / scopedPlayers.length) * 100) : 0;
  const dayImported = measuredDayRows.filter((row) => row.measurement?.fuente_hoja).length;
  const dayCorrected = measuredDayRows.filter((row) => row.measurement?.fecha_corregida).length;
  const rawColumnTotal = measuredDayRows.reduce((sum, row) => sum + rawMetricEntries(row.measurement).length, 0);

  const dayAverages = METRICS.map((metric) => {
    const values = measuredDayRows
      .map((row) => metricNumber(row.measurement, metric))
      .filter((value) => value !== null);
    return {
      ...metric,
      count: values.length,
      avg: values.length ? number(values.reduce((sum, value) => sum + value, 0) / values.length) : null,
    };
  });

  const detailMeasurement = detailRow?.measurement || null;
  const detailPrevious = detailRow?.previous || null;
  const detailRawEntries = rawMetricEntries(detailMeasurement);

  function handleDownloadCsv() {
    if (viewMode === 'day') {
      downloadCsv(`mediciones-${currentDay || 'dia'}.csv`, buildDayCsv(measuredDayRows, currentDay));
      return;
    }
    downloadCsv('evolucion-equipo.csv', buildTrendCsv(rows));
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
              <ThemeIcon color={viewMode === 'day' ? 'teal' : 'blue'} variant="light" radius="xl" size={42}>
                {viewMode === 'day' ? <IconCalendarStats size={21} /> : <IconChartLine size={21} />}
              </ThemeIcon>
              <Box>
                <Title order={3} fw={850} c="#24291f" lh={1.1}>
                  Evolución de {team?.nombre || 'equipo'}
                </Title>
                <Text size="xs" c="dimmed" mt={2}>
                  {team?.temporada ? `${team.temporada} · ` : ''}{viewMode === 'day' ? 'Mediciones por jornada' : 'Tendencias corporales y cambios recientes'}
                </Text>
              </Box>
            </Group>

            <Group gap="xs" wrap="wrap" justify="flex-end">
              <SegmentedControl
                value={viewMode}
                onChange={setViewMode}
                data={[
                  {
                    value: 'trends',
                    label: (
                      <Group component="span" gap={6} justify="center" wrap="nowrap">
                        <IconChartLine size={16} />
                        <Text component="span" size="sm" fw={700}>Histórico</Text>
                      </Group>
                    ),
                  },
                  {
                    value: 'day',
                    label: (
                      <Group component="span" gap={6} justify="center" wrap="nowrap">
                        <IconCalendarStats size={16} />
                        <Text component="span" size="sm" fw={700}>Jornada</Text>
                      </Group>
                    ),
                  },
                ]}
                aria-label="Modo de visualización"
                color={viewMode === 'day' ? 'teal' : 'blue'}
                radius="xl"
                size="sm"
                styles={{
                  root: { minWidth: 260 },
                  control: { minWidth: 124 },
                  label: { minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' },
                }}
              />
              <Button
                radius="xl"
                size="sm"
                variant="light"
                color="gray"
                leftSection={<IconDownload size={16} />}
                onClick={handleDownloadCsv}
                disabled={viewMode === 'day' ? measuredDayRows.length === 0 : rows.length === 0}
              >
                CSV
              </Button>
            </Group>
          </Group>

          <Paper p={6} radius="xl" shadow="xs" withBorder bg="white" w="100%">
            <Group gap={8} w="100%" wrap="wrap" align="center">
              <Select
                placeholder="Posición"
                leftSection={<IconUsers size={16} style={{ opacity: 0.7 }} />}
                data={positionOptions}
                value={position}
                onChange={(value) => setPosition(value || '')}
                variant="filled"
                radius="xl"
                size="sm"
                searchable
                allowDeselect={false}
                style={{ flex: 1, minWidth: 170 }}
              />

              {viewMode === 'trends' ? (
                <>
                  <DateInput
                    placeholder="Fecha de inicio"
                    leftSection={<IconFilter size={16} style={{ opacity: 0.7 }} />}
                    value={dateValue(dateFrom)}
                    onChange={(value) => setDateFrom(dateInputToIso(value))}
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
                    value={dateValue(dateTo)}
                    onChange={(value) => setDateTo(dateInputToIso(value))}
                    variant="filled"
                    radius="xl"
                    size="sm"
                    valueFormat="DD/MM/YYYY"
                    clearable
                    style={{ flex: 1, minWidth: 160 }}
                  />
                </>
              ) : (
                <>
                  <Select
                    placeholder="Fecha de medición"
                    leftSection={<IconCalendarStats size={16} style={{ opacity: 0.7 }} />}
                    data={dateOptions}
                    value={daySelectValue}
                    onChange={(value) => setSelectedDate(value || '')}
                    variant="filled"
                    radius="xl"
                    size="sm"
                    searchable
                    nothingFoundMessage="Sin jornadas"
                    style={{ flex: 1.2, minWidth: 240 }}
                  />
                </>
              )}
            </Group>
          </Paper>
        </Stack>
      </Paper>

      {viewMode === 'trends' ? (
        <>
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
                  .map((row) => Number(metricRecord(row.records, item, 0)?.[item.key]))
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
                <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 760 + METRICS.length * 128 }}>
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
                            <Text fz="sm" fw={650} c="dark.4">{playerName(row)}</Text>
                            <Text fz="xs" c="dimmed">{row.posicion || 'Sin posición'}</Text>
                          </Table.Td>
                          <Table.Td>{formatDate(latest.fecha)}</Table.Td>
                          {METRICS.map((item) => {
                            const latestMetric = metricRecord(row.records, item, 0);
                            const previousMetric = metricRecord(row.records, item, 1);
                            const val = latestMetric?.[item.key] ?? null;
                            const delta = deltaFor(latestMetric, previousMetric, item);
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
        </>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
              <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Fecha</Text>
              <Title order={3} c="dark.4" mt={8}>{formatDate(currentDay)}</Title>
              <Text size="xs" c="dimmed">{availableDates.length} jornadas registradas</Text>
            </Paper>
            <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
              <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Medidos ese día</Text>
              <Title order={2} c="dark.4" mt={4}>{measuredDayRows.length}/{scopedPlayers.length}</Title>
              <Text size="xs" c="dimmed">{dayMeasuredPct}% de cobertura</Text>
            </Paper>
            <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
              <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Importadas</Text>
              <Title order={2} c="dark.4" mt={4}>{dayImported}</Title>
              <Text size="xs" c="dimmed">{dayCorrected ? `${dayCorrected} fechas corregidas` : 'sin correcciones de fecha'}</Text>
            </Paper>
            <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
              <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Columnas Excel</Text>
              <Title order={2} c="dark.4" mt={4}>{rawColumnTotal}</Title>
              <Text size="xs" c="dimmed">datos crudos disponibles</Text>
            </Paper>
          </SimpleGrid>

          {measuredDayRows.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {dayAverages.filter((metric) => metric.count > 0).map((metric) => (
                <Paper key={metric.key} p="md" radius="lg" withBorder bg="white">
                  <Group justify="space-between" align="flex-start" gap="sm">
                    <Box>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={750}>{metric.label}</Text>
                      <Title order={3} c="dark.4" mt={4}>{metricDisplay(metric.avg, metric.unit)}</Title>
                    </Box>
                    <Badge variant="light" color="gray">{metric.count}/{measuredDayRows.length}</Badge>
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          ) : (
            <NothingFound
              withPaper
              icon={IconCalendarStats}
              title="Sin mediciones ese día"
              description="No hay jugadores medidos para la fecha seleccionada."
            />
          )}

          {measuredDayRows.length > 0 && (
            <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
              <Group justify="space-between" p="md" pb="xs" align="center">
                <Box>
                  <Title order={4} fw={800} c="dark.4">Mediciones del día</Title>
                  <Text size="xs" c="dimmed">{formatDate(currentDay)} · {measuredDayRows.length} jugadores</Text>
                </Box>
                <Badge variant="light" color="teal">{dayMeasuredPct}% cobertura</Badge>
              </Group>
              <ScrollArea>
                <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 880 + METRICS.length * 132 }}>
                  <Table.Thead bg="gray.0">
                    <Table.Tr>
                      <Table.Th style={{ paddingLeft: 24 }}>Jugador</Table.Th>
                      <Table.Th>Origen</Table.Th>
                      {METRICS.map((item) => <Table.Th key={item.key}>{item.label}</Table.Th>)}
                      <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {measuredDayRows.map((row) => (
                      <Table.Tr
                        key={`${row.id}-${currentDay}`}
                        onClick={() => setDetailRow(row)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Table.Td style={{ paddingLeft: 24 }}>
                          <Text fz="sm" fw={650} c="dark.4">{playerName(row)}</Text>
                          <Text fz="xs" c="dimmed">{row.posicion || 'Sin posición'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="xs" fw={650} c="dark.4">{row.measurement?.fuente_hoja || 'Manual'}</Text>
                          <Text fz="xs" c="dimmed">{row.measurement?.fuente_fila ? `Fila ${row.measurement.fuente_fila}` : formatDate(row.measurement?.fecha)}</Text>
                        </Table.Td>
                        {METRICS.map((item) => {
                          const value = metricValue(row.measurement, item);
                          const delta = deltaFor(row.measurement, row.previous, item);
                          return (
                            <Table.Td key={item.key}>
                              <Stack gap={3}>
                                <Text fz="sm" fw={650} c="dark.4">{metricDisplay(value, item.unit)}</Text>
                                {delta !== null && delta !== 0 && (
                                  <Badge
                                    color={deltaColor(delta, item)}
                                    variant="light"
                                    size="xs"
                                    radius="sm"
                                    w="fit-content"
                                  >
                                    {delta > 0 ? `+${delta}` : delta}
                                  </Badge>
                                )}
                              </Stack>
                            </Table.Td>
                          );
                        })}
                        <Table.Td>
                          <Group gap={4} wrap="nowrap">
                            <Tooltip label="Ver detalle" withArrow>
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                radius="xl"
                                aria-label="Ver detalle"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDetailRow(row);
                                }}
                              >
                                <IconEye size={17} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Abrir ficha" withArrow>
                              <ActionIcon
                                component={Anchor}
                                href={`/dashboard/jugador/${row.id}/metricas/mediciones`}
                                variant="subtle"
                                color="gray"
                                radius="xl"
                                aria-label="Abrir ficha"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <IconExternalLink size={17} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          )}

          {missingDayRows.length > 0 && (
            <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
              <Group justify="space-between" p="md" pb="xs" align="center">
                <Box>
                  <Title order={4} fw={800} c="dark.4">Sin medición ese día</Title>
                  <Text size="xs" c="dimmed">{missingDayRows.length} jugadores sin registro en {formatDate(currentDay)}</Text>
                </Box>
                <Badge variant="light" color="gray">{missingDayRows.length}</Badge>
              </Group>
              <ScrollArea.Autosize mah={260}>
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead bg="gray.0">
                    <Table.Tr>
                      <Table.Th style={{ paddingLeft: 24 }}>Jugador</Table.Th>
                      <Table.Th>Última medición</Table.Th>
                      <Table.Th>Registros</Table.Th>
                      <Table.Th>Acción</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {missingDayRows.map((row) => (
                      <Table.Tr key={`missing-${row.id}`}>
                        <Table.Td style={{ paddingLeft: 24 }}>
                          <Text fz="sm" fw={650} c="dark.4">{playerName(row)}</Text>
                          <Text fz="xs" c="dimmed">{row.posicion || 'Sin posición'}</Text>
                        </Table.Td>
                        <Table.Td>{formatDate(row.latest?.fecha)}</Table.Td>
                        <Table.Td>{row.records.length}</Table.Td>
                        <Table.Td>
                          <Button
                            component={Anchor}
                            href={`/dashboard/jugador/${row.id}/metricas/mediciones`}
                            size="xs"
                            radius="xl"
                            variant="light"
                            color="gray"
                            leftSection={<IconExternalLink size={14} />}
                          >
                            Abrir ficha
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea.Autosize>
            </Paper>
          )}
        </>
      )}

      <Modal
        opened={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        title={
          <Group gap="xs">
            <IconEye size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Text fw={700}>
              {detailRow ? `${playerName(detailRow)} · ${formatDate(detailMeasurement?.fecha)}` : 'Detalle de medición'}
            </Text>
          </Group>
        }
        size="xl"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        {detailRow && detailMeasurement && (
          <Stack gap="lg">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Badge variant="light" color="teal">{detailRow.posicion || 'Sin posición'}</Badge>
                {detailMeasurement.fuente_hoja && <Badge variant="light" color="blue">{detailMeasurement.fuente_hoja}</Badge>}
                {detailMeasurement.fecha_corregida && <Badge variant="light" color="yellow">Fecha corregida</Badge>}
              </Group>
              <Button
                component={Anchor}
                href={`/dashboard/jugador/${detailRow.id}/metricas/mediciones`}
                size="xs"
                radius="xl"
                variant="light"
                leftSection={<IconExternalLink size={14} />}
              >
                Abrir ficha
              </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={800} mb={6}>Origen</Text>
                <Table variant="simple" verticalSpacing={5}>
                  <Table.Tbody>
                    {sourceRows(detailMeasurement).map(([label, value]) => (
                      <Table.Tr key={label}>
                        <Table.Th style={{ width: '48%' }}>{label}</Table.Th>
                        <Table.Td>{value}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>

              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={800} mb={6}>Cambios vs anterior</Text>
                <Table variant="simple" verticalSpacing={5}>
                  <Table.Tbody>
                    {METRICS.map((metric) => {
                      const value = metricValue(detailMeasurement, metric);
                      const delta = deltaFor(detailMeasurement, detailPrevious, metric);
                      if (!hasMetricValue(value)) return null;
                      return (
                        <Table.Tr key={metric.key}>
                          <Table.Th>{metric.label}</Table.Th>
                          <Table.Td ta="right" fw={650}>{metricDisplay(value, metric.unit)}</Table.Td>
                          <Table.Td ta="right">
                            {delta !== null && delta !== 0 ? (
                              <Badge color={deltaColor(delta, metric)} variant="light" size="xs">
                                {delta > 0 ? `+${delta}` : delta}
                              </Badge>
                            ) : '-'}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Box>

              {MEASUREMENT_DETAIL_SECTIONS.map((section) => {
                const sectionRows = section.fields
                  .map((field) => ({ ...field, value: metricValue(detailMeasurement, field) }))
                  .filter((field) => hasMetricValue(field.value));
                if (!sectionRows.length) return null;

                return (
                  <Box key={section.title}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={800} mb={6}>{section.title}</Text>
                    <Table variant="simple" verticalSpacing={5}>
                      <Table.Tbody>
                        {sectionRows.map((field) => (
                          <Table.Tr key={field.key}>
                            <Table.Th style={{ width: '58%' }}>{field.label}</Table.Th>
                            <Table.Td ta="right" fw={650}>{metricDisplay(field.value, field.unit)}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Box>
                );
              })}
            </SimpleGrid>

            {detailRawEntries.length > 0 && (
              <Box>
                <Group justify="space-between" align="center" mb="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Columnas Excel importadas</Text>
                  <Badge variant="light" color="gray">{detailRawEntries.length}</Badge>
                </Group>
                <ScrollArea h={280} offsetScrollbars>
                  <Table striped highlightOnHover verticalSpacing={5} style={{ minWidth: 620 }}>
                    <Table.Thead bg="gray.0">
                      <Table.Tr>
                        <Table.Th>Campo original</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>Valor</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {detailRawEntries.map(([label, value]) => (
                        <Table.Tr key={label}>
                          <Table.Td>{label}</Table.Td>
                          <Table.Td ta="right" fw={650}>{displayRawValue(value)}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Box>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
