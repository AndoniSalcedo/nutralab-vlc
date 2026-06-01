'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Group,
  Modal,
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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconFileAnalytics,
  IconFileText,
  IconPlus,
  IconReportMedical,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { BentoCard } from '@/components/Bento/BentoItem';
import NothingFound from '@/components/NothingFound/NothingFound';

function fechaLabel(fecha) {
  if (!fecha) return 'Sin fecha';
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function parameterStatus(p) {
  const value = Number(p.valor);
  const hasMin = p.rango_min !== null && p.rango_min !== undefined && p.rango_min !== '';
  const hasMax = p.rango_max !== null && p.rango_max !== undefined && p.rango_max !== '';
  const min = hasMin ? Number(p.rango_min) : null;
  const max = hasMax ? Number(p.rango_max) : null;

  if (!p.fuera_rango) return { color: 'green', label: 'Normal' };
  if (Number.isFinite(max) && value > max) return { color: 'red', label: 'Alto' };
  if (Number.isFinite(min) && value < min) return { color: 'orange', label: 'Bajo' };
  return { color: 'yellow', label: 'Revisar' };
}

function rangeLabel(p) {
  const hasMin = p.rango_min !== null && p.rango_min !== undefined && p.rango_min !== '';
  const hasMax = p.rango_max !== null && p.rango_max !== undefined && p.rango_max !== '';
  if (!hasMin && !hasMax) return 'Sin rango';
  if (hasMin && hasMax) return `${p.rango_min} - ${p.rango_max} ${p.unidad || ''}`.trim();
  if (hasMin) return `> ${p.rango_min} ${p.unidad || ''}`.trim();
  return `< ${p.rango_max} ${p.unidad || ''}`.trim();
}

function ParameterRow({ parametro, grupo }) {
  const status = parameterStatus(parametro);

  return (
    <Table.Tr>
      <Table.Td>
        <Stack gap={2}>
          <Text size="sm" fw={650} c="dark.4">{parametro.nombre}</Text>
          <Badge visibleFrom="sm" variant="light" color="gray" size="xs" w="fit-content">{grupo}</Badge>
        </Stack>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={800} c={status.color}>
          {parametro.valor} <Text span size="xs" fw={500} c="dimmed">{parametro.unidad}</Text>
        </Text>
      </Table.Td>
      <Table.Td visibleFrom="xs">
        <Text size="xs" c="dimmed">{rangeLabel(parametro)}</Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color={status.color} size="sm">{status.label}</Badge>
      </Table.Td>
    </Table.Tr>
  );
}

const GRUPOS = {
  Hemograma: ['San-Leucocitos', 'San-Hematies', 'San-Hemoglobina', 'San-Hematocrito', 'San-Volumen Corp', 'San-Hb. Corpuscular', 'San-Plaquetas', 'San-Volumen plaquetar'],
  'Fórmula leucocitaria': ['Lks-Segmentados', 'Lks-Basofilos', 'Lks-Eosinofilos', 'Lks-Linfocitos', 'Lks-Monocitos'],
  Bioquímica: ['Glu', 'Cre', 'Uri', 'Col', 'Tri', 'HDL', 'LDL', 'Got', 'Gpt', 'Ggt', 'Fer', 'Iron', 'Transf', 'Vit'],
  Otros: [],
};

function agrupar(params = []) {
  const grupos = { Hemograma: [], 'Fórmula leucocitaria': [], Bioquímica: [], Otros: [] };
  params.forEach((p) => {
    let asignado = false;
    for (const [grupo, prefijos] of Object.entries(GRUPOS)) {
      if (prefijos.some((pre) => p.nombre.includes(pre))) {
        grupos[grupo].push(p);
        asignado = true;
        break;
      }
    }
    if (!asignado) grupos.Otros.push(p);
  });
  return grupos;
}

export default function AnaliticasSubtab({ jugador, analiticas: analiticasIniciales = [], readOnly = false }) {
  const jugadorId = jugador.id;
  const [analiticas, setAnaliticas] = useState(analiticasIniciales || []);
  const [currentId, setCurrentId] = useState(analiticasIniciales?.[0]?.id ? String(analiticasIniciales[0].id) : null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fecha, setFecha] = useState('');
  const fileRef = useRef(null);

  const sorted = useMemo(
    () => [...analiticas].sort((a, b) => String(b.fecha_extraccion || '').localeCompare(String(a.fecha_extraccion || ''))),
    [analiticas]
  );
  const selected = sorted.find((a) => String(a.id) === String(currentId)) || sorted[0] || null;
  const parametros = selected?.parametros || [];
  const grupos = selected ? agrupar(parametros) : {};
  const fueraRango = parametros.filter((p) => p.fuera_rango);
  const tableRows = Object.entries(grupos).flatMap(([grupo, params]) => params.map((parametro) => ({ grupo, parametro })));

  function startUpload() {
    setUploadOpen(true);
    setFecha('');
  }

  function cancelUpload() {
    setUploadOpen(false);
  }

  async function handleUpload(e) {
    if (readOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const notificationId = 'analitica-upload';
    setUploading(true);
    notifications.show({
      id: notificationId,
      color: 'blue',
      title: 'Procesando analítica',
      message: 'Extrayendo parámetros con IA. Puede tardar unos segundos.',
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('jugador_id', String(jugadorId));
      fd.append('fecha_extraccion', fecha);
      const res = await fetch('/api/upload-analitica', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir analítica');
      setAnaliticas((prev) => [data.analitica, ...prev]);
      setCurrentId(String(data.analitica.id));
      setUploadOpen(false);
      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'Analítica subida',
        message: 'La analítica se ha procesado correctamente.',
        loading: false,
        autoClose: 4000,
        withCloseButton: true,
      });
    } catch (e) {
      notifications.update({
        id: notificationId,
        color: 'red',
        title: 'No se pudo subir la analítica',
        message: e.message,
        loading: false,
        autoClose: 6000,
        withCloseButton: true,
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete() {
    if (readOnly || !selected) return;
    const confirmed = window.confirm(`¿Seguro que quieres borrar la analítica "${selected.pdf_nombre || fechaLabel(selected.fecha_extraccion)}"?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/upload-analitica?id=${selected.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al borrar analítica');

      const remaining = analiticas.filter((a) => String(a.id) !== String(selected.id));
      setAnaliticas(remaining);
      const nextSelected = [...remaining].sort((a, b) => String(b.fecha_extraccion || '').localeCompare(String(a.fecha_extraccion || '')))[0];
      setCurrentId(nextSelected?.id ? String(nextSelected.id) : null);

      notifications.show({
        color: 'green',
        title: 'Analítica borrada',
        message: 'La analítica se ha eliminado correctamente.',
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo borrar la analítica',
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
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Group gap="xs">
              <ThemeIcon color="blue" variant="light" radius="xl" size="lg">
                <IconReportMedical size={20} />
              </ThemeIcon>
              <Stack gap={2}>
                <Title order={3} fw={800} c="dark.4">Analíticas</Title>
                <Text size="sm" c="dimmed">
                  Documentos clínicos destacados.
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
                  disabled={!selected}
                  loading={deleting}
                >
                  Borrar
                </Button>
                <Button size="xs" radius="xl" leftSection={<IconPlus size={14} />} onClick={startUpload}>
                  Añadir PDF
                </Button>
              </Group>
            )}
          </Group>

          <Select
            placeholder="Selecciona documento"
            data={sorted.map((a) => ({
              value: String(a.id),
              label: `${fechaLabel(a.fecha_extraccion)} · ${a.pdf_nombre || 'Analítica'}`,
            }))}
            value={currentId}
            onChange={(val) => {
              if (!val) return;
              setCurrentId(val);
            }}
            allowDeselect={false}
            searchable
            variant="filled"
            radius="md"
            disabled={sorted.length === 0}
            leftSection={<IconFileAnalytics size={16} />}
          />
        </Stack>
      </Paper>

      <Modal
        opened={uploadOpen && !readOnly}
        onClose={cancelUpload}
        title="Subir analítica"
        size="lg"
      >
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Fecha extracción"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            <Button mt={{ base: 0, sm: 25 }} radius="xl" leftSection={<IconUpload size={16} />} onClick={() => fileRef.current?.click()} loading={uploading}>
              Subir PDF
            </Button>
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
          </SimpleGrid>
        </Stack>
      </Modal>

      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        {sorted.length === 0 ? (
          <Box mt="xl">
            <NothingFound
              icon={IconReportMedical}
              title="Sin analíticas"
              description="No hay analíticas subidas para este jugador."
              actionLabel={!readOnly ? 'Añadir primera analítica' : undefined}
              onAction={!readOnly ? startUpload : undefined}
            />
          </Box>
        ) : selected ? (
          <Stack gap={0}>
            {fueraRango.length > 0 && (
              <BentoCard title="Parámetros a revisar" icon={IconAlertTriangle} color="red" mb={{ base: 'md', sm: 'lg' }}>
                <ScrollArea>
                  <Table verticalSpacing="xs" highlightOnHover>
                    <Table.Tbody>
                      {fueraRango.map((parametro, index) => {
                        const status = parameterStatus(parametro);
                        return (
                          <Table.Tr key={`review-${parametro.nombre}-${index}`}>
                            <Table.Td>
                              <Text size="sm" fw={700}>{parametro.nombre}</Text>
                              <Text size="xs" c="dimmed">{rangeLabel(parametro)}</Text>
                            </Table.Td>
                            <Table.Td ta="right">
                              <Text size="sm" fw={800} c={status.color}>
                                {parametro.valor} <Text span size="xs" fw={500} c="dimmed">{parametro.unidad}</Text>
                              </Text>
                            </Table.Td>
                            <Table.Td ta="right">
                              <Badge variant="light" color={status.color} size="sm">{status.label}</Badge>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </BentoCard>
            )}

            <BentoCard title="Parámetros extraídos" icon={IconFileText} color="blue">
              <ScrollArea>
                <Table striped highlightOnHover verticalSpacing="xs" style={{ minWidth: 640 }}>
                  <Table.Thead bg="gray.0">
                    <Table.Tr>
                      <Table.Th>Parámetro</Table.Th>
                      <Table.Th>Valor</Table.Th>
                      <Table.Th visibleFrom="xs">Rango</Table.Th>
                      <Table.Th>Estado</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {tableRows.map(({ grupo, parametro }, index) => (
                      <ParameterRow key={`${grupo}-${parametro.nombre}-${index}`} grupo={grupo} parametro={parametro} />
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
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
