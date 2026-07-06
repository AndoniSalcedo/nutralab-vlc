'use client';

import { useState, useMemo } from 'react';
import {
  Badge,
  Box,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Button,
  FileButton,
  Modal,
  Table,
  ScrollArea,
  ActionIcon,
  Tooltip as MantineTooltip,
  TextInput,
  Select,
  Textarea,
  Tabs
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { saveHydrationRecord, importHydrationRecords, refetchHydrationRecords, deleteHydrationRecord } from '@/services/hydration';
import { updatePlayerField } from '@/services/player';
import {
  IconActivityHeartbeat,
  IconDroplet,
  IconTrash,
  IconDatabaseImport,
  IconCheck,
  IconCalendarStats,
  IconClock,
  IconAlertCircle,
  IconEdit,
  IconFlame
} from '@tabler/icons-react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { EditableSection } from '../editable';
import { BentoCard } from '@/components/Bento/BentoItem';
import HydrationCalculator from '@/components/HydrationCalculator';

const METRIC_TABS = {
  hydration: {
    label: 'Hidratación',
    emptyTitle: 'No hay registros de osmolaridad',
    emptyText: 'Para visualizar las gráficas de hidratación y osmolaridad, importa los datos del jugador subiendo un archivo CSV compatible.',
    chartTitle: 'Evolución Osmolaridad de la Saliva',
    valueLabel: 'Osmolaridad',
    unit: 'mOsm',
    color: '#3b82f6',
    gradientId: 'osmColor'
  },
  sweat: {
    label: 'Sudoración',
    emptyTitle: 'No hay registros de sudoración',
    emptyText: 'Para visualizar las métricas de sudoración, importa un CSV con Type = sweat y valores de sodio en sudor.',
    chartTitle: 'Evolución Sodio en Sudor',
    valueLabel: 'Sodio en sudor',
    unit: 'mg/L',
    color: '#f97316',
    gradientId: 'sweatColor'
  }
};

// Hydration status definitions & colors
const STATUS_CONFIGS = {
  'hydrated': { label: 'Hidratado', color: '#22c55e', bg: '#dcfce7' },
  'mildly dehydrated': { label: 'Deshidratación Leve', color: '#eab308', bg: '#fef9c3' },
  'moderately dehydrated': { label: 'Deshidratación Moderada', color: '#f97316', bg: '#ffedd5' },
  'severely dehydrated': { label: 'Deshidratación Severa', color: '#ef4444', bg: '#fee2e2' },
  'unknown': { label: 'Desconocido', color: '#94a3b8', bg: '#f1f5f9' }
};

const SWEAT_STATUS_CONFIGS = {
  low: { label: 'Sodio Bajo', color: '#22c55e', bg: '#dcfce7' },
  moderate: { label: 'Sodio Moderado', color: '#f97316', bg: '#ffedd5' },
  high: { label: 'Sodio Alto', color: '#ef4444', bg: '#fee2e2' },
  unknown: { label: 'Desconocido', color: '#94a3b8', bg: '#f1f5f9' }
};

function isSweatRecord(record) {
  return String(record?.tipo || '').toLowerCase().trim() === 'sweat';
}

function getHydrationStatusConfig(statusStr) {
  const norm = String(statusStr || '').toLowerCase().trim();
  if (norm.includes('mildly') || norm.includes('leve')) return STATUS_CONFIGS['mildly dehydrated'];
  if (norm.includes('moderately') || norm.includes('moderada')) return STATUS_CONFIGS['moderately dehydrated'];
  if (norm.includes('severely') || norm.includes('severa') || norm.includes('dehydrated') || norm.includes('deshidratado')) return STATUS_CONFIGS['severely dehydrated'];
  if (norm.includes('hydrated') || norm.includes('hidratado')) return STATUS_CONFIGS['hydrated'];
  return STATUS_CONFIGS['unknown'];
}

function getSweatStatusConfig(statusStr) {
  const norm = String(statusStr || '').toLowerCase().trim();
  if (norm.includes('high') || norm.includes('alto')) return SWEAT_STATUS_CONFIGS.high;
  if (norm.includes('moderate') || norm.includes('medio') || norm.includes('moderado')) return SWEAT_STATUS_CONFIGS.moderate;
  if (norm.includes('low') || norm.includes('bajo')) return SWEAT_STATUS_CONFIGS.low;
  return SWEAT_STATUS_CONFIGS.unknown;
}

function getRecordStatusConfig(recordOrStatus, maybeType) {
  const status = typeof recordOrStatus === 'object' ? recordOrStatus?.estado : recordOrStatus;
  const type = typeof recordOrStatus === 'object' ? recordOrStatus?.tipo : maybeType;
  return String(type || '').toLowerCase().trim() === 'sweat'
    ? getSweatStatusConfig(status)
    : getHydrationStatusConfig(status);
}

function getSweatAxisDomain(dataMin, dataMax) {
  const min = Number.isFinite(dataMin) ? dataMin : 600;
  const max = Number.isFinite(dataMax) ? dataMax : 900;
  const lower = Math.min(500, Math.floor((min - 80) / 50) * 50);
  const upper = Math.max(1000, Math.ceil((max + 80) / 50) * 50);
  return [Math.max(0, lower), upper];
}

function normalizeCsvKey(key) {
  return String(key || '')
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getCsvVal(row, keys) {
  const normalizedKeys = keys.map(normalizeCsvKey);
  const foundKey = Object.keys(row).find((key) => normalizedKeys.includes(normalizeCsvKey(key)));
  return foundKey ? row[foundKey] : '';
}

export default function HidratacionSubtab({ jugador, registrosHidratacion = [], readOnly = false }) {
  const jugadorId = jugador.id;
  const peso = Number(jugador.peso_kg || 0);
  const aguaBase = peso ? Math.round(peso * 40) : 0;
  const aguaEntreno = peso ? Math.round(peso * 6) : 0;
  const aguaPartido = peso ? Math.round(peso * 10) : 0;

  // Local state for hydration records
  const [registros, setRegistros] = useState(registrosHidratacion);

  // CSV Import States
  const [modalOpen, setModalOpen] = useState(false);
  const [importKind, setImportKind] = useState('hydration');
  const [allImportRows, setAllImportRows] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Edit Record States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    fecha: '',
    hora: '',
    tipo: 'sosm',
    valor: '',
    unidad: 'mOsm',
    estado: 'Hydrated',
    notas: '',
    cuestionario: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const startEditRecord = (record) => {
    setEditingRecord(record);
    setEditForm({
      fecha: record.fecha,
      hora: record.hora || '',
      tipo: record.tipo || 'sosm',
      valor: record.valor !== null && record.valor !== undefined ? String(record.valor) : '',
      unidad: record.unidad || 'mOsm',
      estado: record.estado || 'Hydrated',
      notas: record.notas || '',
      cuestionario: record.cuestionario || ''
    });
    setEditModalOpen(true);
  };

  const hydrationRecords = useMemo(() => {
    return registros.filter((record) => !isSweatRecord(record));
  }, [registros]);

  const sweatRecords = useMemo(() => {
    return registros.filter((record) => isSweatRecord(record));
  }, [registros]);

  const sortedHydrationChronological = useMemo(() => {
    return [...hydrationRecords].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  }, [hydrationRecords]);

  const sortedSweatChronological = useMemo(() => {
    return [...sweatRecords].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  }, [sweatRecords]);

  const saveEditedRecord = async () => {
    setSavingEdit(true);
    try {
      const result = await saveHydrationRecord({
        id: editingRecord?.id,
        jugador_id: jugadorId,
        fecha: editForm.fecha,
        hora: editForm.hora,
        tipo: editForm.tipo,
        valor: editForm.valor !== '' ? parseFloat(editForm.valor) : null,
        unidad: editForm.unidad,
        estado: editForm.estado,
        notas: editForm.notas,
        cuestionario: editForm.cuestionario
      });

      notifications.show({
        color: 'green',
        title: 'Toma Actualizada',
        message: 'La toma se ha actualizado correctamente.',
        icon: <IconCheck size={18} />
      });

      if (result.record) {
        setRegistros(prev => {
          const index = editingRecord?.id
            ? prev.findIndex(r => r.id === editingRecord.id)
            : prev.findIndex(r => r.fecha === editForm.fecha && String(r.tipo || 'sosm') === String(editForm.tipo || 'sosm'));
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = result.record;
            return updated;
          }
          return [...prev, result.record];
        });
      } else {
        window.location.reload();
      }

      setEditModalOpen(false);
      setEditingRecord(null);
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error al actualizar',
        message: e.message
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Reverse chronological for history table
  const sortedDesc = useMemo(() => {
    return [...registros].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }, [registros]);

  async function saveField(field, value) {
    await updatePlayerField(jugador.id, field, value);
  }

  // Handle CSV file selected
  const handleFileChange = (file, kind = importKind) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (!text) return;

      const cleanText = String(text).replace(/^\uFEFF/, '');
      const detectDelimiter = (sample) => {
        let commas = 0;
        let semicolons = 0;
        let insideQuotes = false;
        for (let j = 0; j < sample.length; j++) {
          const char = sample[j];
          const next = sample[j + 1];
          if (char === '"' && insideQuotes && next === '"') {
            j += 1;
          } else if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (!insideQuotes && char === ',') {
            commas += 1;
          } else if (!insideQuotes && char === ';') {
            semicolons += 1;
          }
        }
        return semicolons > commas ? ';' : ',';
      };

      const delimiter = detectDelimiter(cleanText.slice(0, 2000));

      const parseCSV = (csvText) => {
        const rows = [];
        let row = [];
        let currentVal = '';
        let insideQuotes = false;

        for (let j = 0; j < csvText.length; j++) {
          const char = csvText[j];
          const next = csvText[j + 1];

          if (char === '"' && insideQuotes && next === '"') {
            currentVal += '"';
            j += 1;
          } else if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === delimiter && !insideQuotes) {
            row.push(currentVal.trim());
            currentVal = '';
          } else if ((char === '\n' || char === '\r') && !insideQuotes) {
            if (char === '\r' && next === '\n') j += 1;
            row.push(currentVal.trim());
            if (row.some((value) => value !== '')) rows.push(row);
            row = [];
            currentVal = '';
          } else {
            currentVal += char;
          }
        }

        row.push(currentVal.trim());
        if (row.some((value) => value !== '')) rows.push(row);
        return rows;
      };

      const rows = parseCSV(cleanText);
      if (rows.length < 2) {
        notifications.show({
          color: 'red',
          title: 'Error de formato',
          message: 'El archivo CSV está vacío o le faltan datos.',
        });
        return;
      }

      const headers = rows[0].map((header) => header.replace(/^\uFEFF/, '').trim());
      const parsedData = [];

      for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] !== undefined ? values[idx] : '';
        });
        row.Type = kind === 'sweat' ? 'sweat' : 'sosm';
        parsedData.push(row);
      }

      if (parsedData.length === 0) {
        notifications.show({
          color: 'red',
          title: 'Error al procesar',
          message: 'No se encontraron filas de datos válidas en el CSV.',
        });
        return;
      }

      setAllImportRows(parsedData);
      setPreviewRows(parsedData.slice(0, 5));
      setModalOpen(true);
    };
    reader.readAsText(file);
  };

  // Perform bulk import POST to API
  const triggerImport = async () => {
    setImporting(true);
    try {
      const result = await importHydrationRecords(jugadorId, allImportRows);

      notifications.show({
        color: 'green',
        title: 'Carga Completada',
        message: [
          `Se importaron/actualizaron con éxito ${result.count} registro(s).`,
          result.duplicateDateRows ? `${result.duplicateDateRows} fila(s) repetidas por fecha y tipo actualizaron la toma existente.` : '',
          result.skippedRows ? `${result.skippedRows} fila(s) se omitieron por fecha inválida o ausente.` : ''
        ].filter(Boolean).join(' '),
        icon: <IconCheck size={18} />
      });

      // Refetch or update local state
      const refetchRes = await refetchHydrationRecords(jugadorId);
      if (refetchRes.ok) {
        const freshData = await refetchRes.json();
        setRegistros(freshData.records || []);
      } else {
        window.location.reload();
      }

      setModalOpen(false);
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error al guardar registros',
        message: e.message
      });
    } finally {
      setImporting(false);
    }
  };

  // Delete individual hydration/sweat record
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;
    setDeletingId(id);
    try {
      await deleteHydrationRecord(id);

      notifications.show({
        color: 'green',
        title: 'Registro Eliminado',
        message: 'El registro se ha borrado correctamente.',
        icon: <IconCheck size={18} />
      });

      // Update state locally
      setRegistros(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error al eliminar',
        message: e.message
      });
    } finally {
      setDeletingId(null);
    }
  };

  const hidDef = [
    `HIDRATACION - ${jugador.nombre} ${jugador.apellidos}`,
    '',
    `Descanso: ${aguaBase} ml | Entreno: ${aguaBase + aguaEntreno} ml | Partido: ${aguaBase + aguaPartido} ml`,
    '',
    'TIMING:',
    '- Al despertar: 500 ml',
    '- Pre-entreno: 500 ml + electrolitos',
    '- Durante entreno: 150-200 ml / 15 min',
    '- Post-entreno: 150% perdida',
    '- Con comidas: 300 ml',
    '',
    'NOTAS:',
    '',
  ].join('\n');

  // Format date helper
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Recharts Custom Dot for Osmolarity line
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined) return null;
    const cfg = getRecordStatusConfig(payload);
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={cfg.color}
        stroke="#ffffff"
        strokeWidth={1.5}
        style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.15))' }}
      />
    );
  };

  const renderMetricChart = (metricKey, data) => {
    const metric = METRIC_TABS[metricKey];
    const isSweat = metricKey === 'sweat';

    if (data.length === 0) {
      return (
        <Paper p="xl" radius="lg" withBorder bg="white" shadow="sm" align="center">
          <ThemeIcon size={44} radius="xl" color={isSweat ? 'orange' : 'blue'} variant="light" mb="xs">
            <IconAlertCircle size={24} />
          </ThemeIcon>
          <Title order={4} c="dark.7">{metric.emptyTitle}</Title>
          <Text size="xs" c="dimmed" maxW={400} mx="auto" mt={4}>
            {metric.emptyText}
          </Text>
        </Paper>
      );
    }

    return (
      <Paper p="md" radius="lg" withBorder bg="white" shadow="sm">
        <Stack gap="xs">
          <Text size="xs" c="dimmed" tt="uppercase" fw={800}>{metric.chartTitle}</Text>
          <Box h={140} mt="md">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id={metric.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={metric.color} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 9 }}
                  stroke="#94a3b8"
                  tickFormatter={(v) => {
                    try {
                      const parts = v.split('-');
                      return `${parts[2]}/${parts[1]}`;
                    } catch (e) { return v; }
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9 }}
                  domain={isSweat
                    ? [
                      (dataMin) => getSweatAxisDomain(dataMin, undefined)[0],
                      (dataMax) => getSweatAxisDomain(undefined, dataMax)[1],
                    ]
                    : [0, (dataMax) => Math.max(120, Math.ceil(dataMax / 10) * 10)]}
                  stroke="#94a3b8"
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  labelFormatter={(v) => formatDateLabel(v)}
                  formatter={(value, name, props) => {
                    if (name === 'valor') return [`${value} ${props?.payload?.unidad || metric.unit}`, metric.valueLabel];
                    return [value, name];
                  }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', padding: '6px 10px', fontSize: 11 }}
                  labelStyle={{ fontWeight: 700 }}
                />

                {isSweat ? (
                  <>
                    <ReferenceLine y={600} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Bajo (600)', fill: '#22c55e', fontSize: 9, position: 'top' }} />
                    <ReferenceLine y={900} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Alto (900)', fill: '#ef4444', fontSize: 9, position: 'top' }} />
                  </>
                ) : (
                  <>
                    <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Límite Hidratado (60)', fill: '#22c55e', fontSize: 9, position: 'top' }} />
                    <ReferenceLine y={95} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Límite Leve (95)', fill: '#f97316', fontSize: 9, position: 'top' }} />
                  </>
                )}

                <Area type="monotone" dataKey="valor" fill={`url(#${metric.gradientId})`} stroke="none" connectNulls />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke={metric.color}
                  strokeWidth={2.5}
                  dot={<CustomDot />}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Stack>
      </Paper>
    );
  };

  return (
    <Stack gap="md">
      {/* Header Panel */}
      <Paper p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" radius="xl" size="lg">
              <IconDroplet size={20} />
            </ThemeIcon>
            <Stack gap={2}>
              <Title order={3} fw={800} c="dark.4">Hidratación y sudoración</Title>
              <Text size="sm" c="dimmed">
                Análisis de osmolaridad salival y sodio en sudor.
              </Text>
            </Stack>
          </Group>
          <Group gap="xs">
            {peso && (
              <Badge color="blue" variant="light" size="lg">{peso} kg · base 40 ml/kg</Badge>
            )}
            {!readOnly && (
              <Button
                leftSection={<IconDatabaseImport size={16} />}
                color="blue"
                radius="xl"
                size="xs"
                onClick={() => {
                  setAllImportRows([]);
                  setPreviewRows([]);
                  setModalOpen(true);
                }}
              >
                Importar CSV
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Horizontal Charts Section */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        {renderMetricChart('hydration', sortedHydrationChronological)}
        {renderMetricChart('sweat', sortedSweatChronological)}
      </SimpleGrid>

      {/* Main Hydration Content & Timing Cards */}
      <Box px={{ base: 'sm', sm: 0 }} pb="sm">
        <Stack gap="md">
          <BentoCard title="Timing recomendado" icon={IconActivityHeartbeat} color="cyan">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing={{ base: 'md', sm: 'sm' }}>
              {[
                ['Al despertar', '500 ml'],
                ['Pre-entreno', '500 ml + electrolitos'],
                ['Durante', '150-200 ml / 15 min'],
                ['Post', '150% pérdida'],
                ['Comidas', '300 ml'],
              ].map(([label, value]) => (
                <Paper key={label} p="sm" radius="md" bg="gray.0" withBorder>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">{label}</Text>
                  <Text size="sm" fw={700} c="dark.4">{value}</Text>
                </Paper>
              ))}
            </SimpleGrid>
          </BentoCard>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={{ base: 'md', sm: 'lg' }}>
            <HydrationCalculator jugador={jugador} />
            <EditableSection title="Notas y ajustes de hidratación" defaultValue={jugador.notas_hidratacion || hidDef} onSave={(v) => saveField('notas_hidratacion', v)} readOnly={readOnly} />
          </SimpleGrid>

          {/* Historical Hydration Entries Table */}
          {!readOnly && registros.length > 0 && (
            <BentoCard title="Historial detallado de hidratación y sudoración" icon={IconCalendarStats} color="blue">
              <ScrollArea h={300}>
                <Table striped highlightOnHover verticalSpacing="xs">
                  <Table.Thead bg="gray.0">
                    <Table.Tr>
                      <Table.Th style={{ fontSize: 11 }}>Fecha</Table.Th>
                      <Table.Th style={{ fontSize: 11 }}>Hora</Table.Th>
                      <Table.Th style={{ fontSize: 11 }}>Tipo</Table.Th>
                      <Table.Th style={{ fontSize: 11, textAlign: 'right' }}>Valor</Table.Th>
                      <Table.Th style={{ fontSize: 11 }}>Unidad</Table.Th>
                      <Table.Th style={{ fontSize: 11 }}>Estado</Table.Th>
                      <Table.Th style={{ fontSize: 11 }}>Notas</Table.Th>
                      {!readOnly && <Table.Th style={{ fontSize: 11, textAlign: 'center' }}>Acciones</Table.Th>}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {sortedDesc.map((row) => {
                      const cfg = getRecordStatusConfig(row);
                      return (
                        <Table.Tr key={row.id}>
                          <Table.Td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{formatDateLabel(row.fecha)}</Table.Td>
                          <Table.Td style={{ fontSize: 11 }}>
                            <Group gap={4} wrap="nowrap">
                              <IconClock size={12} stroke={1.5} color="var(--mantine-color-dimmed)" />
                              {row.hora || '-'}
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ fontSize: 11 }}>
                            <Badge variant="outline" color="gray" size="xs">{row.tipo || 'sosm'}</Badge>
                          </Table.Td>
                          <Table.Td style={{ fontSize: 11, fontWeight: 700, textAlign: 'right' }}>{row.valor !== null ? row.valor : '-'}</Table.Td>
                          <Table.Td style={{ fontSize: 11, c: 'dimmed' }}>{row.unidad || (isSweatRecord(row) ? METRIC_TABS.sweat.unit : METRIC_TABS.hydration.unit)}</Table.Td>
                          <Table.Td style={{ fontSize: 11 }}>
                            <Badge
                              style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}
                              size="xs"
                            >
                              {cfg.label}
                            </Badge>
                          </Table.Td>
                          <Table.Td style={{ fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.notas ? (
                              <MantineTooltip label={row.notas} position="top" withArrow>
                                <Text size="xs" span style={{ cursor: 'help' }}>{row.notas}</Text>
                              </MantineTooltip>
                            ) : '-'}
                          </Table.Td>
                          {!readOnly && (
                            <Table.Td style={{ fontSize: 11, textAlign: 'center' }}>
                              <Group gap={4} justify="center">
                                <ActionIcon
                                  color="blue"
                                  variant="subtle"
                                  radius="xl"
                                  onClick={() => startEditRecord(row)}
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                                <ActionIcon
                                  color="red"
                                  variant="subtle"
                                  radius="xl"
                                  onClick={() => handleDelete(row.id)}
                                  loading={deletingId === row.id}
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Group>
                            </Table.Td>
                          )}
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </BentoCard>
          )}
        </Stack>
      </Box>

      {/* CSV Preview and Confirm Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setAllImportRows([]);
          setPreviewRows([]);
        }}
        title={
          <Group gap="xs">
            <IconDatabaseImport size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Text fw={700}>Añadir datos</Text>
          </Group>
        }
        size="xl"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <Stack gap="md">
          <Tabs
            value={importKind}
            onChange={(value) => {
              setImportKind(value || 'hydration');
              setAllImportRows([]);
              setPreviewRows([]);
            }}
            variant="outline"
            radius="md"
          >
            <Tabs.List grow>
              <Tabs.Tab value="hydration" leftSection={<IconDroplet size={15} />}>
                Hidratación
              </Tabs.Tab>
              <Tabs.Tab value="sweat" leftSection={<IconFlame size={15} />}>
                Sudoración
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="hydration" pt="md">
              <Group justify="space-between" align="center" wrap="wrap">
                <Text size="sm" c="dimmed">Carga un CSV de osmolaridad salival.</Text>
                <FileButton onChange={(file) => handleFileChange(file, 'hydration')} accept=".csv">
                  {(props) => (
                    <Button {...props} leftSection={<IconDatabaseImport size={16} />} color="blue" radius="xl" size="xs">
                      Seleccionar CSV
                    </Button>
                  )}
                </FileButton>
              </Group>
            </Tabs.Panel>

            <Tabs.Panel value="sweat" pt="md">
              <Group justify="space-between" align="center" wrap="wrap">
                <Text size="sm" c="dimmed">Carga un CSV de sodio en sudor.</Text>
                <FileButton onChange={(file) => handleFileChange(file, 'sweat')} accept=".csv">
                  {(props) => (
                    <Button {...props} leftSection={<IconDatabaseImport size={16} />} color="orange" radius="xl" size="xs">
                      Seleccionar CSV
                    </Button>
                  )}
                </FileButton>
              </Group>
            </Tabs.Panel>
          </Tabs>

          {allImportRows.length > 0 ? (
            <>
              <Text size="xs" fw={700} c="dimmed">
                Vista previa de los primeros {previewRows.length} registros (Total: {allImportRows.length}):
              </Text>

              <ScrollArea>
                <Table striped highlightOnHover verticalSpacing="xs">
                  <Table.Thead bg="gray.0">
                    <Table.Tr>
                      <Table.Th style={{ fontSize: 10 }}>Fecha</Table.Th>
                      <Table.Th style={{ fontSize: 10 }}>Hora</Table.Th>
                      <Table.Th style={{ fontSize: 10 }}>Tipo</Table.Th>
                      <Table.Th style={{ fontSize: 10, textAlign: 'right' }}>Valor</Table.Th>
                      <Table.Th style={{ fontSize: 10 }}>Unidad</Table.Th>
                      <Table.Th style={{ fontSize: 10 }}>Estado</Table.Th>
                      <Table.Th style={{ fontSize: 10 }}>Notas</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {previewRows.map((r, i) => {
                      const rawDate = getCsvVal(r, ['Date', 'fecha', 'dia', 'measurement date']);
                      const rawTime = getCsvVal(r, ['Time', 'hora']);
                      const rawType = getCsvVal(r, ['Type', 'tipo']);
                      const rawVal = getCsvVal(r, ['Value', 'valor', 'sosm', 'osmolarity', 'osmolaridad']);
                      const rawUnit = getCsvVal(r, ['Unit', 'unidad']);
                      const rawStatus = getCsvVal(r, ['Status', 'estado']);
                      const rawNotes = getCsvVal(r, ['Notes', 'notas']);

                      const cfg = getRecordStatusConfig(rawStatus, rawType);

                      return (
                        <Table.Tr key={i}>
                          <Table.Td style={{ fontSize: 10 }}>{rawDate}</Table.Td>
                          <Table.Td style={{ fontSize: 10 }}>{rawTime || '-'}</Table.Td>
                          <Table.Td style={{ fontSize: 10 }}>
                            <Badge size="xs" color="gray" variant="outline">{rawType || 'sosm'}</Badge>
                          </Table.Td>
                          <Table.Td style={{ fontSize: 10, fontWeight: 700, textAlign: 'right' }}>{rawVal}</Table.Td>
                          <Table.Td style={{ fontSize: 10 }}>{rawUnit || (String(rawType).toLowerCase() === 'sweat' ? 'mg/L' : 'mOsm')}</Table.Td>
                          <Table.Td style={{ fontSize: 10 }}>
                            <Badge style={{ backgroundColor: cfg.bg, color: cfg.color }} size="xs">
                              {cfg.label}
                            </Badge>
                          </Table.Td>
                          <Table.Td style={{ fontSize: 10, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rawNotes || '-'}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </>
          ) : (
            <Paper p="md" radius="md" bg="gray.0" withBorder>
              <Text size="sm" fw={700}>
                Selecciona un CSV desde la pestaña {importKind === 'sweat' ? 'Sudoración' : 'Hidratación'}.
              </Text>
            </Paper>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" radius="xl" size="xs" onClick={() => setModalOpen(false)} disabled={importing}>
              Cancelar
            </Button>
            <Button
              color="blue"
              radius="xl"
              size="xs"
              leftSection={<IconCheck size={16} />}
              onClick={triggerImport}
              loading={importing}
              disabled={allImportRows.length === 0}
            >
              Confirmar e Importar {allImportRows.length} Registros
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Record Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingRecord(null);
        }}
        title={
          <Group gap="xs">
            <IconEdit size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Text fw={700}>Editar Registro</Text>
          </Group>
        }
        radius="lg"
        size="md"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <Stack gap="md">
          <SimpleGrid cols={2} spacing="sm">
            <TextInput label="Fecha" value={editForm.fecha} disabled />
            <TextInput
              label="Hora"
              placeholder="e.g. 9:22 AM"
              value={editForm.hora}
              onChange={(e) => setEditForm(prev => ({ ...prev, hora: e.target.value }))}
            />
            <TextInput
              label="Tipo"
              placeholder="e.g. sosm"
              value={editForm.tipo}
              onChange={(e) => setEditForm(prev => ({ ...prev, tipo: e.target.value }))}
            />
            <TextInput
              label="Valor"
              type="number"
              placeholder="e.g. 60"
              value={editForm.valor}
              onChange={(e) => setEditForm(prev => ({ ...prev, valor: e.target.value }))}
            />
            <TextInput
              label="Unidad"
              placeholder="e.g. mOsm"
              value={editForm.unidad}
              onChange={(e) => setEditForm(prev => ({ ...prev, unidad: e.target.value }))}
            />
            <Select
              label="Estado"
              value={editForm.estado}
              onChange={(val) => setEditForm(prev => ({ ...prev, estado: val }))}
              data={String(editForm.tipo || '').toLowerCase() === 'sweat'
                ? [
                  { value: 'Low Sodium', label: 'Sodio Bajo (Low)' },
                  { value: 'Moderate Sodium', label: 'Sodio Moderado (Moderate)' },
                  { value: 'High Sodium', label: 'Sodio Alto (High)' },
                ]
                : [
                  { value: 'Hydrated', label: 'Hidratado (Hydrated)' },
                  { value: 'Mildly Dehydrated', label: 'Deshidratación Leve (Mildly)' },
                  { value: 'Moderately Dehydrated', label: 'Deshidratación Moderada (Moderately)' },
                  { value: 'Severely Dehydrated', label: 'Deshidratación Severa (Severely)' },
                ]}
            />
          </SimpleGrid>

          <Textarea
            label="Notas"
            value={editForm.notas}
            onChange={(e) => setEditForm(prev => ({ ...prev, notas: e.target.value }))}
            minRows={2}
          />
          <Textarea
            label="Cuestionario"
            value={editForm.cuestionario}
            onChange={(e) => setEditForm(prev => ({ ...prev, cuestionario: e.target.value }))}
            minRows={2}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="light" color="gray" radius="xl" size="xs" onClick={() => {
              setEditModalOpen(false);
              setEditingRecord(null);
            }}>
              Cancelar
            </Button>
            <Button color="blue" radius="xl" size="xs" leftSection={<IconCheck size={16} />} onClick={saveEditedRecord} loading={savingEdit}>
              Guardar Cambios
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
