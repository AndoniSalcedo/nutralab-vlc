'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  Collapse,
  ActionIcon,
} from '@mantine/core';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';
import { uploadAnalitica, deleteAnalitica, toggleAnaliticaVisibility } from '@/services/analytic';
import {
  IconAlertTriangle,
  IconFileAnalytics,
  IconFileText,
  IconPlus,
  IconReportMedical,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconChevronDown,
} from '@tabler/icons-react';
import { BentoCard } from '@/components/BentoItem';
import NothingFound from '@/components/NothingFound';
import ConfirmModal from '@/components/modals/ConfirmModal';
import UploadAnaliticaModal from '@/components/modals/UploadAnaliticaModal';

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
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [expanded, { toggle: toggleExpanded }] = useDisclosure(false);
  const jugadorId = jugador.id;
  const [analiticas, setAnaliticas] = useState(analiticasIniciales || []);
  const [currentId, setCurrentId] = useState(analiticasIniciales?.[0]?.id ? String(analiticasIniciales[0].id) : null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fecha, setFecha] = useState(null);

  const sorted = useMemo(
    () => [...analiticas].sort((a, b) => String(b.fecha_extraccion || '').localeCompare(String(a.fecha_extraccion || ''))),
    [analiticas]
  );
  const selected = sorted.find((a) => String(a.id) === String(currentId)) || sorted[0] || null;
  const parametros = selected?.parametros || [];
  const grupos = selected ? agrupar(parametros) : {};
  const fueraRango = parametros.filter((p) => p.fuera_rango);
  const tableRows = Object.entries(grupos).flatMap(([grupo, params]) => params.map((parametro) => ({ grupo, parametro })));

  const [toggling, setToggling] = useState(false);

  async function handleToggleVisibility() {
    if (readOnly || !selected) return;
    const isVisible = !selected.visible_para_jugador;
    setToggling(true);
    try {
      await toggleAnaliticaVisibility(selected.id, isVisible);
      setAnaliticas((prev) =>
        prev.map((a) => (String(a.id) === String(selected.id) ? { ...a, visible_para_jugador: isVisible } : a))
      );
      notifications.show({
        color: 'green',
        title: 'Visibilidad actualizada',
        message: isVisible ? 'El jugador ahora puede ver esta analítica.' : 'La analítica se ha ocultado para el jugador.',
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error al cambiar visibilidad',
        message: e.message,
      });
    } finally {
      setToggling(false);
    }
  }

  function startUpload() {
    setUploadOpen(true);
    setFecha(null);
  }

  function cancelUpload() {
    setUploadOpen(false);
  }

  async function handleUpload(files) {
    if (readOnly) return;
    const file = files?.[0];
    if (!file) return;
    const notificationId = 'analitica-upload';
    const fechaString = fecha ? dayjs(fecha).format('YYYY-MM-DD') : '';
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
      const data = await uploadAnalitica(file, jugadorId, fechaString);
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
    }
  }

  function handleDelete() {
    if (readOnly || !selected) return;
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (readOnly || !selected) return;
    setDeleting(true);
    try {
      await deleteAnalitica(selected.id);

      const remaining = analiticas.filter((a) => String(a.id) !== String(selected.id));
      setAnaliticas(remaining);
      const nextSelected = [...remaining].sort((a, b) => String(b.fecha_extraccion || '').localeCompare(String(a.fecha_extraccion || '')))[0];
      setCurrentId(nextSelected?.id ? String(nextSelected.id) : null);

      notifications.show({
        color: 'green',
        title: 'Analítica borrada',
        message: 'La analítica se ha eliminado correctamente.',
      });
      setDeleteConfirmOpen(false);
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
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Group gap="xs" style={{ flex: 1 }}>
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

            {!readOnly && !isMobile && (
              <Group gap="xs">
                {selected && (
                  <Tooltip label={selected.visible_para_jugador ? 'Ocultar al jugador' : 'Hacer visible al jugador'} withArrow position="top">
                    <Button
                      size="xs"
                      variant={selected.visible_para_jugador ? 'light' : 'default'}
                      color={selected.visible_para_jugador ? 'green' : 'gray'}
                      radius="xl"
                      leftSection={selected.visible_para_jugador ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                      onClick={handleToggleVisibility}
                      loading={toggling}
                    >
                      {selected.visible_para_jugador ? 'Visible' : 'Oculto'}
                    </Button>
                  </Tooltip>
                )}
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
                  Añadir
                </Button>
              </Group>
            )}

            {isMobile && (
              <ActionIcon variant="light" color="gray" onClick={toggleExpanded} size="lg" radius="md">
                <IconChevronDown size={20} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '200ms' }} />
              </ActionIcon>
            )}
          </Group>

          <Collapse in={!isMobile || expanded}>
            <Stack gap="sm">
              {!readOnly && isMobile && (
                <Group gap="xs" justify="center" style={{ flexDirection: 'column' }}>
                  {selected && (
                    <Button
                      size="xs"
                      variant={selected.visible_para_jugador ? 'light' : 'default'}
                      color={selected.visible_para_jugador ? 'green' : 'gray'}
                      radius="xl"
                      leftSection={selected.visible_para_jugador ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                      onClick={handleToggleVisibility}
                      loading={toggling}
                      fullWidth
                    >
                      {selected.visible_para_jugador ? 'Visible' : 'Oculto'}
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    radius="xl"
                    leftSection={<IconTrash size={14} />}
                    onClick={handleDelete}
                    disabled={!selected}
                    loading={deleting}
                    fullWidth
                  >
                    Borrar
                  </Button>
                  <Button size="xs" radius="xl" leftSection={<IconPlus size={14} />} onClick={startUpload} fullWidth>
                    Añadir
                  </Button>
                </Group>
              )}

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
          </Collapse>
        </Stack>
      </Paper>

      <UploadAnaliticaModal
        opened={uploadOpen && !readOnly}
        onClose={cancelUpload}
        fecha={fecha}
        setFecha={setFecha}
        handleUpload={handleUpload}
        uploading={uploading}
      />

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
      <ConfirmModal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar analítica"
        message={selected ? `¿Seguro que quieres borrar la analítica "${selected.pdf_nombre || fechaLabel(selected.fecha_extraccion)}"?` : ''}
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </Stack>
  );
}
