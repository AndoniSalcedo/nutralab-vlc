'use client';

import { useMemo, useState } from 'react';
import { playerFullName as playerName } from '@/lib/utils';
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  MultiSelect,
  Paper,
  ScrollArea,
  SegmentedControl,
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
import MeasurementDetailModal from '@/components/modals/MeasurementDetailModal';
import { DateInput } from '@mantine/dates';
import { useRouter } from 'next/navigation';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
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
  IconPlus,
  IconX,
} from '@tabler/icons-react';
import NothingFound from '@/components/NothingFound';
import {
  MEASUREMENT_DETAIL_SECTIONS,
  TREND_MEASUREMENT_METRICS,
  formatMetricNumber,
  formatMetricValue,
  hasMetricValue,
  metricValue,
  getSeason,
} from '@/lib/measurement-metrics';

const METRICS = TREND_MEASUREMENT_METRICS;

function formatSeasonOption(s) {
  if (!s) return '';
  const [startYear, endYear] = s.split('/');
  return `Temporada ${s} (julio ${startYear} - junio ${endYear})`;
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`));
}

function formatShortDate(value) {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit' }).format(date);
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

function number(value, digits = 2) {
  return formatMetricNumber(value, digits);
}

function metricDisplay(value, unit) {
  return formatMetricValue(value, unit);
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
  if (typeof value === 'number') return String(formatMetricNumber(value, 2) ?? value);
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

function checkFilterMatch(val, operator, filterVal) {
  if (val === null || val === undefined || val === '') return false;
  const numVal = Number(val);
  const targetVal = Number(filterVal);
  if (Number.isNaN(numVal) || Number.isNaN(targetVal)) return false;
  switch (operator) {
    case '>': return numVal > targetVal;
    case '<': return numVal < targetVal;
    case '>=': return numVal >= targetVal;
    case '<=': return numVal <= targetVal;
    case '=': return numVal === targetVal;
    default: return false;
  }
}

export default function TeamEvolutionDashboard({ players = [], evolutions = [], team }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState('trends');
  const [position, setPosition] = useState('');
  const [selectedSeason, setSelectedSeason] = useState(() => {
    const seasons = Array.from(new Set((evolutions || []).map((e) => getSeason(e.fecha)).filter(Boolean))).sort().reverse();
    return seasons[0] || '';
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDate, setSelectedDate] = useState('all');
  const [visibleMetricKeys, setVisibleMetricKeys] = useState(() => {
    return METRICS.map((m) => m.key);
  });
  const [detailRow, setDetailRow] = useState(null);

  // States for multi-metric filters
  const [activeFilters, setActiveFilters] = useState([]);
  const [newFilterMetric, setNewFilterMetric] = useState('porcentaje_grasa');
  const [newFilterOperator, setNewFilterOperator] = useState('>');
  const [newFilterValue, setNewFilterValue] = useState('');

  // States for sorting the table
  const [sortField, setSortField] = useState('alerts');
  const [sortDirection, setSortDirection] = useState('desc');

  const ALL_METRICS_MAP = useMemo(() => {
    const map = new Map();
    METRICS.forEach(m => map.set(m.key, m));
    MEASUREMENT_DETAIL_SECTIONS.forEach(sec => {
      sec.fields.forEach(f => {
        if (!map.has(f.key)) map.set(f.key, f);
      });
    });
    return map;
  }, []);

  const filterMetricOptions = useMemo(() => {
    const seen = new Set();
    const list = [];
    METRICS.forEach(m => {
      if (!seen.has(m.key)) {
        seen.add(m.key);
        list.push({ value: m.key, label: m.unit ? `${m.label} (${m.unit})` : m.label });
      }
    });
    MEASUREMENT_DETAIL_SECTIONS.forEach(sec => {
      sec.fields.forEach(f => {
        if (!seen.has(f.key)) {
          seen.add(f.key);
          list.push({ value: f.key, label: f.unit ? `${f.label} (${f.unit})` : f.label });
        }
      });
    });
    return list;
  }, []);

  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    if (newMode === 'day' && selectedDate === 'all') {
      setSelectedDate(availableDates.at(-1) || '');
    }
  };

  const handleDateChange = (value) => {
    setSelectedDate(value || '');
    if (value === 'all' && viewMode === 'day') {
      setViewMode('ranking');
    }
  };

  const positionOptions = useMemo(() => {
    const values = Array.from(new Set(players.map((player) => player.posicion).filter(Boolean))).sort();
    return [{ value: '', label: 'Todas' }, ...values.map((value) => ({ value, label: value }))];
  }, [players]);

  const seasonOptions = useMemo(() => {
    const seasons = Array.from(new Set(evolutions.map((e) => getSeason(e.fecha)).filter(Boolean))).sort().reverse();
    return [{ value: '', label: 'Todas las temporadas' }, ...seasons.map((s) => ({ value: s, label: formatSeasonOption(s) }))];
  }, [evolutions]);

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

  const seasonEvolutions = useMemo(() => {
    if (!selectedSeason) return scopedEvolutions;
    return scopedEvolutions.filter((record) => getSeason(record.fecha) === selectedSeason);
  }, [scopedEvolutions, selectedSeason]);

  const filteredEvolutions = useMemo(() => seasonEvolutions.filter((record) => {
    if (dateFrom && String(record.fecha) < dateFrom) return false;
    if (dateTo && String(record.fecha) > dateTo) return false;
    return true;
  }), [dateFrom, dateTo, seasonEvolutions]);

  const rows = useMemo(() => {
    return latestByPlayer(scopedPlayers, filteredEvolutions).filter((row) => row.records.length > 0);
  }, [filteredEvolutions, scopedPlayers]);

  const allRows = useMemo(
    () => latestByPlayer(scopedPlayers, seasonEvolutions),
    [seasonEvolutions, scopedPlayers]
  );

  const chartData = useMemo(() => aggregateByDate(rows), [rows]);
  const latestRows = rows.filter((row) => row.latest);
  const measuredPct = scopedPlayers.length ? Math.round((latestRows.length / scopedPlayers.length) * 100) : 0;
  const totalRecords = rows.reduce((sum, row) => sum + row.records.length, 0);
  const lastDate = chartData.at(-1)?.fecha;

  const dateCounts = useMemo(() => {
    const counts = new Map();
    seasonEvolutions.forEach((record) => {
      if (!record.fecha) return;
      counts.set(record.fecha, (counts.get(record.fecha) || 0) + 1);
    });
    return counts;
  }, [seasonEvolutions]);

  const availableDates = useMemo(
    () => Array.from(dateCounts.keys()).sort(),
    [dateCounts]
  );
  const currentDay = (selectedDate === 'all' || (selectedDate && availableDates.includes(selectedDate))) ? selectedDate : (availableDates.at(-1) || '');
  const daySelectValue = (selectedDate === 'all' || availableDates.includes(currentDay)) ? currentDay : null;

  const dateOptions = useMemo(() => {
    const options = [...availableDates].reverse().map((date) => ({
      value: date,
      label: `${formatDate(date)} · ${dateCounts.get(date) || 0}`,
    }));
    return [
      { value: 'all', label: 'Todas las mediciones' },
      ...options,
    ];
  }, [availableDates, dateCounts]);

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

  const measuredDayRows = useMemo(() => {
    if (selectedDate === 'all') {
      return allRows
        .filter((row) => row.records.length > 0)
        .map((row) => ({
          ...row,
          measuredOnDay: true,
        }));
    }
    return dayRows.filter((row) => row.measuredOnDay);
  }, [allRows, dayRows, selectedDate]);
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

  const displayedMetrics = useMemo(() => {
    const base = [...METRICS];
    activeFilters.forEach((filter) => {
      if (!base.some((m) => m.key === filter.metric)) {
        const extraConfig = ALL_METRICS_MAP.get(filter.metric);
        if (extraConfig) {
          base.push(extraConfig);
        }
      }
    });
    return base.filter((m) => visibleMetricKeys.includes(m.key));
  }, [activeFilters, ALL_METRICS_MAP, visibleMetricKeys]);

  const multiSelectData = useMemo(() => {
    const base = [...METRICS];
    activeFilters.forEach((filter) => {
      if (!base.some((m) => m.key === filter.metric)) {
        const extraConfig = ALL_METRICS_MAP.get(filter.metric);
        if (extraConfig) {
          base.push(extraConfig);
        }
      }
    });
    return base.map((m) => ({ value: m.key, label: m.label }));
  }, [activeFilters, ALL_METRICS_MAP]);

  const maxMeasurements = useMemo(() => {
    if (selectedDate !== 'all') return 1;
    let max = 0;
    measuredDayRows.forEach((row) => {
      if (row.records.length > max) {
        max = row.records.length;
      }
    });
    return max || 1;
  }, [measuredDayRows, selectedDate]);

  const filteredPlayersTableData = useMemo(() => {
    return measuredDayRows.map((row) => {
      const alertMatches = {};
      let totalAlerts = 0;

      if (selectedDate === 'all') {
        activeFilters.forEach((filter) => {
          const config = ALL_METRICS_MAP.get(filter.metric);
          if (config) {
            row.records.forEach((record, idx) => {
              const val = metricValue(record, config);
              const matches = checkFilterMatch(val, filter.operator, filter.value);
              if (matches) {
                alertMatches[`${filter.metric}_${idx}`] = true;
                totalAlerts += 1;
              }
            });
          }
        });
      } else {
        activeFilters.forEach((filter) => {
          const config = ALL_METRICS_MAP.get(filter.metric);
          const val = config ? metricValue(row.measurement, config) : null;
          const matches = checkFilterMatch(val, filter.operator, filter.value);
          if (matches) {
            alertMatches[filter.metric] = true;
            totalAlerts += 1;
          }
        });
      }

      return {
        ...row,
        alertMatches,
        totalAlerts,
      };
    });
  }, [measuredDayRows, activeFilters, ALL_METRICS_MAP, selectedDate]);

  const sortedTableData = useMemo(() => {
    const data = [...filteredPlayersTableData];
    data.sort((a, b) => {
      let valA, valB;

      if (sortField === 'name') {
        valA = playerName(a).toLowerCase();
        valB = playerName(b).toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      if (sortField === 'posicion') {
        valA = (a.posicion || '').toLowerCase();
        valB = (b.posicion || '').toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      if (sortField === 'alerts') {
        valA = a.totalAlerts;
        valB = b.totalAlerts;
        if (valA !== valB) {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return playerName(a).localeCompare(playerName(b));
      }

      // Sort by metric
      const metricConfig = ALL_METRICS_MAP.get(sortField);
      if (selectedDate === 'all') {
        valA = metricNumber(a.latest, metricConfig);
        valB = metricNumber(b.latest, metricConfig);
      } else {
        valA = a.measuredOnDay ? metricNumber(a.measurement, metricConfig) : null;
        valB = b.measuredOnDay ? metricNumber(b.measurement, metricConfig) : null;
      }

      if (valA === null && valB === null) return 0;
      if (valA === null) return 1;
      if (valB === null) return -1;

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
    return data;
  }, [filteredPlayersTableData, sortField, sortDirection, ALL_METRICS_MAP, selectedDate]);


  const sortOptions = useMemo(() => {
    const options = [
      { value: 'alerts_desc', label: 'Más Alertas' },
      { value: 'alerts_asc', label: 'Menos Alertas' },
      { value: 'name_asc', label: 'Jugador (A-Z)' },
      { value: 'name_desc', label: 'Jugador (Z-A)' },
      { value: 'posicion_asc', label: 'Posición (A-Z)' },
      { value: 'posicion_desc', label: 'Posición (Z-A)' },
    ];
    displayedMetrics.forEach((m) => {
      options.push({ value: `${m.key}_desc`, label: `${m.label} (mayor primero)` });
      options.push({ value: `${m.key}_asc`, label: `${m.label} (menor primero)` });
    });
    return options;
  }, [displayedMetrics]);

  const handleSortOptionChange = (value) => {
    if (!value) return;
    const underscoreIndex = value.lastIndexOf('_');
    if (underscoreIndex === -1) return;
    const field = value.substring(0, underscoreIndex);
    const direction = value.substring(underscoreIndex + 1);
    setSortField(field);
    setSortDirection(direction);
  };

  const detailMeasurement = detailRow?.measurement || null;
  const detailPrevious = detailRow?.previous || null;
  const detailRawEntries = rawMetricEntries(detailMeasurement);

  function buildFiltersCsv(data, metricsList) {
    const headers = ['Jugador', 'Posicion', 'Alertas'];

    if (selectedDate === 'all') {
      metricsList.forEach((m) => {
        for (let idx = 0; idx < maxMeasurements; idx++) {
          headers.push(`${m.label} ${idx + 1}`);
        }
      });
    } else {
      metricsList.forEach((m) => {
        headers.push(`${m.label} (${m.unit || ''})`);
      });
    }

    const csvRows = data.map((row) => {
      const line = [
        playerName(row),
        row.posicion || '',
        row.totalAlerts,
      ];

      if (selectedDate === 'all') {
        metricsList.forEach((m) => {
          for (let idx = 0; idx < maxMeasurements; idx++) {
            const record = row.records[idx] || null;
            const val = record ? metricValue(record, m) : null;
            line.push(val !== null && val !== undefined ? val : '');
          }
        });
      } else {
        metricsList.forEach((m) => {
          const val = row.measuredOnDay ? metricValue(row.measurement, m) : null;
          line.push(val !== null && val !== undefined ? val : '');
        });
      }

      return line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',');
    });

    return [headers.join(','), ...csvRows].join('\n');
  }

  function handleDownloadCsv() {
    if (viewMode === 'day') {
      downloadCsv(`mediciones-${currentDay || 'dia'}.csv`, buildDayCsv(measuredDayRows, currentDay));
      return;
    }
    if (viewMode === 'ranking') {
      const fileName = selectedDate === 'all' ? 'filtros-equipo-todas-las-mediciones.csv' : `filtros-equipo-${currentDay || 'dia'}.csv`;
      downloadCsv(fileName, buildFiltersCsv(sortedTableData, displayedMetrics));
      return;
    }
    downloadCsv('evolucion-equipo.csv', buildTrendCsv(rows));
  }

  return (
    <BoneyardSkeleton name="team-evolution" loading={false}>
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
                <ThemeIcon color={viewMode === 'day' ? 'teal' : viewMode === 'ranking' ? 'grape' : 'blue'} variant="light" radius="xl" size={42}>
                  {viewMode === 'day' ? <IconCalendarStats size={21} /> : viewMode === 'ranking' ? <IconFilter size={21} /> : <IconChartLine size={21} />}
                </ThemeIcon>
                <Box>
                  <Title order={3} fw={850} c="#24291f" lh={1.1}>
                    Evolución de {team?.nombre || 'equipo'}
                  </Title>
                  <Text size="xs" c="dimmed" mt={2}>
                    {team?.temporada ? `${team.temporada} · ` : ''}
                    {viewMode === 'day'
                      ? 'Mediciones por jornada'
                      : viewMode === 'ranking'
                        ? 'Comparativas, umbrales y alertas'
                        : 'Tendencias corporales y cambios recientes'}
                  </Text>
                </Box>
              </Group>

              <Group gap="xs" wrap="wrap" justify="flex-end">
                <SegmentedControl
                  value={viewMode}
                  onChange={handleViewModeChange}
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
                    {
                      value: 'ranking',
                      label: (
                        <Group component="span" gap={6} justify="center" wrap="nowrap">
                          <IconFilter size={16} />
                          <Text component="span" size="sm" fw={700}>Filtros</Text>
                        </Group>
                      ),
                    },
                  ]}
                  aria-label="Modo de visualización"
                  color={viewMode === 'day' ? 'teal' : viewMode === 'ranking' ? 'grape' : 'blue'}
                  radius="xl"
                  size="sm"
                  styles={{
                    root: { minWidth: 380 },
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

                <Select
                  placeholder="Temporada"
                  leftSection={<IconCalendarStats size={16} style={{ opacity: 0.7 }} />}
                  data={seasonOptions}
                  value={selectedSeason}
                  onChange={(value) => setSelectedSeason(value || '')}
                  variant="filled"
                  radius="xl"
                  size="sm"
                  searchable
                  allowDeselect={false}
                  style={{ flex: 1, minWidth: 180 }}
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
                      onChange={handleDateChange}
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

        {viewMode === 'trends' && (
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
                                  <stop offset="5%" stopColor={item.color} stopOpacity={0.4} />
                                  <stop offset="95%" stopColor={item.color} stopOpacity={0.05} />
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
        )}

        {viewMode === 'day' && (
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

        {viewMode === 'ranking' && (
          <Stack gap="lg">
            <Paper p="md" radius="lg" withBorder bg="white">
              <Stack gap="md">
                <Box>
                  <Text size="xs" fw={700} c="dimmed" mb={8} tt="uppercase">
                    Métricas Visibles en la Tabla
                  </Text>
                  <MultiSelect
                    placeholder="Selecciona las métricas a mostrar..."
                    data={multiSelectData}
                    value={visibleMetricKeys}
                    onChange={setVisibleMetricKeys}
                    radius="xl"
                    size="sm"
                    variant="filled"
                    clearable
                    searchable
                  />
                </Box>

                <hr style={{ border: 0, borderTop: '1px solid var(--mantine-color-gray-2)', margin: '6px 0' }} />

                <Text size="sm" fw={800} c="dark.4" tt="uppercase">
                  Configurar Filtros de Alerta
                </Text>

                <Group gap="md" align="flex-end" wrap="wrap">
                  <Box style={{ flex: 1, minWidth: 200 }}>
                    <Text size="xs" fw={700} c="dimmed" mb={5}>MÉTRICA</Text>
                    <Select
                      placeholder="Selecciona una métrica..."
                      leftSection={<IconFilter size={16} style={{ opacity: 0.7 }} />}
                      data={filterMetricOptions}
                      value={newFilterMetric}
                      onChange={(value) => {
                        setNewFilterMetric(value || '');
                        setNewFilterValue('');
                      }}
                      variant="filled"
                      radius="xl"
                      size="sm"
                      searchable
                      allowDeselect={false}
                    />
                  </Box>

                  <Box style={{ width: 150 }}>
                    <Text size="xs" fw={700} c="dimmed" mb={5}>CONDICIÓN</Text>
                    <Select
                      placeholder="Condición"
                      data={[
                        { value: '>', label: 'Mayor que (>)' },
                        { value: '<', label: 'Menor que (<)' },
                        { value: '>=', label: 'Mayor o igual (>=)' },
                        { value: '<=', label: 'Menor o igual (<=)' },
                        { value: '=', label: 'Igual a (=)' },
                      ]}
                      value={newFilterOperator}
                      onChange={(value) => setNewFilterOperator(value || '>')}
                      disabled={!newFilterMetric}
                      variant="filled"
                      radius="xl"
                      size="sm"
                      allowDeselect={false}
                    />
                  </Box>

                  <Box style={{ width: 130 }}>
                    <Text size="xs" fw={700} c="dimmed" mb={5}>UMBRAL</Text>
                    <TextInput
                      placeholder={
                        ALL_METRICS_MAP.get(newFilterMetric)?.unit
                          ? `Ej: 10`
                          : 'Valor'
                      }
                      rightSection={
                        ALL_METRICS_MAP.get(newFilterMetric)?.unit ? (
                          <Text size="xs" c="dimmed" pr="xs">
                            {ALL_METRICS_MAP.get(newFilterMetric).unit}
                          </Text>
                        ) : null
                      }
                      value={newFilterValue}
                      onChange={(event) => setNewFilterValue(event.currentTarget.value)}
                      disabled={!newFilterMetric}
                      type="number"
                      step="any"
                      variant="filled"
                      radius="xl"
                      size="sm"
                    />
                  </Box>

                  <Button
                    color="grape"
                    radius="xl"
                    size="sm"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                      if (!newFilterMetric || newFilterValue === '') return;
                      const id = Date.now().toString();
                      setActiveFilters([
                        ...activeFilters,
                        {
                          id,
                          metric: newFilterMetric,
                          operator: newFilterOperator,
                          value: newFilterValue,
                        },
                      ]);
                      if (!visibleMetricKeys.includes(newFilterMetric)) {
                        setVisibleMetricKeys([...visibleMetricKeys, newFilterMetric]);
                      }
                      setNewFilterValue('');
                    }}
                    disabled={!newFilterMetric || newFilterValue === ''}
                  >
                    Añadir Filtro
                  </Button>

                  <Box style={{ width: 220 }}>
                    <Text size="xs" fw={700} c="dimmed" mb={5}>ORDENAR POR</Text>
                    <Select
                      placeholder="Ordenar por..."
                      data={sortOptions}
                      value={`${sortField}_${sortDirection}`}
                      onChange={handleSortOptionChange}
                      variant="filled"
                      radius="xl"
                      size="sm"
                      allowDeselect={false}
                    />
                  </Box>
                </Group>


                <Box mt="xs">
                  <Text size="xs" fw={700} c="dimmed" mb={8}>
                    FILTROS ACTIVOS ({activeFilters.length})
                  </Text>
                  {activeFilters.length > 0 ? (
                    <Group gap="xs" wrap="wrap">
                      {activeFilters.map((filter) => {
                        const config = ALL_METRICS_MAP.get(filter.metric);
                        const label = config ? config.label : filter.metric;
                        const unit = config?.unit ? ` ${config.unit}` : '';
                        return (
                          <Badge
                            key={filter.id}
                            variant="light"
                            color="red"
                            size="lg"
                            radius="xl"
                            pr={3}
                            rightSection={
                              <ActionIcon
                                size="xs"
                                color="red"
                                radius="xl"
                                variant="subtle"
                                onClick={() =>
                                  setActiveFilters(
                                    activeFilters.filter((f) => f.id !== filter.id)
                                  )
                                }
                              >
                                <IconX size={10} />
                              </ActionIcon>
                            }
                          >
                            {`${label} ${filter.operator} ${filter.value}${unit}`}
                          </Badge>
                        );
                      })}
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed" fs="italic">
                      No hay filtros activos. Las métricas de los jugadores se compararán con los filtros que agregues arriba.
                    </Text>
                  )}
                </Box>
              </Stack>
            </Paper>

            {sortedTableData.length > 0 ? (
              <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
                <Group justify="space-between" p="md" pb="xs" align="center">
                  <Box>
                    <Title order={4} fw={800} c="dark.4">
                      Tabla de Filtros de Plantilla
                    </Title>
                    <Text size="xs" c="dimmed">
                      {selectedDate === 'all' ? 'Temporada completa' : formatDate(currentDay)} · {sortedTableData.length} jugadores · Ordenado por:{' '}
                      <Text span fw={700} c="grape.7">
                        {sortField === 'alerts'
                          ? 'Alertas'
                          : sortField === 'name'
                            ? 'Nombre'
                            : sortField === 'posicion'
                              ? 'Posición'
                              : ALL_METRICS_MAP.get(sortField)?.label || sortField} ({sortDirection === 'asc' ? 'ascendente' : 'descendente'})
                      </Text>
                    </Text>
                  </Box>
                  {activeFilters.length > 0 && (
                    <Badge variant="light" color="red" size="lg">
                      {sortedTableData.filter((r) => r.totalAlerts > 0).length} de {sortedTableData.length} con alertas
                    </Badge>
                  )}
                </Group>

                <ScrollArea>
                  <Table
                    verticalSpacing="sm"
                    highlightOnHover
                    style={{ minWidth: 400 + (selectedDate === 'all' ? displayedMetrics.length * maxMeasurements * 90 : displayedMetrics.length * 110) }}
                  >
                    <Table.Thead bg="gray.0">
                      <Table.Tr>
                        <Table.Th
                          style={{
                            position: 'sticky',
                            left: 0,
                            background: 'var(--mantine-color-gray-0)',
                            zIndex: 2,
                            paddingLeft: 24,
                            boxShadow: '2px 0 5px -2px rgba(0,0,0,0.15)',
                          }}
                        >
                          <Text fz="xs" fw={700} c="dark.4">
                            Jugador
                          </Text>
                        </Table.Th>

                        <Table.Th w={100} style={{ textAlign: 'center' }}>
                          <Text fz="xs" fw={700} c="dark.4">
                            Alertas
                          </Text>
                        </Table.Th>

                        {displayedMetrics.map((item) => {
                          if (selectedDate === 'all') {
                            return Array.from({ length: maxMeasurements }).map((_, idx) => (
                              <Table.Th
                                key={`${item.key}_${idx}`}
                                style={{
                                  whiteSpace: 'nowrap',
                                  borderLeft: idx === 0 ? '1px solid var(--mantine-color-gray-3)' : undefined,
                                }}
                              >
                                <Group gap={6} wrap="nowrap">
                                  <Box
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      backgroundColor: item.color || '#adb5bd',
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Stack gap={0}>
                                    <Text fz="xs" fw={700} c="dark.4">
                                      {item.label} {idx + 1}
                                    </Text>
                                    {item.unit && (
                                      <Text fz="9px" c="dimmed" fw={500}>
                                        ({item.unit})
                                      </Text>
                                    )}
                                  </Stack>
                                </Group>
                              </Table.Th>
                            ));
                          }
                          return (
                            <Table.Th
                              key={item.key}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              <Group gap={6} wrap="nowrap">
                                <Box
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: item.color || '#adb5bd',
                                    flexShrink: 0,
                                  }}
                                />
                                <Stack gap={0}>
                                  <Text fz="xs" fw={700} c="dark.4">
                                    {item.label}
                                  </Text>
                                  {item.unit && (
                                    <Text fz="10px" c="dimmed" fw={500}>
                                      ({item.unit})
                                    </Text>
                                  )}
                                </Stack>
                              </Group>
                            </Table.Th>
                          );
                        })}

                        <Table.Th w={80} style={{ textAlign: 'center' }}>Acción</Table.Th>
                      </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                      {sortedTableData.map((row) => (
                        <Table.Tr
                          key={selectedDate === 'all' ? `all-${row.id}` : `${row.id}-${currentDay}`}
                          onClick={() => router.push(`/dashboard/jugador/${row.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Table.Td
                            style={{
                              position: 'sticky',
                              left: 0,
                              background: 'white',
                              zIndex: 1,
                              paddingLeft: 24,
                              boxShadow: '2px 0 5px -2px rgba(0,0,0,0.15)',
                            }}
                          >
                            <Text fz="sm" fw={650} c="dark.4">
                              {playerName(row)}
                            </Text>
                            <Text fz="xs" c="dimmed">
                              {row.posicion || 'Sin posición'}
                            </Text>
                          </Table.Td>

                          <Table.Td style={{ textAlign: 'center' }}>
                            {row.totalAlerts > 0 ? (
                              <Badge color="red" variant="filled" size="sm" radius="xl">
                                {row.totalAlerts}
                              </Badge>
                            ) : (
                              <Badge color="gray" variant="light" size="sm" radius="xl">
                                0
                              </Badge>
                            )}
                          </Table.Td>

                          {displayedMetrics.map((item) => {
                            if (selectedDate === 'all') {
                              return Array.from({ length: maxMeasurements }).map((_, idx) => {
                                const record = row.records[idx] || null;
                                const value = record ? metricValue(record, item) : null;
                                const matches = row.alertMatches[`${item.key}_${idx}`];
                                const dateStr = record?.fecha ? formatShortDate(record.fecha) : '';

                                return (
                                  <Table.Td
                                    key={`${item.key}_${idx}`}
                                    style={{
                                      borderLeft: idx === 0 ? '1px solid var(--mantine-color-gray-2)' : undefined,
                                      ...(matches
                                        ? {
                                          backgroundColor: 'var(--mantine-color-red-0)',
                                          color: 'var(--mantine-color-red-8)',
                                          fontWeight: 700,
                                          transition: 'background-color 0.2s ease',
                                        }
                                        : {}),
                                    }}
                                  >
                                    <Stack gap={1} align="center">
                                      <Text fz="sm" fw={matches ? 700 : 500} ta="center">
                                        {metricDisplay(value, '')}
                                      </Text>
                                      {dateStr && (
                                        <Text fz="9px" c="dimmed" fw={500} style={{ display: 'block' }} ta="center">
                                          {dateStr}
                                        </Text>
                                      )}
                                    </Stack>
                                  </Table.Td>
                                );
                              });
                            }

                            const hasVal = row.measuredOnDay;
                            const value = hasVal ? metricValue(row.measurement, item) : null;
                            const matches = row.alertMatches[item.key];

                            return (
                              <Table.Td
                                key={item.key}
                                style={
                                  matches
                                    ? {
                                      backgroundColor: 'var(--mantine-color-red-0)',
                                      color: 'var(--mantine-color-red-8)',
                                      fontWeight: 700,
                                      transition: 'background-color 0.2s ease',
                                    }
                                    : undefined
                                }
                              >
                                <Text fz="sm" fw={matches ? 700 : 500}>
                                  {metricDisplay(value, '')}
                                </Text>
                              </Table.Td>
                            );
                          })}

                          <Table.Td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                            <Tooltip label="Ver mediciones" withArrow>
                              <ActionIcon
                                component={Anchor}
                                href={`/dashboard/jugador/${row.id}/metricas/mediciones`}
                                variant="subtle"
                                color="gray"
                                radius="xl"
                                aria-label="Ver mediciones"
                              >
                                <IconExternalLink size={17} />
                              </ActionIcon>
                            </Tooltip>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            ) : (
              <NothingFound
                withPaper
                icon={IconFilter}
                title="Sin datos"
                description="No hay jugadores medidos con la métrica seleccionada para los filtros de posición y temporada actuales."
              />
            )}
          </Stack>
        )}

        <MeasurementDetailModal
          opened={Boolean(detailRow)}
          onClose={() => setDetailRow(null)}
          detailRow={detailRow}
          detailMeasurement={detailMeasurement}
          detailPrevious={detailPrevious}
          playerName={playerName}
          formatDate={formatDate}
          sourceRows={sourceRows}
          metricValue={metricValue}
          deltaFor={deltaFor}
          hasMetricValue={hasMetricValue}
          metricDisplay={metricDisplay}
          deltaColor={deltaColor}
          displayRawValue={displayRawValue}
          detailRawEntries={detailRawEntries}
          METRICS={METRICS}
          MEASUREMENT_DETAIL_SECTIONS={MEASUREMENT_DETAIL_SECTIONS}
        />
      </Stack>
    </BoneyardSkeleton>
  );
}
