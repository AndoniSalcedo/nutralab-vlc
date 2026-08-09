'use client';

import { useMemo, useState } from 'react';
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
  Box,
  Button,
  Grid,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Title,
  ScrollArea,
  Modal,
  NumberInput,
} from '@mantine/core';
import SubtabHeader from '../SubtabHeader';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { savePesaje, deletePesaje } from '@/services/pesaje';
import { IconEdit, IconPlus, IconScale, IconTrash } from '@tabler/icons-react';
import NothingFound from '@/components/NothingFound';
import ConfirmModal from '@/components/modals/ConfirmModal';

function fechaLabel(fecha) {
  if (!fecha) return 'Sin fecha';
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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

export default function PesosSubtab({ jugador, pesajes: pesajesIniciales = [], readOnly = false }) {
  const jugadorId = jugador.id;
  const [pesajes, setPesajes] = useState(pesajesIniciales || []);
  const [currentId, setCurrentId] = useState(pesajesIniciales.length ? String(pesajesIniciales[pesajesIniciales.length - 1].id) : null);
  
  const [modalOpened, setModalOpened] = useState(false);
  const [form, setForm] = useState({ id: null, fecha: new Date(), peso_kg: '' });
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const sortedAsc = useMemo(
    () => [...pesajes].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))),
    [pesajes]
  );
  const reverseMetricData = [...sortedAsc].reverse();
  const selected = sortedAsc.find((e) => String(e.id) === String(currentId)) || sortedAsc[sortedAsc.length - 1] || null;

  function startNew() {
    setForm({ id: null, fecha: new Date(), peso_kg: '' });
    setModalOpened(true);
  }

  function startEdit(item) {
    setForm({ 
      id: item.id, 
      fecha: new Date(`${item.fecha}T00:00:00`), 
      peso_kg: item.peso_kg 
    });
    setModalOpened(true);
  }

  async function handleSave() {
    if (readOnly) return;
    setSaving(true);
    try {
      const payload = {
        jugador_id: jugadorId,
        id: form.id,
        fecha: dateInputToIso(form.fecha),
        peso_kg: form.peso_kg,
      };

      const data = await savePesaje(payload);

      setPesajes((prev) => {
        const filtered = prev.filter((e) => e.id !== data.pesaje.id && e.fecha !== data.pesaje.fecha);
        return [...filtered, data.pesaje];
      });
      setCurrentId(String(data.pesaje.id));
      setModalOpened(false);
      notifications.show({
        color: 'green',
        title: 'Peso guardado',
        message: 'El registro de peso se ha guardado correctamente.',
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo guardar el peso',
        message: e.message,
      });
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(item) {
    if (readOnly) return;
    setCurrentId(String(item.id));
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (readOnly || !selected) return;
    setDeleting(true);
    try {
      await deletePesaje(selected.id);

      const remaining = pesajes.filter((e) => String(e.id) !== String(selected.id));
      setPesajes(remaining);

      if (remaining.length > 0) {
        const nextSorted = [...remaining].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
        const nextSelected = nextSorted[nextSorted.length - 1];
        setCurrentId(nextSelected?.id ? String(nextSelected.id) : null);
      } else {
        setCurrentId(null);
      }

      notifications.show({
        color: 'green',
        title: 'Registro borrado',
        message: 'El peso se ha eliminado correctamente.',
      });
      setDeleteConfirmOpen(false);
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo borrar el registro',
        message: e.message,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Stack gap="md">
      <Paper p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder>
        <Group justify="space-between" align="center">
          <SubtabHeader tab="metricas" subtab="pesos" title="Evolución de Peso" />
          {!readOnly && (
            <Button size="xs" radius="xl" leftSection={<IconPlus size={14} />} onClick={startNew}>
              Añadir Peso
            </Button>
          )}
        </Group>
      </Paper>

      {sortedAsc.length === 0 ? (
        <NothingFound
          icon={IconScale}
          title="Sin registros de peso"
          description="Aún no hay registros de peso para este jugador."
          actionLabel={!readOnly ? 'Añadir primer peso' : undefined}
          onAction={!readOnly ? startNew : undefined}
        />
      ) : (
        <Grid gutter="lg">
          <Grid.Col span={12}>
            <Paper p="md" radius="lg" withBorder bg="white">
              <Group justify="space-between" align="flex-start" mb="xs">
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={750}>Peso Corporal</Text>
                  <Title order={2} mt={4}>
                    {selected ? `${selected.peso_kg} kg` : '-'}
                  </Title>
                </Box>
              </Group>

              <Stack gap="md">
                <Box h={250}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sortedAsc} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradient_peso" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59f00" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59f00" stopOpacity={0.05} />
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
                        domain={['dataMin - 5', 'auto']}
                        tick={{ fontSize: 9 }}
                        stroke="var(--mantine-color-gray-5)"
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        labelFormatter={(value) => fechaLabel(value)}
                        formatter={(value) => [`${value} kg`, 'Peso']}
                        labelStyle={{ fontWeight: 700, color: 'var(--mantine-color-dark-4)', fontSize: 10 }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--mantine-color-gray-2)', padding: '4px 8px', fontSize: 10 }}
                      />
                      <Bar dataKey="peso_kg" radius={[4, 4, 0, 0]} maxBarSize={32}>
                        {sortedAsc.map((entry) => {
                          const isSelected = String(entry.id) === String(selected?.id);
                          return (
                            <Cell
                              key={`cell-${entry.id}`}
                              fill={isSelected ? 'var(--mantine-color-orange-5)' : 'url(#gradient_peso)'}
                              style={{ cursor: 'pointer' }}
                              onClick={() => setCurrentId(String(entry.id))}
                            />
                          );
                        })}
                      </Bar>
                      <Line
                        type="monotone"
                        dataKey="peso_kg"
                        stroke="#f59f00"
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
                              fill={isSelected ? '#f59f00' : 'white'}
                              stroke="#f59f00"
                              strokeWidth={isSelected ? 0 : 2}
                              key={`dot-${payload.id}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => setCurrentId(String(payload.id))}
                            />
                          );
                        }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>

                <ScrollArea h={200} offsetScrollbars>
                  <Table verticalSpacing={8} striped highlightOnHover>
                    <Table.Thead bg="gray.0">
                      <Table.Tr>
                        <Table.Th>Fecha</Table.Th>
                        <Table.Th ta="right">Peso (kg)</Table.Th>
                        {!readOnly && <Table.Th w={80} ta="right">Acciones</Table.Th>}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {reverseMetricData.map((row) => {
                        const isSelected = String(row.id) === String(selected?.id);
                        return (
                          <Table.Tr
                            key={row.id}
                            onClick={() => setCurrentId(String(row.id))}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: isSelected ? 'var(--mantine-color-orange-0)' : undefined,
                            }}
                          >
                            <Table.Td fw={isSelected ? 700 : 400}>
                              {row.fecha ? fechaLabel(row.fecha) : '-'}
                            </Table.Td>
                            <Table.Td ta="right" fw={isSelected ? 800 : 650}>
                              {row.peso_kg} kg
                            </Table.Td>
                            {!readOnly && (
                              <Table.Td ta="right">
                                <Group gap={4} justify="flex-end">
                                  <Button size="compact-xs" variant="subtle" color="gray" onClick={(e) => { e.stopPropagation(); startEdit(row); }}>
                                    <IconEdit size={14} />
                                  </Button>
                                  <Button size="compact-xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); handleDelete(row); }}>
                                    <IconTrash size={14} />
                                  </Button>
                                </Group>
                              </Table.Td>
                            )}
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      )}

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={<Text fw={700}>{form.id ? 'Editar peso' : 'Nuevo registro de peso'}</Text>} centered radius="lg">
        <Stack gap="md">
          <DateInput
            label="Fecha"
            required
            value={form.fecha}
            onChange={(val) => setForm({ ...form, fecha: val })}
            valueFormat="DD/MM/YYYY"
          />
          <NumberInput
            label="Peso (kg)"
            required
            value={form.peso_kg}
            onChange={(val) => setForm({ ...form, peso_kg: val })}
            min={0}
            step={0.1}
            decimalScale={1}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setModalOpened(false)}>Cancelar</Button>
            <Button color="orange" onClick={handleSave} loading={saving}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>

      <ConfirmModal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar peso"
        message={selected ? `¿Seguro que quieres borrar el registro de peso del ${fechaLabel(selected.fecha)}?` : ''}
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </Stack>
  );
}
