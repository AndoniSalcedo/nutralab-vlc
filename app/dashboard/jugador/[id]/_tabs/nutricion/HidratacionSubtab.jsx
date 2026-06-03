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
  Alert,
  Tooltip as MantineTooltip,
  TextInput,
  Select,
  Textarea
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconActivityHeartbeat,
  IconDroplet,
  IconTrash,
  IconDatabaseImport,
  IconCheck,
  IconCalendarStats,
  IconClock,
  IconAlertCircle,
  IconEdit
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
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { EditableSection } from '../editable';
import { BentoCard } from '@/components/Bento/BentoItem';
import HydrationCalculator from '@/components/HydrationCalculator';

// Hydration status definitions & colors
const STATUS_CONFIGS = {
  'hydrated': { label: 'Hidratado', color: '#22c55e', bg: '#dcfce7' },
  'mildly dehydrated': { label: 'Deshidratación Leve', color: '#eab308', bg: '#fef9c3' },
  'moderately dehydrated': { label: 'Deshidratación Moderada', color: '#f97316', bg: '#ffedd5' },
  'severely dehydrated': { label: 'Deshidratación Severa', color: '#ef4444', bg: '#fee2e2' },
  'unknown': { label: 'Desconocido', color: '#94a3b8', bg: '#f1f5f9' }
};

function getStatusConfig(statusStr) {
  const norm = String(statusStr || '').toLowerCase().trim();
  if (norm.includes('mildly') || norm.includes('leve')) return STATUS_CONFIGS['mildly dehydrated'];
  if (norm.includes('moderately') || norm.includes('moderada')) return STATUS_CONFIGS['moderately dehydrated'];
  if (norm.includes('severely') || norm.includes('severa') || norm.includes('dehydrated') || norm.includes('deshidratado')) return STATUS_CONFIGS['severely dehydrated'];
  if (norm.includes('hydrated') || norm.includes('hidratado')) return STATUS_CONFIGS['hydrated'];
  return STATUS_CONFIGS['unknown'];
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

  const saveEditedRecord = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch('/api/registros-hidratacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jugador_id: jugadorId,
          fecha: editForm.fecha,
          hora: editForm.hora,
          tipo: editForm.tipo,
          valor: editForm.valor !== '' ? parseFloat(editForm.valor) : null,
          unidad: editForm.unidad,
          estado: editForm.estado,
          notas: editForm.notas,
          cuestionario: editForm.cuestionario
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al guardar la toma');

      notifications.show({
        color: 'green',
        title: 'Toma Actualizada',
        message: 'La toma se ha actualizado correctamente.',
        icon: <IconCheck size={18} />
      });

      if (result.record) {
        setRegistros(prev => {
          const index = prev.findIndex(r => r.fecha === editForm.fecha);
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

  // Sorting: chronological ascending for charts
  const sortedChronological = useMemo(() => {
    return [...registros].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  }, [registros]);

  // Reverse chronological for history table
  const sortedDesc = useMemo(() => {
    return [...registros].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }, [registros]);

  // Aggregate stats for status breakdown
  const statusStats = useMemo(() => {
    const counts = {};
    registros.forEach(r => {
      const cfg = getStatusConfig(r.estado);
      counts[cfg.label] = (counts[cfg.label] || 0) + 1;
    });

    return Object.entries(counts).map(([name, val]) => {
      // Find matching color
      const matchingCfg = Object.values(STATUS_CONFIGS).find(c => c.label === name) || STATUS_CONFIGS['unknown'];
      return {
        name,
        value: val,
        color: matchingCfg.color
      };
    });
  }, [registros]);

  async function saveField(field, value) {
    await fetch('/api/update-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: jugador.id, field, value }),
    });
  }

  // Handle CSV file selected
  const handleFileChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        notifications.show({
          color: 'red',
          title: 'Error de formato',
          message: 'El archivo CSV está vacío o le faltan datos.',
        });
        return;
      }

      // Robust CSV parser supporting commas inside quoted values
      const parseCSVLine = (lineStr) => {
        const values = [];
        let currentVal = '';
        let insideQuotes = false;
        for (let j = 0; j < lineStr.length; j++) {
          const char = lineStr[j];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentVal.trim().replace(/^"|"$/g, ''));
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        values.push(currentVal.trim().replace(/^"|"$/g, ''));
        return values;
      };

      const headers = parseCSVLine(lines[0]);
      const parsedData = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        if (values.length < headers.length) continue;

        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] !== undefined ? values[idx] : '';
        });
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
      const res = await fetch('/api/registros-hidratacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador_id: jugadorId, data: allImportRows }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error en importación');

      notifications.show({
        color: 'green',
        title: 'Carga Completada',
        message: `Se importaron/actualizaron con éxito ${result.count} tomas de hidratación.`,
        icon: <IconCheck size={18} />
      });

      // Refetch or update local state
      // Let's do a client-side fetch of the updated registros to sync
      const refetchRes = await fetch(`/api/registros-hidratacion?jugador_id=${jugadorId}`);
      if (refetchRes.ok) {
        // Wait, wait, let's see. If the page is re-rendered or we just fetch from Supabase,
        // we can trigger a state update. We can also just fetch them from database directly:
        // Wait! Let's check how GET is handled on /api/registros-hidratacion.
        // In our route.js we implemented GET? No, in route.js we had POST and DELETE.
        // Let's check: did we implement GET in app/api/registros-hidratacion/route.js?
        // Ah! In route.js we only put POST and DELETE!
        // No problem, we can easily add a GET handler or simply refetch by doing a soft page reload or updating the state directly using the values we uploaded!
        // To update state directly: since we know the uploaded values, we can merge them!
        // Or wait, let's see. The API endpoint upserts them, so the server is updated. Let's add the GET method to /api/registros-hidratacion/route.js or just refresh the window router, or update the local state with mapped rows!
        // Soft reload is `window.location.reload()` which is incredibly simple and reliable, or we can just merge the data in state. Let's reload to ensure all Server Components are fully in sync!
        window.location.reload();
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

  // Delete individual hydration record
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro de hidratación?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/registros-hidratacion?id=${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al eliminar');

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
    const cfg = getStatusConfig(payload.estado);
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
              <Title order={3} fw={800} c="dark.4">Hidratación</Title>
              <Text size="sm" c="dimmed">
                Control histórico, análisis de osmolaridad saliva (`sosm`) e importación de tomas.
              </Text>
            </Stack>
          </Group>
          <Group gap="xs">
            {peso && (
              <Badge color="blue" variant="light" size="lg">{peso} kg · base 40 ml/kg</Badge>
            )}
            {!readOnly && (
              <FileButton onChange={handleFileChange} accept=".csv">
                {(props) => (
                  <Button
                    {...props}
                    leftSection={<IconDatabaseImport size={16} />}
                    color="blue"
                    radius="xl"
                    size="xs"
                  >
                    Importar CSV
                  </Button>
                )}
              </FileButton>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Horizontal Charts Section */}
      {sortedChronological.length > 0 ? (
        <Paper p="md" radius="lg" withBorder bg="white" shadow="sm">
          <Stack gap="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Evolución Osmolaridad de la Saliva</Text>
            <Box h={140} mt="md">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sortedChronological} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="osmColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
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
                    domain={[0, (dataMax) => Math.max(120, Math.ceil(dataMax / 10) * 10)]}
                    stroke="#94a3b8"
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    labelFormatter={(v) => formatDateLabel(v)}
                    formatter={(value, name, props) => {
                      if (name === 'valor') return [`${value} mOsm`, 'Osmolaridad'];
                      return [value, name];
                    }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', padding: '6px 10px', fontSize: 11 }}
                    labelStyle={{ fontWeight: 700 }}
                  />

                  {/* Reference zones/lines */}
                  <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Límite Hidratado (60)', fill: '#22c55e', fontSize: 9, position: 'top' }} />
                  <ReferenceLine y={95} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Límite Leve (95)', fill: '#f97316', fontSize: 9, position: 'top' }} />

                  <Area type="monotone" dataKey="valor" fill="url(#osmColor)" stroke="none" connectNulls />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#3b82f6"
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
      ) : (
        <Paper p="xl" radius="lg" withBorder bg="white" shadow="sm" align="center">
          <ThemeIcon size={44} radius="xl" color="blue" variant="light" mb="xs">
            <IconAlertCircle size={24} />
          </ThemeIcon>
          <Title order={4} c="dark.7">No hay registros de osmolaridad</Title>
          <Text size="xs" c="dimmed" maxW={400} mx="auto" mt={4}>
            Para visualizar las gráficas de hidratación y osmolaridad, importa los datos del jugador subiendo un archivo CSV compatible.
          </Text>
        </Paper>
      )}

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
            <BentoCard title="Historial detallado de hidratación" icon={IconCalendarStats} color="blue">
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
                      const cfg = getStatusConfig(row.estado);
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
                          <Table.Td style={{ fontSize: 11, c: 'dimmed' }}>{row.unidad || 'mOsm'}</Table.Td>
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
        onClose={() => setModalOpen(false)}
        title="Vista Previa de Importación de Hidratación"
        size="xl"
        radius="lg"
      >
        <Stack gap="md">
          <Alert color="blue" icon={<IconAlertCircle size={18} />}>
            Los datos correspondientes a fechas existentes se actualizarán (upsert) de manera única por día. El identificador `Measurement ID` y `User ID` del CSV serán omitidos y asociados al jugador actual.
          </Alert>

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
                  const rawDate = r['Date'] || r['fecha'];
                  const rawTime = r['Time'] || r['hora'];
                  const rawType = r['Type'] || r['tipo'];
                  const rawVal = r['Value'] || r['valor'];
                  const rawUnit = r['Unit'] || r['unidad'];
                  const rawStatus = r['Status'] || r['estado'];
                  const rawNotes = r['Notes'] || r['notas'];

                  const cfg = getStatusConfig(rawStatus);

                  return (
                    <Table.Tr key={i}>
                      <Table.Td style={{ fontSize: 10 }}>{rawDate}</Table.Td>
                      <Table.Td style={{ fontSize: 10 }}>{rawTime || '-'}</Table.Td>
                      <Table.Td style={{ fontSize: 10 }}>
                        <Badge size="xs" color="gray" variant="outline">{rawType || 'sosm'}</Badge>
                      </Table.Td>
                      <Table.Td style={{ fontSize: 10, fontWeight: 700, textAlign: 'right' }}>{rawVal}</Table.Td>
                      <Table.Td style={{ fontSize: 10 }}>{rawUnit || 'mOsm'}</Table.Td>
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
            >
              Confirmar e Importar {allImportRows.length} Tomas
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
        title="Editar Toma de Hidratación"
        radius="lg"
        size="md"
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
              data={[
                { value: 'Hydrated', label: 'Hidratado (Hydrated)' },
                { value: 'Mildly Dehydrated', label: 'Deshidratación Leve (Mildly)' },
                { value: 'Moderately Dehydrated', label: 'Deshidratación Moderada (Moderately)' },
                { value: 'Severely Dehydrated', label: 'Deshidratación Severa (Severely)' },
              ]}
            />
          </SimpleGrid>

          <Textarea
            label="Notas"
            value={editForm.notes || editForm.notas}
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
