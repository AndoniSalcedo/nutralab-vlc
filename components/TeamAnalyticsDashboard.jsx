'use client';

import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
  Grid,
  Group,
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
  IconArrowLeft,
  IconReportMedical,
  IconAlertTriangle,
  IconSearch,
  IconFilter,
  IconUsers,
  IconTrendingUp,
  IconActivity,
  IconHistory,
  IconSortDescending,
  IconChartLine,
} from '@tabler/icons-react';
import NothingFound from '@/components/NothingFound';
import { initials } from '@/lib/utils';

function formatDate(dateStr) {
  if (!dateStr) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${dateStr}T00:00:00`));
}

function parameterStatus(p) {
  const value = Number(p.valor);
  const hasMin = p.rango_min !== null && p.rango_min !== undefined && p.rango_min !== '';
  const hasMax = p.rango_max !== null && p.rango_max !== undefined && p.rango_max !== '';
  const min = hasMin ? Number(p.rango_min) : null;
  const max = hasMax ? Number(p.rango_max) : null;

  if (!p.fuera_rango) return { color: 'green', label: 'Normal', hex: '#10b981' };
  if (Number.isFinite(max) && value > max) return { color: 'red', label: 'Alto', hex: '#ef4444' };
  if (Number.isFinite(min) && value < min) return { color: 'orange', label: 'Bajo', hex: '#f59e0b' };
  return { color: 'yellow', label: 'Revisar', hex: '#eab308' };
}

function rangeLabel(p) {
  const hasMin = p.rango_min !== null && p.rango_min !== undefined && p.rango_min !== '';
  const hasMax = p.rango_max !== null && p.rango_max !== undefined && p.rango_max !== '';
  if (!hasMin && !hasMax) return 'Sin rango';
  if (hasMin && hasMax) return `${p.rango_min} - ${p.rango_max} ${p.unidad || ''}`.trim();
  if (hasMin) return `> ${p.rango_min} ${p.unidad || ''}`.trim();
  return `< ${p.rango_max} ${p.unidad || ''}`.trim();
}

export default function TeamAnalyticsDashboard({ players = [], analiticas = [], team }) {
  const router = useRouter();
  const [filterName, setFilterName] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('todos');
  const [sortBy, setSortBy] = useState('alertas');
  const [selectedParam, setSelectedParam] = useState('');
  const [chartMode, setChartMode] = useState('comparativa');

  // Mapear analíticas a cada jugador y obtener la más reciente
  const playersWithAnaliticas = useMemo(() => {
    return players.map((player) => {
      const records = analiticas
        .filter((a) => String(a.jugador_id) === String(player.id))
        .sort((a, b) => String(b.fecha_extraccion).localeCompare(String(a.fecha_extraccion)));
      return {
        ...player,
        records,
        latest: records[0] || null,
      };
    });
  }, [players, analiticas]);

  // Lista de posiciones únicas para filtro
  const positionOptions = useMemo(() => {
    const values = Array.from(new Set(players.map((player) => player.posicion).filter(Boolean))).sort();
    return [{ value: '', label: 'Todas las posiciones' }, ...values.map((value) => ({ value, label: value }))];
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
    return Array.from(names).sort();
  }, [analiticas]);

  // Seleccionar automáticamente el parámetro por defecto (Hierro/Ferritina si existe, sino el primero)
  useMemo(() => {
    if (selectedParam) return;
    const ironKeys = ['ferritina', 'fer', 'hierro', 'iron', 'fe'];
    for (const key of ironKeys) {
      const match = allParamNames.find((name) => name.toLowerCase() === key || name.toLowerCase().includes(key));
      if (match) {
        setSelectedParam(match);
        return;
      }
    }
    if (allParamNames.length > 0) {
      setSelectedParam(allParamNames[0]);
    }
  }, [allParamNames, selectedParam]);

  // --- Estadísticas del equipo ---
  const stats = useMemo(() => {
    const totalPlayers = players.length;
    const playersWithRecords = playersWithAnaliticas.filter((p) => p.latest).length;
    const totalRecords = analiticas.length;

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
  }, [players, playersWithAnaliticas, analiticas]);

  // --- Filtros + Ordenación aplicados a jugadores ---
  const filteredPlayers = useMemo(() => {
    let list = playersWithAnaliticas.filter((p) => {
      const nameMatch = `${p.nombre} ${p.apellidos || ''}`.toLowerCase().includes(filterName.toLowerCase());
      const posMatch = !filterPosition || p.posicion === filterPosition;

      // Filtro por gravedad
      let sevMatch = true;
      if (filterSeverity === 'alertas') {
        sevMatch = p.latest && (p.latest.parametros || []).some((param) => param.fuera_rango);
      } else if (filterSeverity === 'normal') {
        sevMatch = p.latest && !(p.latest.parametros || []).some((param) => param.fuera_rango);
      } else if (filterSeverity === 'sin_datos') {
        sevMatch = !p.latest;
      }

      return nameMatch && posMatch && sevMatch;
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
  }, [playersWithAnaliticas, filterName, filterPosition, filterSeverity, sortBy]);



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
            name: p.nombre,
            apellidos: p.apellidos || '',
            valor: param.valor,
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

  // --- Datos para el gráfico de historial del parámetro seleccionado ---
  const historyChartData = useMemo(() => {
    if (!selectedParam || chartMode !== 'historial') return [];

    // Recopilar todas las fechas únicas y valores por jugador
    const dateMap = new Map();
    playersWithAnaliticas.forEach((p) => {
      p.records.forEach((record) => {
        if (Array.isArray(record.parametros)) {
          const param = record.parametros.find((param) => param.nombre === selectedParam);
          if (param) {
            const fecha = record.fecha_extraccion || '';
            if (!dateMap.has(fecha)) dateMap.set(fecha, {});
            const entry = dateMap.get(fecha);
            entry[`${p.nombre} ${p.apellidos || ''}`.trim()] = param.valor;
          }
        }
      });
    });

    // Convertir a array ordenado por fecha
    return Array.from(dateMap.entries())
      .map(([fecha, values]) => ({ fecha, label: formatDate(fecha), ...values }))
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  }, [playersWithAnaliticas, selectedParam, chartMode]);

  // Jugadores que tienen datos del parámetro seleccionado (para líneas del historial)
  const historyPlayerNames = useMemo(() => {
    if (chartMode !== 'historial') return [];
    const names = new Set();
    playersWithAnaliticas.forEach((p) => {
      p.records.forEach((record) => {
        if (Array.isArray(record.parametros)) {
          const param = record.parametros.find((param) => param.nombre === selectedParam);
          if (param) names.add(`${p.nombre} ${p.apellidos || ''}`.trim());
        }
      });
    });
    return Array.from(names);
  }, [playersWithAnaliticas, selectedParam, chartMode]);

  // Paleta de colores para líneas de historial
  const historyColors = useMemo(() => {
    const palette = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
      '#14b8a6', '#e11d48', '#a855f7', '#0ea5e9', '#d946ef',
    ];
    const map = {};
    historyPlayerNames.forEach((name, i) => {
      map[name] = palette[i % palette.length];
    });
    return map;
  }, [historyPlayerNames]);

  // Rango de referencia para el gráfico
  const paramReferenceRange = useMemo(() => {
    if (chartData.length === 0) return { min: null, max: null, unidad: '' };
    const first = chartData[0];
    return {
      min: first.rango_min,
      max: first.rango_max,
      unidad: first.unidad || '',
    };
  }, [chartData]);

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

  // Opciones de orden
  const sortOptions = [
    { value: 'alertas', label: 'Nº Alertas' },
    { value: 'nombre', label: 'Nombre' },
    { value: 'fecha', label: 'Fecha reciente' },
    { value: 'historial', label: 'Más registros' },
  ];

  return (
    <BoneyardSkeleton name="team-analytics" loading={false}>
      <Stack gap="lg">
      {/* Cabecera */}
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        shadow="xs"
        radius={24}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
          zIndex: 10,
          position: 'relative',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="sm" wrap="nowrap">
            <Tooltip label="Volver al panel" withArrow>
              <ActionIcon component={Anchor} href={team?.id ? `/dashboard/equipo/${team.id}` : '/dashboard'} variant="light" color="gray" radius="xl" size={42}>
                <IconArrowLeft size={20} />
              </ActionIcon>
            </Tooltip>
            <ThemeIcon color="red" variant="light" radius="xl" size={42}>
              <IconReportMedical size={21} />
            </ThemeIcon>
            <Box>
              <Title order={3} fw={850} c="#24291f" lh={1.1}>
                Analíticas de {team?.nombre || 'equipo'}
              </Title>
              <Text size="xs" c="dimmed" mt={2}>
                Panel clínico de rendimiento y alertas biológicas del grupo
              </Text>
            </Box>
          </Group>
        </Group>
      </Paper>

      {/* Tarjetas de estadísticas */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
          <Group justify="space-between" wrap="nowrap">
            <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Analíticas Subidas</Text>
            <ThemeIcon size="sm" radius="md" color="blue" variant="light">
              <IconUsers size={14} />
            </ThemeIcon>
          </Group>
          <Title order={2} c="dark.4" mt={4}>
            {stats.playersWithRecords} / {stats.totalPlayers}
          </Title>
          <Text size="xs" c="dimmed">
            {stats.totalPlayers ? Math.round((stats.playersWithRecords / stats.totalPlayers) * 100) : 0}% de la plantilla
          </Text>
        </Paper>

        <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
          <Group justify="space-between" wrap="nowrap">
            <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Con Alertas</Text>
            <ThemeIcon size="sm" radius="md" color="red" variant="light">
              <IconAlertTriangle size={14} />
            </ThemeIcon>
          </Group>
          <Title order={2} c={stats.activeAlertsCount > 0 ? 'red.6' : 'green.6'} mt={4}>
            {stats.activeAlertsCount}
          </Title>
          <Text size="xs" c="dimmed">jugadores con parámetros fuera de rango</Text>
        </Paper>

        <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
          <Group justify="space-between" wrap="nowrap">
            <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Parámetros Bajo</Text>
            <ThemeIcon size="sm" radius="md" color="orange" variant="light">
              <IconActivity size={14} />
            </ThemeIcon>
          </Group>
          <Title order={2} c={stats.totalLowParams > 0 ? 'orange.6' : 'green.6'} mt={4}>
            {stats.totalLowParams}
          </Title>
          <Text size="xs" c="dimmed">
            valores por debajo del rango mínimo
            {stats.totalHighParams > 0 && <Text span c="red.5" fw={600}> · {stats.totalHighParams} altos</Text>}
          </Text>
        </Paper>

        <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
          <Group justify="space-between" wrap="nowrap">
            <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Total Registros</Text>
            <ThemeIcon size="sm" radius="md" color="grape" variant="light">
              <IconHistory size={14} />
            </ThemeIcon>
          </Group>
          <Title order={2} c="dark.4" mt={4}>
            {stats.totalRecords}
          </Title>
          <Text size="xs" c="dimmed">analíticas registradas en el historial</Text>
        </Paper>
      </SimpleGrid>

      {/* Sección 2: Análisis de Parámetro Clínico (Comparativa / Historial) */}
      <Paper p="md" radius="lg" withBorder bg="white">
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <div>
              <Title order={4} fw={800} c="dark.4">Inspector de Biomarcadores</Title>
              <Text size="xs" c="dimmed">Compara o visualiza la evolución del biomarcador seleccionado</Text>
            </div>
            <Group gap="sm" wrap="wrap">
              <SegmentedControl
                value={chartMode}
                onChange={setChartMode}
                size="xs"
                radius="xl"
                data={[
                  { value: 'comparativa', label: 'Comparativa' },
                  { value: 'historial', label: 'Historial' },
                ]}
              />
              <Select
                placeholder="Selecciona biomarcador"
                data={allParamNames.map((name) => ({ value: name, label: name }))}
                value={selectedParam}
                onChange={(val) => val && setSelectedParam(val)}
                allowDeselect={false}
                searchable
                variant="filled"
                radius="xl"
                size="sm"
                style={{ minWidth: 240 }}
                leftSection={<IconFilter size={16} />}
              />
            </Group>
          </Group>

          {chartMode === 'comparativa' && chartData.length > 0 ? (
            <Grid gutter="lg">
              {/* Gráfico comparativo */}
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Box h={280} style={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mantine-color-gray-2)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 9, fontWeight: 500 }}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        stroke="var(--mantine-color-gray-5)"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9 }}
                        stroke="var(--mantine-color-gray-5)"
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip
                        formatter={(value, name, props) => {
                          return [
                            <Text key="tooltip-value" span fw={700} c={props.payload.color}>
                              {value} {props.payload.unidad} ({props.payload.statusLabel})
                            </Text>,
                            selectedParam,
                          ];
                        }}
                        labelFormatter={(label, items) => {
                          const item = items[0]?.payload;
                          return item ? `${item.name} ${item.apellidos}` : label;
                        }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--mantine-color-gray-2)', padding: '6px 10px', fontSize: 11 }}
                      />
                      {/* Zona de referencia si hay mínimo y máximo */}
                      {Number.isFinite(paramReferenceRange.min) && Number.isFinite(paramReferenceRange.max) && (
                        <ReferenceArea
                          y1={paramReferenceRange.min}
                          y2={paramReferenceRange.max}
                          fill="rgba(16, 185, 129, 0.07)"
                          stroke="rgba(16, 185, 129, 0.15)"
                          strokeDasharray="3 3"
                        />
                      )}
                      <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={28}>
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
                  <Stack gap="md" justify="center" h="100%">
                    <Paper p="sm" radius="md" bg="gray.0" withBorder={false}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>Resumen del parámetro</Text>
                      <Group justify="space-between" wrap="nowrap" mb={4}>
                        <Text size="xs" fw={500}>Media del equipo</Text>
                        <Text size="sm" fw={800} c="dark.4">{paramStats.avg} {paramReferenceRange.unidad}</Text>
                      </Group>
                      {Number.isFinite(paramReferenceRange.min) && Number.isFinite(paramReferenceRange.max) && (
                        <Group justify="space-between" wrap="nowrap" mb={4}>
                          <Text size="xs" fw={500}>Rango de referencia</Text>
                          <Text size="xs" fw={600} c="gray.6">{paramReferenceRange.min} - {paramReferenceRange.max}</Text>
                        </Group>
                      )}
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="xs" fw={500}>Jugadores analizados</Text>
                        <Text size="xs" fw={600} c="gray.6">{paramStats.totalCount}</Text>
                      </Group>
                    </Paper>
                    <Paper p="sm" radius="md" bg="gray.0" withBorder={false}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={8}>Distribución</Text>
                      <Stack gap={6}>
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap">
                            <Badge color="orange" size="xs" variant="filled" circle />
                            <Text size="xs" fw={500}>Por debajo del rango</Text>
                          </Group>
                          <Text size="xs" fw={700} c="orange.6">{paramStats.lowCount} jugadores</Text>
                        </Group>
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap">
                            <Badge color="green" size="xs" variant="filled" circle />
                            <Text size="xs" fw={500}>En rango normal</Text>
                          </Group>
                          <Text size="xs" fw={700} c="green.6">{paramStats.normalCount} jugadores</Text>
                        </Group>
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap">
                            <Badge color="red" size="xs" variant="filled" circle />
                            <Text size="xs" fw={500}>Por encima del rango</Text>
                          </Group>
                          <Text size="xs" fw={700} c="red.6">{paramStats.highCount} jugadores</Text>
                        </Group>
                      </Stack>
                    </Paper>
                  </Stack>
                )}
              </Grid.Col>
            </Grid>
          ) : chartMode === 'historial' && historyChartData.length > 0 ? (
            <Stack gap="sm">
              <Box h={320} style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyChartData} margin={{ top: 10, right: 20, left: -15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mantine-color-gray-2)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fontWeight: 500 }}
                      angle={-25}
                      textAnchor="end"
                      stroke="var(--mantine-color-gray-5)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      stroke="var(--mantine-color-gray-5)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--mantine-color-gray-2)', padding: '8px 12px', fontSize: 11 }}
                    />
                    {/* Zona de referencia */}
                    {Number.isFinite(paramReferenceRange.min) && Number.isFinite(paramReferenceRange.max) && (
                      <ReferenceArea
                        y1={paramReferenceRange.min}
                        y2={paramReferenceRange.max}
                        fill="rgba(16, 185, 129, 0.07)"
                        stroke="rgba(16, 185, 129, 0.15)"
                        strokeDasharray="3 3"
                      />
                    )}
                    {historyPlayerNames.map((playerName) => (
                      <Line
                        key={playerName}
                        type="monotone"
                        dataKey={playerName}
                        stroke={historyColors[playerName]}
                        strokeWidth={2}
                        dot={{ r: 3, fill: historyColors[playerName] }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              {/* Leyenda de jugadores */}
              {historyPlayerNames.length > 0 && (
                <Group gap={8} wrap="wrap" justify="center">
                  {historyPlayerNames.map((name) => (
                    <Group key={name} gap={4} wrap="nowrap">
                      <Box w={10} h={10} style={{ borderRadius: '50%', backgroundColor: historyColors[name], flexShrink: 0 }} />
                      <Text size="xs" fw={500} c="gray.7">{name}</Text>
                    </Group>
                  ))}
                </Group>
              )}
            </Stack>
          ) : (
            <NothingFound
              icon={chartMode === 'historial' ? IconChartLine : IconTrendingUp}
              title={chartMode === 'historial' ? 'Sin historial disponible' : 'Sin datos del parámetro'}
              description={
                chartMode === 'historial'
                  ? `No hay registros históricos del parámetro "${selectedParam}".`
                  : `Ningún jugador tiene el parámetro clínico "${selectedParam}" registrado.`
              }
            />
          )}
        </Stack>
      </Paper>

      {/* Sección 3: Listado general de la plantilla */}
      <Paper radius="lg" p="md" bg="white" shadow="sm" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Title order={4} fw={800} c="dark.4">Listado Clínico General</Title>
            <Group gap="xs" wrap="wrap">
              <TextInput
                placeholder="Buscar por jugador..."
                leftSection={<IconSearch size={16} style={{ opacity: 0.7 }} />}
                variant="filled"
                radius="xl"
                size="sm"
                value={filterName}
                onChange={(e) => setFilterName(e.currentTarget.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="Filtrar por posición"
                data={positionOptions}
                value={filterPosition}
                onChange={(val) => setFilterPosition(val || '')}
                variant="filled"
                radius="xl"
                size="sm"
                allowDeselect={false}
                style={{ width: 170 }}
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
                style={{ width: 155 }}
                leftSection={<IconSortDescending size={14} />}
              />
            </Group>
          </Group>

          {/* Filtro por gravedad */}
          <SegmentedControl
            value={filterSeverity}
            onChange={setFilterSeverity}
            size="xs"
            radius="xl"
            fullWidth
            data={[
              { value: 'todos', label: `Todos (${playersWithAnaliticas.length})` },
              { value: 'alertas', label: `Con Alertas (${playersWithAnaliticas.filter((p) => p.latest && (p.latest.parametros || []).some((param) => param.fuera_rango)).length})` },
              { value: 'normal', label: `Sin Alertas (${playersWithAnaliticas.filter((p) => p.latest && !(p.latest.parametros || []).some((param) => param.fuera_rango)).length})` },
              { value: 'sin_datos', label: `Sin Datos (${playersWithAnaliticas.filter((p) => !p.latest).length})` },
            ]}
          />

          {filteredPlayers.length > 0 ? (
            <ScrollArea>
              <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 800 }}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th style={{ paddingLeft: 16 }}>Jugador</Table.Th>
                    <Table.Th>Última Analítica</Table.Th>
                    <Table.Th>Historial</Table.Th>
                    <Table.Th>Parámetros Fuera de Rango</Table.Th>
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
                        <Table.Td style={{ paddingLeft: 16 }}>
                          <Group gap="xs" wrap="nowrap">
                            <Avatar size={36} radius="xl" color="initials">
                              {initials(`${player.nombre} ${player.apellidos || ''}`)}
                            </Avatar>
                            <div>
                              <Text size="sm" fw={700} c="dark.4">
                                {player.nombre} {player.apellidos}
                              </Text>
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
                          <Text size="sm" fw={500} c="grape">
                            {player.records.length} {player.records.length === 1 ? 'analítica' : 'analíticas'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {hasLatest ? (
                            outOfRange.length > 0 ? (
                              <Group gap={4} wrap="wrap">
                                {outOfRange.map((param, i) => (
                                  <Tooltip key={`${player.id}-alert-${param.nombre}-${i}`} label={`Rango: ${rangeLabel(param)}`}>
                                    <Badge variant="light" color={parameterStatus(param).color} size="sm">
                                      {param.nombre}: {param.valor} {param.unidad} ({parameterStatus(param).label})
                                    </Badge>
                                  </Tooltip>
                                ))
                                }
                              </Group>
                            ) : (
                              <Text size="xs" c="dimmed">Todos en rango</Text>
                            )
                          ) : (
                            <Text size="xs" c="dimmed">—</Text>
                          )}
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
              description="No hay jugadores que coincidan con los filtros aplicados."
            />
          )}
        </Stack>
      </Paper>

      </Stack>
    </BoneyardSkeleton>
  );
}
