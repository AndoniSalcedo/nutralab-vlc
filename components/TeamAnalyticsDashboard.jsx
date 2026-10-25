'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Collapse,
  Grid,
  Group,
  Paper,
  ScrollArea,
  SegmentedControl,
  MultiSelect,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Tooltip,
  TextInput,
} from '@mantine/core';
import { useRouter } from 'next/navigation';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  ReferenceArea,
  LineChart,
  Line,
} from 'recharts';
import {
  IconSearch,
  IconFilter,
  IconTrendingUp,
  IconSortDescending,
  IconChartLine,
  IconChevronDown,
  IconUsers,
} from '@/components/icons3d';
import NothingFound from '@/components/NothingFound';
import { initials, getPlayerAvatarUrl } from '@/lib/utils';
import WidgetCard, { StatTile, WidgetAside, DATA_TABLE_STYLES } from '@/components/widgets/WidgetCard';
import { TeamHeaderFilters } from '@/components/TeamHeaderContext';
import PlayerPicker from '@/components/PlayerPicker';
import { MAX_SERIES, useStableSeriesColors } from '@/lib/charts/seriesColors';
import TeamAnalyticsComparison from '@/components/TeamAnalyticsComparison';
import PlayerListCards from '@/components/widgets/PlayerListCards';

function formatDate(dateStr) {
  if (!dateStr) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${dateStr}T00:00:00`));
}

// Bajo y alto necesitan colores distintos: son problemas clínicos opuestos
const LOW_HEX = '#4A7BA6';
const HIGH_HEX = '#B8674A';
const NORMAL_HEX = '#6C705A';

const hasNum = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));

// "Ana Pérez" -> "Ana P." (el nombre solo confunde a dos jugadores con el mismo nombre de pila)
function shortName(player) {
  const surname = String(player.apellidos || '').trim().split(/\s+/)[0];
  return surname ? `${player.nombre} ${surname[0]}.` : player.nombre;
}

function parameterStatus(p) {
  const value = Number(p.valor);
  const hasMin = p.rango_min !== null && p.rango_min !== undefined && p.rango_min !== '';
  const hasMax = p.rango_max !== null && p.rango_max !== undefined && p.rango_max !== '';
  const min = hasMin ? Number(p.rango_min) : null;
  const max = hasMax ? Number(p.rango_max) : null;

  if (!p.fuera_rango) return { color: 'salvia', label: 'Normal', hex: NORMAL_HEX };
  if (Number.isFinite(max) && value > max) return { color: 'arcilla', label: 'Alto', hex: HIGH_HEX };
  if (Number.isFinite(min) && value < min) return { color: 'blue', label: 'Bajo', hex: LOW_HEX };
  return { color: 'arcilla', label: 'Revisar', hex: HIGH_HEX };
}

function rangeLabel(p) {
  const hasMin = p.rango_min !== null && p.rango_min !== undefined && p.rango_min !== '';
  const hasMax = p.rango_max !== null && p.rango_max !== undefined && p.rango_max !== '';
  if (!hasMin && !hasMax) return 'Sin rango';
  if (hasMin && hasMax) return `${p.rango_min} - ${p.rango_max} ${p.unidad || ''}`.trim();
  if (hasMin) return `> ${p.rango_min} ${p.unidad || ''}`.trim();
  return `< ${p.rango_max} ${p.unidad || ''}`.trim();
}

export default function TeamAnalyticsDashboard({ players = [], analiticas = [] }) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 48em)', false);
  const [historySelection, setHistorySelection] = useState(null); // null = selección automática
  const [filterName, setFilterName] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('todos');
  const [sortBy, setSortBy] = useState('alertas');
  const [selectedParam, setSelectedParam] = useState('');
  const [chartMode, setChartMode] = useState('comparativa');
  const [filtersOpen, setFiltersOpen] = useState(false);
  // null = todos los jugadores; array = solo los elegidos
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(null);

  // Posición y jugadores se eligen en la cabecera y afectan a toda la página
  const positionPlayers = useMemo(
    () => (filterPosition ? players.filter((player) => player.posicion === filterPosition) : players),
    [players, filterPosition]
  );
  const scopedPlayers = useMemo(() => {
    if (selectedPlayerIds === null) return positionPlayers;
    const chosen = new Set(selectedPlayerIds);
    return positionPlayers.filter((player) => chosen.has(String(player.id)));
  }, [positionPlayers, selectedPlayerIds]);

  const analyticsCountByPlayer = useMemo(() => {
    const counts = new Map();
    analiticas.forEach((a) => {
      const key = String(a.jugador_id);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [analiticas]);

  // Mapear analíticas a cada jugador y obtener la más reciente
  const playersWithAnaliticas = useMemo(() => {
    return scopedPlayers.map((player) => {
      const records = analiticas
        .filter((a) => String(a.jugador_id) === String(player.id))
        .sort((a, b) => String(b.fecha_extraccion).localeCompare(String(a.fecha_extraccion)));
      return {
        ...player,
        records,
        latest: records[0] || null,
      };
    });
  }, [scopedPlayers, analiticas]);

  // Lista de posiciones únicas para filtro
  const positionOptions = useMemo(() => {
    const values = Array.from(new Set(players.map((player) => player.posicion).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    return [{ value: '', label: 'Todas' }, ...values.map((value) => ({ value, label: value }))];
  }, [players]);

  // Obtener todos los nombres de parámetros únicos disponibles en las analíticas
  const allParamNames = useMemo(() => {
    const names = new Set();
    analiticas.forEach((a) => {
      if (Array.isArray(a.parametros)) {
        a.parametros.forEach((p) => {
          if (p.nombre) names.add(p.nombre);
        });
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [analiticas]);

  // Parámetro por defecto: hierro/ferritina si existe; si no, el primero
  useEffect(() => {
    if (selectedParam || allParamNames.length === 0) return;
    const ironKeys = ['ferritina', 'fer', 'hierro', 'iron', 'fe'];
    const match = ironKeys
      .map((key) => allParamNames.find((name) => name.toLowerCase() === key || name.toLowerCase().includes(key)))
      .find(Boolean);
    setSelectedParam(match || allParamNames[0]);
  }, [allParamNames, selectedParam]);

  // --- Estadísticas del equipo ---
  const stats = useMemo(() => {
    const totalPlayers = playersWithAnaliticas.length;
    const playersWithRecords = playersWithAnaliticas.filter((p) => p.latest).length;
    const totalRecords = playersWithAnaliticas.reduce((sum, p) => sum + p.records.length, 0);

    let activeAlertsCount = 0;
    let totalLowParams = 0;
    let totalHighParams = 0;

    playersWithAnaliticas.forEach((p) => {
      if (p.latest) {
        const params = p.latest.parametros || [];
        const outOfRange = params.filter((param) => param.fuera_rango);
        if (outOfRange.length > 0) activeAlertsCount++;

        outOfRange.forEach((param) => {
          const status = parameterStatus(param);
          if (status.label === 'Bajo') totalLowParams++;
          if (status.label === 'Alto') totalHighParams++;
        });
      }
    });

    return {
      totalPlayers,
      playersWithRecords,
      activeAlertsCount,
      totalLowParams,
      totalHighParams,
      totalRecords,
    };
  }, [playersWithAnaliticas]);

  // --- Filtros + Ordenación aplicados a jugadores ---
  const filteredPlayers = useMemo(() => {
    let list = playersWithAnaliticas.filter((p) => {
      const nameMatch = `${p.nombre} ${p.apellidos || ''}`.toLowerCase().includes(filterName.toLowerCase());

      // Filtro por gravedad
      let sevMatch = true;
      if (filterSeverity === 'alertas') {
        sevMatch = p.latest && (p.latest.parametros || []).some((param) => param.fuera_rango);
      } else if (filterSeverity === 'normal') {
        sevMatch = p.latest && !(p.latest.parametros || []).some((param) => param.fuera_rango);
      } else if (filterSeverity === 'sin_datos') {
        sevMatch = !p.latest;
      }

      return nameMatch && sevMatch;
    });

    // Ordenación
    list = [...list].sort((a, b) => {
      if (sortBy === 'nombre') {
        return `${a.nombre} ${a.apellidos || ''}`.localeCompare(`${b.nombre} ${b.apellidos || ''}`);
      }
      if (sortBy === 'alertas') {
        const aAlerts = (a.latest?.parametros || []).filter((p) => p.fuera_rango).length;
        const bAlerts = (b.latest?.parametros || []).filter((p) => p.fuera_rango).length;
        return bAlerts - aAlerts; // desc
      }
      if (sortBy === 'fecha') {
        const aDate = a.latest?.fecha_extraccion || '';
        const bDate = b.latest?.fecha_extraccion || '';
        return String(bDate).localeCompare(String(aDate)); // most recent first
      }
      if (sortBy === 'historial') {
        return b.records.length - a.records.length; // most records first
      }
      return 0;
    });

    return list;
  }, [playersWithAnaliticas, filterName, filterSeverity, sortBy]);



  // --- Datos para el gráfico comparativo del parámetro seleccionado ---
  const chartData = useMemo(() => {
    if (!selectedParam) return [];

    const data = [];
    playersWithAnaliticas.forEach((p) => {
      if (p.latest && Array.isArray(p.latest.parametros)) {
        const param = p.latest.parametros.find((param) => param.nombre === selectedParam);
        if (param) {
          const status = parameterStatus(param);
          data.push({
            name: shortName(p),
            nombre: p.nombre,
            apellidos: p.apellidos || '',
            valor: Number(param.valor),
            unidad: param.unidad,
            rango_min: param.rango_min,
            rango_max: param.rango_max,
            color: status.hex,
            statusLabel: status.label,
          });
        }
      }
    });
    return data.sort((a, b) => b.valor - a.valor);
  }, [playersWithAnaliticas, selectedParam]);

  // Jugadores con datos del parámetro seleccionado (candidatos para el historial)
  const historyAvailable = useMemo(() => {
    const names = [];
    playersWithAnaliticas.forEach((p) => {
      const has = p.records.some((record) => Array.isArray(record.parametros) && record.parametros.some((param) => param.nombre === selectedParam));
      if (has) names.push({ id: String(p.id), name: `${p.nombre} ${p.apellidos || ''}`.trim(), short: shortName(p) });
    });
    return names;
  }, [playersWithAnaliticas, selectedParam]);

  // Selección por defecto: si en la cabecera hay pocos jugadores elegidos, esos; si no, quienes tienen
  // el último valor fuera de rango (máx. 6) o los 6 primeros. Con 25 líneas a la vez el historial es ilegible.
  const defaultHistorySelection = useMemo(() => {
    if (selectedPlayerIds !== null && historyAvailable.length <= MAX_SERIES) return historyAvailable.map((h) => h.name);
    const flagged = chartData.filter((d) => d.statusLabel !== 'Normal').map((d) => `${d.nombre} ${d.apellidos}`.trim());
    const pool = flagged.length > 0 ? flagged : historyAvailable.map((h) => h.name);
    return pool.filter((name) => historyAvailable.some((h) => h.name === name)).slice(0, 6);
  }, [chartData, historyAvailable, selectedPlayerIds]);

  const historyPlayerNames = useMemo(() => {
    if (chartMode !== 'historial') return [];
    const base = historySelection ?? defaultHistorySelection;
    return base.filter((name) => historyAvailable.some((h) => h.name === name)).slice(0, MAX_SERIES);
  }, [chartMode, historySelection, defaultHistorySelection, historyAvailable]);

  // Datos para el gráfico de historial: solo los jugadores seleccionados
  const historyChartData = useMemo(() => {
    if (!selectedParam || chartMode !== 'historial') return [];

    const dateMap = new Map();
    playersWithAnaliticas.forEach((p) => {
      const key = `${p.nombre} ${p.apellidos || ''}`.trim();
      if (!historyPlayerNames.includes(key)) return;
      p.records.forEach((record) => {
        const param = Array.isArray(record.parametros) ? record.parametros.find((item) => item.nombre === selectedParam) : null;
        if (!param) return;
        const fecha = record.fecha_extraccion || '';
        if (!dateMap.has(fecha)) dateMap.set(fecha, {});
        dateMap.get(fecha)[key] = Number(param.valor);
      });
    });

    return Array.from(dateMap.entries())
      .map(([fecha, values]) => ({ fecha, label: formatDate(fecha), ...values }))
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  }, [playersWithAnaliticas, selectedParam, chartMode, historyPlayerNames]);

  // Color estable por jugador: no cambia al añadir o quitar a otros
  const historyColors = useStableSeriesColors(historyPlayerNames);

  // Rango de referencia: solo se dibuja si es el mismo para todos los jugadores
  const paramReferenceRange = useMemo(() => {
    if (chartData.length === 0) return { min: null, max: null, unidad: '', uniform: true };
    const first = chartData[0];
    const uniform = chartData.every((d) => String(d.rango_min ?? '') === String(first.rango_min ?? '') && String(d.rango_max ?? '') === String(first.rango_max ?? ''));
    return {
      min: hasNum(first.rango_min) ? Number(first.rango_min) : null,
      max: hasNum(first.rango_max) ? Number(first.rango_max) : null,
      unidad: first.unidad || '',
      uniform,
    };
  }, [chartData]);
  const showReferenceBand = paramReferenceRange.uniform && paramReferenceRange.min !== null && paramReferenceRange.max !== null;

  // Estadísticas del parámetro seleccionado
  const paramStats = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map((d) => d.valor);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = Number((sum / values.length).toFixed(2));
    const lowCount = chartData.filter((d) => d.statusLabel === 'Bajo').length;
    const highCount = chartData.filter((d) => d.statusLabel === 'Alto').length;
    const normalCount = chartData.filter((d) => d.statusLabel === 'Normal').length;

    return {
      avg,
      lowCount,
      highCount,
      normalCount,
      totalCount: chartData.length,
    };
  }, [chartData]);

  const activeHeaderFilters = [filterPosition, selectedPlayerIds !== null].filter(Boolean).length;

  // Opciones de orden
  const sortOptions = [
    { value: 'alertas', label: 'Nº Alertas' },
    { value: 'nombre', label: 'Nombre' },
    { value: 'fecha', label: 'Fecha reciente' },
    { value: 'historial', label: 'Más registros' },
  ];

  return (
    <BoneyardSkeleton name="team-analytics" loading={false}>
      {/* Filtros globales en la cabecera, igual que en Evolución */}
      <TeamHeaderFilters>
        <Box w="100%" style={{ minWidth: 0 }}>
          <Stack gap="xs" style={{ width: '100%', minWidth: 0 }}>
            {isMobile && (
              <Button
                variant="light"
                color="gray"
                radius="xl"
                size="xs"
                fullWidth
                leftSection={<IconFilter size={14} />}
                rightSection={<IconChevronDown size={14} style={{ transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }} />}
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
              >
                Filtros{activeHeaderFilters > 0 ? ` · ${activeHeaderFilters} activos` : ''}
              </Button>
            )}
            <Collapse expanded={!isMobile || filtersOpen}>
              <Group gap={8} wrap="wrap" align="center" w="100%" style={{ minWidth: 0 }}>
                <Select
                  placeholder="Posición"
                  leftSection={<IconUsers size={16} style={{ opacity: 0.7 }} />}
                  data={positionOptions}
                  value={filterPosition}
                  onChange={(val) => setFilterPosition(val || '')}
                  variant="filled"
                  radius="xl"
                  size="sm"
                  searchable
                  allowDeselect={false}
                  style={{ flex: '1 1 150px', minWidth: 0 }}
                />
                <PlayerPicker
                  players={positionPlayers}
                  value={selectedPlayerIds}
                  onChange={(next) => {
                    setSelectedPlayerIds(next);
                    setHistorySelection(null);
                  }}
                  getMeta={(player) => {
                    const count = analyticsCountByPlayer.get(String(player.id)) || 0;
                    return count ? `${count} anal.` : 'sin datos';
                  }}
                  style={{ flex: '1.4 1 200px', minWidth: 0 }}
                />
                <Select
                  placeholder="Biomarcador"
                  leftSection={<IconFilter size={16} style={{ opacity: 0.7 }} />}
                  data={allParamNames.map((name) => ({ value: name, label: name }))}
                  value={selectedParam}
                  onChange={(val) => {
                    if (!val) return;
                    setSelectedParam(val);
                    setHistorySelection(null);
                  }}
                  nothingFoundMessage="Sin biomarcadores"
                  allowDeselect={false}
                  searchable
                  variant="filled"
                  radius="xl"
                  size="sm"
                  style={{ flex: '1.4 1 200px', minWidth: 0 }}
                />
              </Group>
            </Collapse>
          </Stack>
        </Box>
      </TeamHeaderFilters>

      <Stack gap="lg" style={{ width: '100%', minWidth: 0 }}>
        {/* Resumen de analíticas en 1 sola fila compacta */}
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          <StatTile icon="players" title="Con analíticas" color="salvia" value={`${stats.playersWithRecords}/${stats.totalPlayers}`} caption={`${stats.totalPlayers ? Math.round((stats.playersWithRecords / stats.totalPlayers) * 100) : 0}% ${selectedPlayerIds !== null ? 'de la selección' : 'de la plantilla'}`} />
          <StatTile icon="warning" title="Con alertas" color={stats.activeAlertsCount > 0 ? 'arcilla' : 'salvia'} value={stats.activeAlertsCount} caption={stats.activeAlertsCount === 1 ? 'jugador en su última analítica' : 'jugadores en su última analítica'} />
          <StatTile icon="chart_down" title="Bajos" color={stats.totalLowParams > 0 ? 'arcilla' : 'salvia'} value={stats.totalLowParams} caption="parámetros bajo el mínimo" />
          <StatTile icon="chart_up" title="Altos" color={stats.totalHighParams > 0 ? 'arcilla' : 'salvia'} value={stats.totalHighParams} caption="parámetros sobre el máximo" />
        </SimpleGrid>

      {/* Sección 2: Análisis de Parámetro Clínico (Comparativa / Historial) */}
      <WidgetCard
        icon="stethoscope"
        title={selectedParam ? `Biomarcador · ${selectedParam}` : 'Inspector de biomarcadores'}
        color="salvia"
        aside={paramStats ? <WidgetAside color="salvia">{paramStats.totalCount} {paramStats.totalCount === 1 ? 'jugador' : 'jugadores'}</WidgetAside> : null}
        style={{ height: 'auto', width: '100%', minWidth: 0 }}
      >
        <Stack gap="md">
          <Group gap="sm" wrap="wrap" justify="space-between" align="center">
            <Text size="xs" c="dimmed" style={{ flex: '1 1 220px' }}>
              {chartMode === 'comparativa'
                ? 'Último valor de cada jugador frente al rango de referencia'
                : 'Evolución del biomarcador en todas sus analíticas'}
            </Text>
            <SegmentedControl
              value={chartMode}
              onChange={setChartMode}
              size="xs"
              radius="xl"
              fullWidth={isMobile}
              w={{ base: '100%', sm: 'auto' }}
              data={[
                { value: 'comparativa', label: 'Comparativa' },
                { value: 'historial', label: 'Historial' },
              ]}
            />
          </Group>

          {chartMode === 'comparativa' && chartData.length > 0 ? (
            <Grid gutter="lg">
              {/* Gráfico comparativo: barras horizontales en móvil para poder leer todos los nombres */}
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Box h={isMobile ? Math.max(180, chartData.length * 30 + 20) : 280} style={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout={isMobile ? 'vertical' : 'horizontal'}
                      margin={isMobile ? { top: 4, right: 16, left: 0, bottom: 4 } : { top: 10, right: 10, left: -15, bottom: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={isMobile} horizontal={!isMobile} stroke="var(--mantine-color-gray-2)" />
                      {/* Recharts no recorre fragmentos: cada eje va como hijo directo */}
                      {isMobile && <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--mantine-color-gray-5)" tickLine={false} axisLine={false} domain={[0, 'auto']} />}
                      {isMobile && <YAxis type="category" dataKey="name" width={84} tick={{ fontSize: 11, fontWeight: 500 }} interval={0} stroke="var(--mantine-color-gray-5)" tickLine={false} axisLine={false} />}
                      {!isMobile && <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 500 }} angle={-30} textAnchor="end" interval={0} stroke="var(--mantine-color-gray-5)" tickLine={false} axisLine={false} />}
                      {!isMobile && <YAxis tick={{ fontSize: 11 }} stroke="var(--mantine-color-gray-5)" tickLine={false} axisLine={false} domain={[0, 'auto']} />}
                      <ChartTooltip
                        cursor={{ fill: 'rgba(108, 112, 90, 0.06)' }}
                        formatter={(value, name, props) => [
                          <Text key="tooltip-value" span fw={700} c={props.payload.color}>
                            {value} {props.payload.unidad} ({props.payload.statusLabel})
                          </Text>,
                          selectedParam,
                        ]}
                        labelFormatter={(label, items) => {
                          const item = items[0]?.payload;
                          return item ? `${item.nombre} ${item.apellidos}` : label;
                        }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--mantine-color-gray-2)', padding: '6px 10px', fontSize: 12 }}
                      />
                      {showReferenceBand && (
                        isMobile ? (
                          <ReferenceArea ifOverflow="hidden" x1={paramReferenceRange.min} x2={paramReferenceRange.max} fill="rgba(108, 112, 90, 0.10)" stroke="rgba(108, 112, 90, 0.35)" strokeDasharray="3 3" />
                        ) : (
                          <ReferenceArea ifOverflow="hidden" y1={paramReferenceRange.min} y2={paramReferenceRange.max} fill="rgba(108, 112, 90, 0.10)" stroke="rgba(108, 112, 90, 0.35)" strokeDasharray="3 3" />
                        )
                      )}
                      <Bar dataKey="valor" radius={isMobile ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={22}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid.Col>

              {/* Estadísticas del parámetro */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                {paramStats && (
                  <Stack gap="sm" justify="center" h="100%">
                    <Paper p="sm" radius="lg" style={{ backgroundColor: 'rgba(108, 112, 90, 0.05)', border: '1px solid rgba(108, 112, 90, 0.12)' }}>
                      <Text size="xs" c="var(--nutra-salvia, #6C705A)" tt="uppercase" fw={700} mb={4}>Resumen</Text>
                      <Group justify="space-between" wrap="nowrap" mb={4}>
                        <Text size="xs" fw={500}>Media del equipo</Text>
                        <Text size="sm" fw={700} c="var(--nutra-bosque, #1F2A24)">{paramStats.avg} {paramReferenceRange.unidad}</Text>
                      </Group>
                      <Group justify="space-between" wrap="nowrap" mb={4}>
                        <Text size="xs" fw={500}>Rango de referencia</Text>
                        <Text size="xs" fw={600} c="var(--nutra-salvia, #6C705A)">
                          {!paramReferenceRange.uniform
                            ? 'Varía por jugador'
                            : showReferenceBand
                              ? `${paramReferenceRange.min} - ${paramReferenceRange.max}`
                              : 'Sin rango'}
                        </Text>
                      </Group>
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="xs" fw={500}>Jugadores analizados</Text>
                        <Text size="xs" fw={600} c="var(--nutra-salvia, #6C705A)">{paramStats.totalCount}</Text>
                      </Group>
                    </Paper>
                    {/* Distribución: leyenda de los colores de las barras */}
                    <Paper p="sm" radius="lg" style={{ backgroundColor: 'rgba(108, 112, 90, 0.05)', border: '1px solid rgba(108, 112, 90, 0.12)' }}>
                      <Text size="xs" c="var(--nutra-salvia, #6C705A)" tt="uppercase" fw={700} mb={8}>Distribución</Text>
                      <Stack gap={6}>
                        {[
                          { label: 'Por debajo del rango', hex: LOW_HEX, count: paramStats.lowCount },
                          { label: 'En rango normal', hex: NORMAL_HEX, count: paramStats.normalCount },
                          { label: 'Por encima del rango', hex: HIGH_HEX, count: paramStats.highCount },
                        ].map((row) => (
                          <Group key={row.label} justify="space-between" wrap="nowrap">
                            <Group gap="xs" wrap="nowrap">
                              <Box w={10} h={10} style={{ borderRadius: 3, backgroundColor: row.hex, flexShrink: 0 }} />
                              <Text size="xs" fw={500}>{row.label}</Text>
                            </Group>
                            <Text size="xs" fw={700} c={row.count > 0 ? row.hex : 'dimmed'}>
                              {row.count} {row.count === 1 ? 'jugador' : 'jugadores'}
                            </Text>
                          </Group>
                        ))}
                      </Stack>
                    </Paper>
                  </Stack>
                )}
              </Grid.Col>
            </Grid>
          ) : chartMode === 'historial' && historyAvailable.length > 0 ? (
            <Stack gap="sm">
              {/* Selector de jugadores: pocas líneas a la vez para que el historial se lea */}
              <Group gap="xs" wrap="wrap" align="flex-end">
                <MultiSelect
                  placeholder={historyPlayerNames.length === 0 ? 'Elige jugadores' : undefined}
                  data={historyAvailable.map((h) => ({ value: h.name, label: h.name }))}
                  value={historyPlayerNames}
                  onChange={setHistorySelection}
                  maxValues={MAX_SERIES}
                  searchable
                  clearable
                  variant="filled"
                  radius="xl"
                  size="xs"
                  hidePickedOptions={false}
                  style={{ flex: '1 1 220px', minWidth: 0 }}
                  comboboxProps={{ zIndex: 2500 }}
                />
                <Group gap={6} wrap="nowrap">
                  <Button size="compact-xs" radius="xl" variant="light" color="gray" onClick={() => setHistorySelection(null)}>
                    {selectedPlayerIds !== null && historyAvailable.length <= MAX_SERIES ? 'Selección' : 'Solo alertas'}
                  </Button>
                  {historyAvailable.length <= MAX_SERIES && (
                    <Button size="compact-xs" radius="xl" variant="light" color="gray" onClick={() => setHistorySelection(historyAvailable.map((h) => h.name))}>
                      Todos
                    </Button>
                  )}
                </Group>
              </Group>

              {historyAvailable.length > MAX_SERIES && (
                <Text size="xs" c="dimmed">Hasta {MAX_SERIES} jugadores a la vez para que las líneas se distingan.</Text>
              )}

              {historyChartData.length > 0 ? (
                <>
                  <Box h={isMobile ? 260 : 320} style={{ position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyChartData} margin={{ top: 10, right: 16, left: -15, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mantine-color-gray-2)" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 500 }} minTickGap={24} stroke="var(--mantine-color-gray-5)" tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11 }} stroke="var(--mantine-color-gray-5)" tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <ChartTooltip
                          cursor={{ stroke: 'var(--mantine-color-gray-4)', strokeDasharray: '3 3' }}
                          formatter={(value, name) => [`${value} ${paramReferenceRange.unidad}`.trim(), name]}
                          labelStyle={{ fontWeight: 700, color: 'var(--mantine-color-dark-4)', marginBottom: 2 }}
                          contentStyle={{ borderRadius: '12px', border: '1px solid var(--mantine-color-gray-2)', padding: '6px 10px', fontSize: 12 }}
                        />
                        {showReferenceBand && (
                          <ReferenceArea ifOverflow="hidden" y1={paramReferenceRange.min} y2={paramReferenceRange.max} fill="rgba(108, 112, 90, 0.10)" stroke="rgba(108, 112, 90, 0.35)" strokeDasharray="3 3" />
                        )}
                        {historyPlayerNames.map((playerName) => (
                          <Line
                            key={playerName}
                            type="monotone"
                            dataKey={playerName}
                            stroke={historyColors[playerName]}
                            strokeWidth={2}
                            dot={{ r: 3.5, fill: historyColors[playerName], stroke: 'white', strokeWidth: 1.5 }}
                            activeDot={{ r: 5, stroke: 'white', strokeWidth: 2 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                  <Group gap={10} wrap="wrap" justify="center">
                    {historyPlayerNames.map((name) => (
                      <Group key={name} gap={5} wrap="nowrap">
                        <Box w={10} h={10} style={{ borderRadius: '50%', backgroundColor: historyColors[name], flexShrink: 0 }} />
                        <Text size="xs" fw={600} c="dark.5">{name}</Text>
                      </Group>
                    ))}
                  </Group>
                </>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="lg">Elige al menos un jugador para ver su historial.</Text>
              )}
            </Stack>
          ) : (
            <NothingFound
              compact={isMobile}
              icon={chartMode === 'historial' ? IconChartLine : IconTrendingUp}
              title={chartMode === 'historial' ? 'Sin historial disponible' : 'Sin datos del parámetro'}
              icon3d="chart"
              description={
                chartMode === 'historial'
                  ? `No hay registros históricos del parámetro "${selectedParam}".`
                  : `Ningún jugador tiene el parámetro clínico "${selectedParam}" registrado.`
              }
            />
          )}
        </Stack>
      </WidgetCard>

      <TeamAnalyticsComparison players={playersWithAnaliticas} selectedParam={selectedParam} />

      {/* Sección 3: Listado general de la plantilla */}
      <WidgetCard
        icon="diario"
        title="Listado clínico general"
        color="salvia"
        style={{ height: 'auto', width: '100%', minWidth: 0, maxWidth: '100%' }}
      >
        <Stack gap="md" style={{ width: '100%', minWidth: 0 }}>
          <Group justify="space-between" align="center" wrap="wrap" gap="sm" w="100%">
            <Group gap="xs" wrap="wrap" w={{ base: '100%', sm: 'auto' }} style={{ flex: 1, minWidth: 0 }}>
              <TextInput
                placeholder="Buscar por jugador..."
                leftSection={<IconSearch size={16} style={{ opacity: 0.7 }} />}
                variant="filled"
                radius="xl"
                size="sm"
                value={filterName}
                onChange={(e) => setFilterName(e.currentTarget.value)}
                style={{ flex: '1 1 180px', minWidth: 0 }}
                w={{ base: '100%', sm: 'auto' }}
              />
              <Select
                placeholder="Ordenar por"
                data={sortOptions}
                value={sortBy}
                onChange={(val) => val && setSortBy(val)}
                variant="filled"
                radius="xl"
                size="sm"
                allowDeselect={false}
                style={{ flex: '1 1 140px', minWidth: 0 }}
                w={{ base: '100%', sm: 'auto' }}
                leftSection={<IconSortDescending size={14} />}
              />
            </Group>
          </Group>

          {/* Filtro por gravedad (scroll horizontal propio en móvil) */}
          <Box style={{ width: '100%', minWidth: 0, overflowX: 'auto' }}>
            <SegmentedControl
              value={filterSeverity}
              onChange={setFilterSeverity}
              size="xs"
              radius="xl"
              fullWidth
              styles={{
                root: { minWidth: 280 },
                label: { whiteSpace: 'nowrap' },
              }}
              data={[
                { value: 'todos', label: `Todos (${playersWithAnaliticas.length})` },
                { value: 'alertas', label: `Con alertas (${playersWithAnaliticas.filter((p) => p.latest && (p.latest.parametros || []).some((param) => param.fuera_rango)).length})` },
                { value: 'normal', label: `Sin alertas (${playersWithAnaliticas.filter((p) => p.latest && !(p.latest.parametros || []).some((param) => param.fuera_rango)).length})` },
                { value: 'sin_datos', label: `Sin datos (${playersWithAnaliticas.filter((p) => !p.latest).length})` },
              ]}
            />
          </Box>

          {filteredPlayers.length > 0 && isMobile ? (
            <PlayerListCards
              items={filteredPlayers.map((player) => {
                const params = player.latest?.parametros || [];
                const outOfRange = params.filter((p) => p.fuera_rango);
                const shown = outOfRange.slice(0, 4);
                const hidden = outOfRange.length - shown.length;
                const subtitle = [
                  player.posicion,
                  player.latest ? formatDate(player.latest.fecha_extraccion) : 'Sin analíticas',
                  player.records.length > 1 ? `${player.records.length} analíticas` : null,
                ].filter(Boolean).join(' · ');
                return {
                  id: player.id,
                  player,
                  name: `${player.nombre} ${player.apellidos || ''}`.trim(),
                  subtitle,
                  onClick: () => router.push(`/dashboard/jugador/${player.id}/metricas/analiticas`),
                  highlight: player.latest ? (
                    <Badge size="sm" variant="light" color={outOfRange.length > 0 ? 'arcilla' : 'salvia'}>
                      {outOfRange.length > 0 ? `${outOfRange.length} ${outOfRange.length === 1 ? 'alerta' : 'alertas'}` : 'En rango'}
                    </Badge>
                  ) : (
                    <Badge size="sm" variant="light" color="gray">Sin datos</Badge>
                  ),
                  chips: [
                    ...shown.map((param, i) => {
                      const status = parameterStatus(param);
                      return {
                        key: `${param.nombre}-${i}`,
                        label: `${param.nombre} · ${status.label.toLowerCase()}`,
                        value: `${param.valor} ${param.unidad || ''}`.trim(),
                        tone: status.color,
                      };
                    }),
                    ...(hidden > 0 ? [{ key: 'more', label: 'Otros', value: `+${hidden} más` }] : []),
                  ],
                };
              })}
            />
          ) : filteredPlayers.length > 0 ? (
            <ScrollArea style={{ width: '100%', minWidth: 0 }}>
              <Table verticalSpacing="sm" highlightOnHover styles={DATA_TABLE_STYLES} style={{ minWidth: 800 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Jugador</Table.Th>
                    <Table.Th>Última analítica</Table.Th>
                    <Table.Th>Historial</Table.Th>
                    <Table.Th>Parámetros fuera de rango</Table.Th>
                    <Table.Th w={32} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredPlayers.map((player) => {
                    const hasLatest = !!player.latest;
                    const params = player.latest?.parametros || [];
                    const outOfRange = params.filter((p) => p.fuera_rango);

                    return (
                      <Table.Tr
                        key={`row-${player.id}`}
                        onClick={() => router.push(`/dashboard/jugador/${player.id}/metricas/analiticas`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <Avatar
                              src={getPlayerAvatarUrl(player)}
                              size={36}
                              radius="xl"
                              color="initials"
                            >
                              {initials(`${player.nombre} ${player.apellidos || ''}`)}
                            </Avatar>

                            <div>
                              <Text size="sm" fw={600} c="dark.5">
                                {player.nombre} {player.apellidos}
                              </Text>
                              <Text size="xs" c="dimmed">{player.posicion || 'Sin posición'}</Text>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          {hasLatest ? (
                            <Text size="sm" fw={500}>
                              {formatDate(player.latest.fecha_extraccion)}
                            </Text>
                          ) : (
                            <Text size="sm" c="dimmed">—</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500} c="var(--nutra-salvia, #6C705A)">
                            {player.records.length} {player.records.length === 1 ? 'analítica' : 'analíticas'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {hasLatest ? (
                            outOfRange.length > 0 ? (
                              <Group gap={8} wrap="wrap">
                                {outOfRange.slice(0, 5).map((param, i) => {
                                  const status = parameterStatus(param);
                                  return (
                                    <Tooltip key={`${player.id}-alert-${param.nombre}-${i}`} label={`Rango de referencia: ${rangeLabel(param)}`} withArrow>
                                      <Group gap={5} align="center" wrap="nowrap" style={{ cursor: 'pointer' }}>
                                        <Text size="7px" style={{ color: status.hex }}>●</Text>
                                        <Text size="xs" fw={600} style={{ color: status.hex }}>
                                          {param.nombre}: {param.valor} {param.unidad}
                                        </Text>
                                        <Text size="11px" c="dimmed">
                                          ({status.label.toLowerCase()})
                                        </Text>
                                      </Group>
                                    </Tooltip>
                                  );
                                })}
                                {outOfRange.length > 5 && (
                                  <Tooltip
                                    label={outOfRange.slice(5).map((param) => `${param.nombre}: ${param.valor} ${param.unidad || ''}`).join(' · ')}
                                    withArrow
                                    multiline
                                    maw={280}
                                  >
                                    <Badge size="sm" variant="light" color="gray" style={{ cursor: 'help' }}>+{outOfRange.length - 5} más</Badge>
                                  </Tooltip>
                                )}
                              </Group>
                            ) : (
                              <Group gap={5} align="center" wrap="nowrap">
                                <Text size="7px" style={{ color: NORMAL_HEX }}>●</Text>
                                <Text size="xs" c="dimmed">Todos en rango</Text>
                              </Group>
                            )
                          ) : (
                            <Text size="xs" c="dimmed">—</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <IconChevronDown size={16} style={{ transform: 'rotate(-90deg)', opacity: 0.4 }} />
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          ) : (
            <NothingFound
              icon={IconSearch}
              title="Sin resultados"
              icon3d="search"
              description="No hay jugadores que coincidan con los filtros aplicados."
            />
          )}
        </Stack>
      </WidgetCard>

      </Stack>
    </BoneyardSkeleton>
  );
}
