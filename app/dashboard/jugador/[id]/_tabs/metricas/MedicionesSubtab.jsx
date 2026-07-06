'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
  ScrollArea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { saveEvolution, deleteEvolution } from '@/services/evolution';
import { IconCalendarStats, IconCheck, IconEdit, IconPlus, IconRuler2, IconTrash, IconFilter } from '@tabler/icons-react';
import { BentoCard } from '@/components/Bento/BentoItem';
import NothingFound from '@/components/NothingFound/NothingFound';
import {
  MEASUREMENT_DETAIL_SECTIONS,
  TREND_MEASUREMENT_METRICS,
  formatMetricValue,
  hasMetricValue,
  metricValue,
  getSeason,
  formatMetricNumber,
} from '@/lib/measurement-metrics';

const METRICAS = TREND_MEASUREMENT_METRICS;

function formatSeasonOption(s) {
  if (!s) return '';
  const [startYear, endYear] = s.split('/');
  return `Temporada ${s} (julio ${startYear} - junio ${endYear})`;
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

function emptyForm() {
  return {
    id: null,
    fecha: new Date().toISOString().split('T')[0],
    altura_cm: '',
    peso_kg: '',
    porcentaje_grasa: '',
    masa_magra_kg: '',
    suma_6_pliegues: '',
    notas: '',
  };
}

function formFromMedicion(medicion) {
  return {
    id: medicion?.id || null,
    fecha: medicion?.fecha || new Date().toISOString().split('T')[0],
    altura_cm: medicion?.altura_cm ?? '',
    peso_kg: medicion?.peso_kg ?? '',
    porcentaje_grasa: medicion?.porcentaje_grasa ?? '',
    masa_magra_kg: medicion?.masa_magra_kg ?? '',
    suma_6_pliegues: medicion?.suma_6_pliegues ?? '',
    notas: medicion?.notas || '',
  };
}

function fechaLabel(fecha) {
  if (!fecha) return 'Sin fecha';
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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
  if (value instanceof Date) return fechaLabel(value.toISOString().split('T')[0]);
  if (typeof value === 'number') return String(formatMetricNumber(value, 2) ?? value);
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value);
}

function sourceRows(medicion) {
  return [
    ['Fecha', fechaLabel(medicion?.fecha)],
    ['Hoja Excel', medicion?.fuente_hoja],
    ['Fila Excel', medicion?.fuente_fila],
    ['Fecha original Excel', medicion?.fecha_original_excel ? fechaLabel(medicion.fecha_original_excel) : null],
    ['Fecha corregida', medicion?.fecha_corregida ? 'Sí' : null],
  ].filter(([, value]) => hasMetricValue(value));
}

export default function MedicionesSubtab({ jugador, evoluciones: evolucionesIniciales = [], readOnly = false }) {
  const jugadorId = jugador.id;
  const [evoluciones, setEvoluciones] = useState(evolucionesIniciales || []);
  const [currentId, setCurrentId] = useState(evolucionesIniciales.length ? String(evolucionesIniciales[evolucionesIniciales.length - 1].id) : null);
  const [selectedSeason, setSelectedSeason] = useState(() => {
    const list = Array.from(new Set((evolucionesIniciales || []).map(e => getSeason(e.fecha)).filter(Boolean))).sort().reverse();
    return list[0] || 'Todas';
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const seasons = useMemo(() => {
    const list = Array.from(new Set(evoluciones.map(e => getSeason(e.fecha)).filter(Boolean))).sort().reverse();
    return list;
  }, [evoluciones]);

  const filteredEvoluciones = useMemo(() => {
    return evoluciones.filter((e) => {
      if (selectedSeason !== 'Todas' && getSeason(e.fecha) !== selectedSeason) return false;
      if (dateFrom && String(e.fecha) < dateFrom) return false;
      if (dateTo && String(e.fecha) > dateTo) return false;
      return true;
    });
  }, [evoluciones, selectedSeason, dateFrom, dateTo]);

  const sortedAsc = useMemo(
    () => [...filteredEvoluciones].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))),
    [filteredEvoluciones]
  );
  const sortedDesc = useMemo(() => [...sortedAsc].reverse(), [sortedAsc]);
  const selected = sortedAsc.find((e) => String(e.id) === String(currentId)) || sortedAsc[sortedAsc.length - 1] || null;

  useEffect(() => {
    if (sortedDesc.length > 0) {
      const exists = sortedDesc.some((e) => String(e.id) === String(currentId));
      if (!exists) {
        setCurrentId(String(sortedDesc[0].id));
      }
    } else {
      setCurrentId(null);
    }
  }, [sortedDesc, currentId]);

  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
    const seasonEvoluciones = season === 'Todas'
      ? evoluciones
      : evoluciones.filter(e => getSeason(e.fecha) === season);

    if (seasonEvoluciones.length > 0) {
      const sorted = [...seasonEvoluciones].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
      setCurrentId(String(sorted[sorted.length - 1].id));
    } else {
      setCurrentId(null);
    }
  };

  function startNew() {
    setModalMode('new');
    setForm(emptyForm());
  }

  function startEdit() {
    if (!selected) return;
    setModalMode('edit');
    setForm(formFromMedicion(selected));
  }

  function cancelForm() {
    setModalMode(null);
  }

  function updateFormField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function diff(metric) {
    const metricData = sortedAsc
      .map((item) => ({ ...item, value: metricValue(item, metric) }))
      .filter((item) => hasMetricValue(item.value));
    if (metricData.length < 2) return null;
    const firstMetric = metricData[0];
    const lastMetric = metricData[metricData.length - 1];
    const d = Number(lastMetric.value) - Number(firstMetric.value);
    if (!Number.isFinite(d)) return null;
    const goodDown = metric.goodDown === true;
    const goodUp = metric.goodDown === false;
    const color = d > 0
      ? (goodDown ? 'red' : goodUp ? 'green' : 'blue')
      : (goodDown ? 'green' : goodUp ? 'red' : 'blue');
    return {
      val: d > 0 ? `+${d.toFixed(2)}` : d.toFixed(2),
      color,
    };
  }

  async function handleSave() {
    if (readOnly) return;
    setSaving(true);
    try {
      const data = await saveEvolution({
        jugador_id: jugadorId,
        ...form,
        altura_cm: form.altura_cm ? Number(form.altura_cm) : null,
        peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
        porcentaje_grasa: form.porcentaje_grasa ? Number(form.porcentaje_grasa) : null,
        masa_magra_kg: form.masa_magra_kg ? Number(form.masa_magra_kg) : null,
        suma_6_pliegues: form.suma_6_pliegues ? Number(form.suma_6_pliegues) : null,
      });

      setEvoluciones((prev) => {
        const filtered = prev.filter((e) => e.id !== data.evolucion.id && e.fecha !== data.evolucion.fecha);
        return [...filtered, data.evolucion];
      });
      setSelectedSeason(getSeason(data.evolucion.fecha) || 'Todas');
      setCurrentId(String(data.evolucion.id));
      setModalMode(null);
      notifications.show({
        color: 'green',
        title: 'Medición guardada',
        message: 'La medición se ha guardado correctamente.',
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo guardar la medición',
        message: e.message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (readOnly || !selected) return;
    const confirmed = window.confirm(`¿Seguro que quieres borrar la medición del ${fechaLabel(selected.fecha)}?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteEvolution(selected.id);

      const remaining = evoluciones.filter((e) => String(e.id) !== String(selected.id));
      setEvoluciones(remaining);

      const remainingInSeason = selectedSeason === 'Todas'
        ? remaining
        : remaining.filter(e => getSeason(e.fecha) === selectedSeason);

      if (remainingInSeason.length > 0) {
        const nextSorted = [...remainingInSeason].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
        const nextSelected = nextSorted[nextSorted.length - 1];
        setCurrentId(nextSelected?.id ? String(nextSelected.id) : null);
      } else {
        setSelectedSeason('Todas');
        const nextSorted = [...remaining].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
        const nextSelected = nextSorted[nextSorted.length - 1];
        setCurrentId(nextSelected?.id ? String(nextSelected.id) : null);
      }

      notifications.show({
        color: 'green',
        title: 'Medición borrada',
        message: 'La medición se ha eliminado correctamente.',
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo borrar la medición',
        message: e.message,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Stack gap={0}>
      <Paper p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <ThemeIcon color="cyan" variant="light" radius="xl" size="lg">
                <IconRuler2 size={20} />
              </ThemeIcon>
              <Stack gap={2}>
                <Title order={3} fw={800} c="dark.4">Composición</Title>
                <Text size="sm" c="dimmed">
                  Historial de medidas y evolución del jugador.
                </Text>
              </Stack>
            </Group>

            {!readOnly && (
              <Group gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  radius="xl"
                  leftSection={<IconTrash size={14} />}
                  onClick={handleDelete}
                  loading={deleting}
                  disabled={!selected}
                >
                  Borrar actual
                </Button>
                <Button size="xs" variant="light" color="dark" radius="xl" leftSection={<IconEdit size={14} />} disabled={!selected} onClick={startEdit}>
                  Editar actual
                </Button>
                <Button size="xs" radius="xl" leftSection={<IconPlus size={14} />} onClick={startNew}>
                  Añadir
                </Button>
              </Group>
            )}
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            <Select
              placeholder="Temporada"
              leftSection={<IconCalendarStats size={16} />}
              data={[{ value: 'Todas', label: 'Todas las temporadas' }, ...seasons.map(s => ({ value: s, label: formatSeasonOption(s) }))]}
              value={selectedSeason}
              onChange={handleSeasonChange}
              variant="filled"
              radius="md"
              allowDeselect={false}
              disabled={seasons.length === 0}
            />
            <Group gap="xs" grow style={{ minWidth: 260 }}>
              <DateInput
                placeholder="Fecha de inicio"
                leftSection={<IconFilter size={16} style={{ opacity: 0.7 }} />}
                value={dateValue(dateFrom)}
                onChange={(value) => setDateFrom(dateInputToIso(value))}
                variant="filled"
                radius="md"
                valueFormat="DD/MM/YYYY"
                clearable
              />
              <DateInput
                placeholder="Fecha de fin"
                leftSection={<IconFilter size={16} style={{ opacity: 0.7 }} />}
                value={dateValue(dateTo)}
                onChange={(value) => setDateTo(dateInputToIso(value))}
                variant="filled"
                radius="md"
                valueFormat="DD/MM/YYYY"
                clearable
              />
            </Group>
            <Select
              placeholder="Selecciona fecha"
              leftSection={<IconCalendarStats size={16} />}
              data={sortedDesc.map((m) => ({ value: String(m.id), label: fechaLabel(m.fecha) }))}
              value={currentId}
              onChange={(val) => {
                if (!val) return;
                setCurrentId(val);
              }}
              searchable
              variant="filled"
              radius="md"
              allowDeselect={false}
              disabled={sortedDesc.length === 0}
              nothingFoundMessage="No hay registros"
            />
          </SimpleGrid>
        </Stack>
      </Paper>

      <Modal
        opened={!!modalMode && !readOnly}
        onClose={cancelForm}
        title={
          <Group gap="xs">
            {modalMode === 'new' ? (
              <IconRuler2 size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            ) : (
              <IconEdit size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            )}
            <Text fw={700}>
              {modalMode === 'new' ? 'Registrar medición' : 'Editar medición'}
            </Text>
          </Group>
        }
        size="lg"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput label="Fecha" type="date" value={form.fecha} onChange={(e) => updateFormField('fecha', e.target.value)} />
            <TextInput label="Altura (cm)" type="number" value={form.altura_cm} onChange={(e) => updateFormField('altura_cm', e.target.value)} />
            <TextInput label="Peso (kg)" type="number" value={form.peso_kg} onChange={(e) => updateFormField('peso_kg', e.target.value)} />
            <TextInput label="% Grasa" type="number" value={form.porcentaje_grasa} onChange={(e) => updateFormField('porcentaje_grasa', e.target.value)} />
            <TextInput label="Masa magra (kg)" type="number" value={form.masa_magra_kg} onChange={(e) => updateFormField('masa_magra_kg', e.target.value)} />
            <TextInput label="Σ6 pliegues (mm)" type="number" value={form.suma_6_pliegues} onChange={(e) => updateFormField('suma_6_pliegues', e.target.value)} />
          </SimpleGrid>

          <Textarea label="Notas" value={form.notas} onChange={(e) => updateFormField('notas', e.target.value)} minRows={2} />

          <Group justify="flex-end">
            <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={cancelForm} disabled={saving}>
              Cancelar
            </Button>
            <Button size="xs" radius="xl" leftSection={<IconCheck size={16} />} onClick={handleSave} loading={saving} disabled={!form.fecha}>
              Guardar medición
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        {sortedAsc.length === 0 ? (
          <Box mt="xl">
            <NothingFound
              icon={IconRuler2}
              title="Sin mediciones"
              description="Aún no se han registrado mediciones corporales para este jugador."
              actionLabel={!readOnly ? 'Añadir primera medición' : undefined}
              onAction={!readOnly ? startNew : undefined}
            />
          </Box>
        ) : selected ? (
          <Stack gap={0}>
            <SimpleGrid cols={{ base: 1, md: 1, lg: 2 }} spacing="lg" mb={{ base: 'md', sm: 'xl' }}>
              {METRICAS.map((m) => {
                const metricData = sortedAsc
                  .map((item) => {
                    const rawVal = metricValue(item, m);
                    const numVal = formatMetricNumber(rawVal);
                    return { ...item, [m.key]: numVal !== null ? numVal : rawVal };
                  })
                  .filter((d) => hasMetricValue(d[m.key]));
                const d = diff(m);
                const unit = m.unit || '';
                const reverseMetricData = [...metricData].reverse();

                return (
                  <Paper
                    key={m.key}
                    p="md"
                    radius="lg"
                    withBorder
                    bg="white"
                  >
                    <Group justify="space-between" align="flex-start" mb="xs">
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={750}>
                          {m.label}
                        </Text>
                        <Title order={2} mt={4}>
                          {formatMetricValue(metricValue(selected, m), unit)}
                        </Title>
                      </Box>
                      {d && (
                        <Badge variant="light" color={d.color} size="sm">
                          {d.val} {unit}
                        </Badge>
                      )}
                    </Group>

                    <Stack gap="md">
                      <Box h={180}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={metricData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`gradient_player_${m.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={m.color} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={m.color} stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-2)" vertical={false} />
                            <XAxis
                              dataKey="fecha"
                              tick={{ fontSize: 9 }}
                              tickFormatter={(v) => String(v).slice(5)}
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
                            <Tooltip
                              labelFormatter={(value) => fechaLabel(value)}
                              formatter={(value) => [`${value} ${unit}`, m.label]}
                              labelStyle={{ fontWeight: 700, color: 'var(--mantine-color-dark-4)', fontSize: 10 }}
                              contentStyle={{ borderRadius: '8px', border: '1px solid var(--mantine-color-gray-2)', padding: '4px 8px', fontSize: 10 }}
                            />
                            <Bar
                              dataKey={m.key}
                              radius={[4, 4, 0, 0]}
                              maxBarSize={32}
                            >
                              {metricData.map((entry, index) => {
                                const isSelected = String(entry.id) === String(selected?.id);
                                return (
                                  <Cell
                                    key={`cell-${entry.id || index}-${m.key}`}
                                    fill={isSelected ? 'var(--mantine-color-orange-5)' : `url(#gradient_player_${m.key})`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setCurrentId(String(entry.id))}
                                  />
                                );
                              })}
                            </Bar>
                            <Line
                              type="monotone"
                              dataKey={m.key}
                              stroke={m.color}
                              strokeWidth={2}
                              dot={(props) => {
                                if (!props) return null;
                                const { cx, cy, payload } = props;
                                if (cx === undefined || cy === undefined || !payload) return null;
                                const isSelected = String(payload.id) === String(selected?.id);
                                return (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={isSelected ? 6 : 3.5}
                                    fill={isSelected ? m.color : 'white'}
                                    stroke={m.color}
                                    strokeWidth={isSelected ? 0 : 2}
                                    key={`dot-${payload.id}-${m.key}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setCurrentId(String(payload.id))}
                                  />
                                );
                              }}
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
                              <Table.Th style={{ fontSize: 10, padding: '4px 8px', textAlign: 'right' }}>Valor</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {reverseMetricData.map((row) => {
                              const isSelected = String(row.id) === String(selected?.id);
                              return (
                                <Table.Tr
                                  key={row.fecha}
                                  onClick={() => setCurrentId(String(row.id))}
                                  style={{
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
                                    transition: 'background-color 0.2s ease',
                                  }}
                                >
                                  <Table.Td style={{ fontSize: 10, padding: '4px 8px', fontWeight: isSelected ? 700 : 400 }}>
                                    {row.fecha ? new Date(`${row.fecha}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '-'}
                                  </Table.Td>
                                  <Table.Td style={{ fontSize: 10, padding: '4px 8px', textAlign: 'right', fontWeight: isSelected ? 800 : 650 }}>
                                    {row[m.key]} {unit}
                                  </Table.Td>
                                </Table.Tr>
                              );
                            })}
                          </Table.Tbody>
                        </Table>
                      </ScrollArea>
                    </Stack>
                  </Paper>
                );
              })}
            </SimpleGrid>

            <BentoCard title="Detalle completo" icon={IconRuler2} color="gray">
              <Stack gap="lg">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={800} mb={6}>Origen</Text>
                    <Table variant="simple" verticalSpacing={5}>
                      <Table.Tbody>
                        {sourceRows(selected).map(([label, value]) => (
                          <Table.Tr key={label}>
                            <Table.Th style={{ width: '44%' }}>{label}</Table.Th>
                            <Table.Td>{value}</Table.Td>
                          </Table.Tr>
                        ))}
                        <Table.Tr>
                          <Table.Th>Notas</Table.Th>
                          <Table.Td>{selected.notas || '-'}</Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </Box>

                  {MEASUREMENT_DETAIL_SECTIONS.map((section) => {
                    const rows = section.fields
                      .map((field) => ({ ...field, value: metricValue(selected, field) }))
                      .filter((field) => hasMetricValue(field.value));
                    if (!rows.length) return null;

                    return (
                      <Box key={section.title}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={800} mb={6}>{section.title}</Text>
                        <Table variant="simple" verticalSpacing={5}>
                          <Table.Tbody>
                            {rows.map((field) => (
                              <Table.Tr key={field.key}>
                                <Table.Th style={{ width: '58%' }}>{field.label}</Table.Th>
                                <Table.Td ta="right" fw={650}>
                                  {formatMetricValue(field.value, field.unit)}
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Box>
                    );
                  })}
                </SimpleGrid>

                {rawMetricEntries(selected).length > 0 && (
                  <Box>
                    <Group justify="space-between" align="center" mb="xs">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Columnas Excel importadas</Text>
                      <Badge variant="light" color="gray">{rawMetricEntries(selected).length}</Badge>
                    </Group>
                    <ScrollArea h={300} offsetScrollbars>
                      <Table striped highlightOnHover verticalSpacing={5} style={{ minWidth: 620 }}>
                        <Table.Thead bg="gray.0">
                          <Table.Tr>
                            <Table.Th>Campo original</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Valor</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {rawMetricEntries(selected).map(([label, value]) => (
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
            </BentoCard>
          </Stack>
        ) : (
          <Box mt="xl">
            <NothingFound title="Error" description="No se pudo cargar el detalle seleccionado." />
          </Box>
        )}
      </Box>
    </Stack>
  );
}
