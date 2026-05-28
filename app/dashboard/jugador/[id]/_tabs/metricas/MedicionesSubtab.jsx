'use client';

import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
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
  Grid,
  ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCalendarStats, IconChartLine, IconCheck, IconEdit, IconPlus, IconRuler2 } from '@tabler/icons-react';
import { BentoCard } from '@/components/Bento/BentoItem';
import NothingFound from '@/components/NothingFound/NothingFound';

const METRICAS = [
  { key: 'peso_kg', label: 'Peso (kg)', color: '#3b82f6' },
  { key: 'porcentaje_grasa', label: '% Grasa', color: '#ef4444' },
  { key: 'masa_magra_kg', label: 'Masa magra (kg)', color: '#22c55e' },
  { key: 'suma_6_pliegues', label: 'Suma 6 pliegues (mm)', color: '#f59e0b' },
];

function emptyForm() {
  return {
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

export default function MedicionesSubtab({ jugador, evoluciones: evolucionesIniciales = [], readOnly = false }) {
  const jugadorId = jugador.id;
  const [evoluciones, setEvoluciones] = useState(evolucionesIniciales || []);
  const [currentId, setCurrentId] = useState(evolucionesIniciales.length ? String(evolucionesIniciales[evolucionesIniciales.length - 1].id) : null);
  const [modalMode, setModalMode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const sortedAsc = useMemo(
    () => [...evoluciones].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))),
    [evoluciones]
  );
  const sortedDesc = useMemo(() => [...sortedAsc].reverse(), [sortedAsc]);
  const selected = sortedAsc.find((e) => String(e.id) === String(currentId)) || sortedAsc[sortedAsc.length - 1] || null;
  const first = sortedAsc[0];
  const last = sortedAsc[sortedAsc.length - 1];

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

  function diff(key) {
    if (!first || !last || first === last) return null;
    const d = Number(last[key]) - Number(first[key]);
    return {
      val: d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1),
      color: d > 0 ? (key === 'masa_magra_kg' ? 'green' : 'red') : (key === 'masa_magra_kg' ? 'red' : 'green'),
    };
  }

  async function handleSave() {
    if (readOnly) return;
    setSaving(true);
    try {
      const res = await fetch('/api/evoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jugador_id: jugadorId,
          ...form,
          altura_cm: form.altura_cm ? Number(form.altura_cm) : null,
          peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
          porcentaje_grasa: form.porcentaje_grasa ? Number(form.porcentaje_grasa) : null,
          masa_magra_kg: form.masa_magra_kg ? Number(form.masa_magra_kg) : null,
          suma_6_pliegues: form.suma_6_pliegues ? Number(form.suma_6_pliegues) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar medición');

      setEvoluciones((prev) => {
        const filtered = prev.filter((e) => e.id !== data.evolucion.id && e.fecha !== data.evolucion.fecha);
        return [...filtered, data.evolucion];
      });
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
                <Button size="xs" variant="light" color="dark" radius="xl" leftSection={<IconEdit size={14} />} disabled={!selected} onClick={startEdit}>
                  Editar actual
                </Button>
                <Button size="xs" radius="xl" leftSection={<IconPlus size={14} />} onClick={startNew}>
                  Añadir
                </Button>
              </Group>
            )}
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
        </Stack>
      </Paper>

      <Modal
        opened={!!modalMode && !readOnly}
        onClose={cancelForm}
        title={modalMode === 'new' ? 'Registrar medición' : 'Editar medición'}
        size="lg"
      >
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
            <TextInput label="Altura (cm)" type="number" value={form.altura_cm} onChange={(e) => setForm((f) => ({ ...f, altura_cm: e.target.value }))} />
            <TextInput label="Peso (kg)" type="number" value={form.peso_kg} onChange={(e) => setForm((f) => ({ ...f, peso_kg: e.target.value }))} />
            <TextInput label="% Grasa" type="number" value={form.porcentaje_grasa} onChange={(e) => setForm((f) => ({ ...f, porcentaje_grasa: e.target.value }))} />
            <TextInput label="Masa magra (kg)" type="number" value={form.masa_magra_kg} onChange={(e) => setForm((f) => ({ ...f, masa_magra_kg: e.target.value }))} />
            <TextInput label="Σ6 pliegues (mm)" type="number" value={form.suma_6_pliegues} onChange={(e) => setForm((f) => ({ ...f, suma_6_pliegues: e.target.value }))} />
          </SimpleGrid>

          <Textarea label="Notas" value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} minRows={2} />

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
                const metricData = sortedAsc.filter((d) => d[m.key] !== null && d[m.key] !== undefined);
                const d = diff(m.key);
                const unit = m.key === 'peso_kg' || m.key === 'masa_magra_kg' ? 'kg' : m.key === 'porcentaje_grasa' ? '%' : 'mm';
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
                          {selected?.[m.key] ?? '-'} <Text span size="sm" fw={500} c="dimmed">{unit}</Text>
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
                                <stop offset="5%" stopColor={m.color} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={m.color} stopOpacity={0.05}/>
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
                              fill={`url(#gradient_player_${m.key})`}
                              radius={[4, 4, 0, 0]}
                              maxBarSize={32}
                            />
                            <Line
                              type="monotone"
                              dataKey={m.key}
                              stroke={m.color}
                              strokeWidth={2}
                              dot={{ r: 3.5, fill: 'white', stroke: m.color, strokeWidth: 2 }}
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
                            {reverseMetricData.map((row) => (
                              <Table.Tr key={row.fecha}>
                                <Table.Td style={{ fontSize: 10, padding: '4px 8px' }}>
                                  {row.fecha ? new Date(`${row.fecha}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '-'}
                                </Table.Td>
                                <Table.Td style={{ fontSize: 10, padding: '4px 8px', textAlign: 'right', fontWeight: 650 }}>
                                  {row[m.key]} {unit}
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

            <BentoCard title="Detalle de mediciones" icon={IconRuler2} color="gray">
              <Box style={{ overflowX: 'auto' }}>
                <Table variant="simple" verticalSpacing="sm">
                  <Table.Tbody>
                    <Table.Tr><Table.Th>Fecha</Table.Th><Table.Td>{fechaLabel(selected.fecha)}</Table.Td></Table.Tr>
                    <Table.Tr><Table.Th>Altura</Table.Th><Table.Td>{selected.altura_cm ?? '-'} cm</Table.Td></Table.Tr>
                    <Table.Tr><Table.Th>Peso</Table.Th><Table.Td>{selected.peso_kg ?? '-'} kg</Table.Td></Table.Tr>
                    <Table.Tr><Table.Th>% Grasa</Table.Th><Table.Td>{selected.porcentaje_grasa ?? '-'} %</Table.Td></Table.Tr>
                    <Table.Tr><Table.Th>Masa magra</Table.Th><Table.Td>{selected.masa_magra_kg ?? '-'} kg</Table.Td></Table.Tr>
                    <Table.Tr><Table.Th>Σ6 pliegues</Table.Th><Table.Td>{selected.suma_6_pliegues ?? '-'} mm</Table.Td></Table.Tr>
                    <Table.Tr><Table.Th>Notas</Table.Th><Table.Td>{selected.notas || '-'}</Table.Td></Table.Tr>
                  </Table.Tbody>
                </Table>
              </Box>
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
