'use client';

import { useRef, useState } from 'react';
import { Dropzone } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { previewTeamOsmolarity, importTeamOsmolarity } from '@/services/hydration';
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  useMantineTheme,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconCloudUpload,
  IconDownload,
  IconRefresh,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

const CSV_TYPES = ['text/csv', 'application/vnd.ms-excel'];

function actionColor(action) {
  if (action === 'actualizar') return 'green';
  if (action === 'actualizado') return 'green';
  if (action === 'revision') return 'yellow';
  if (action === 'omitido') return 'gray';
  if (action === 'error') return 'red';
  return 'dark';
}

function actionLabel(action) {
  if (action === 'actualizar') return 'Actualizar';
  if (action === 'revision') return 'Revisión';
  if (action === 'actualizado') return 'Actualizado';
  if (action === 'omitido') return 'Omitido';
  if (action === 'error') return 'No existe';
  return action || '-';
}

function initialDecisions(players) {
  const decs = {};
  (players || []).forEach((player) => {
    if (player.accion === 'actualizar') {
      decs[player.key] = { action: 'update', jugador_id: player.jugadorId };
    } else {
      decs[player.key] = { action: 'skip' };
    }
  });
  return decs;
}

export default function TeamOsmolarityImporter({ team }) {
  const openRef = useRef(null);
  const theme = useMantineTheme();
  const router = useRouter();
  const [state, setState] = useState('idle');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [results, setResults] = useState(null);

  function reset() {
    setState('idle');
    setFile(null);
    setPreview(null);
    setDecisions({});
    setResults(null);
  }

  function downloadTemplate(e) {
    e.stopPropagation();
    try {
      const headers = ['Measurement ID', 'User ID', 'Name', 'Date', 'Time', 'Type', 'Value', 'Unit', 'Status', 'Notes', 'Questionaire'];
      const sampleRow = ['', '', 'Thierry Correia', '24 Aug 2026', '9:16 AM', 'sosm', '70', 'mOsm', 'Mildly Dehydrated', '', ''];
      const csvContent = [
        headers.join(','),
        sampleRow.join(',')
      ].join('\n');
      
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'plantilla_osmolaridad_equipo.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al generar plantilla',
        message: err.message
      });
    }
  }

  async function requestPreview(nextFile) {
    setFile(nextFile);
    setState('loading');
    setResults(null);

    try {
      const data = await previewTeamOsmolarity(nextFile, team?.id);
      setPreview(data);
      setDecisions(initialDecisions(data.jugadores));
      setState('preview');
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Error procesando CSV',
        message: error.message,
      });
      setState('error');
    }
  }

  function handleDrop(files) {
    const nextFile = files[0];
    if (!nextFile) return;
    requestPreview(nextFile);
  }

  function setDecision(playerKey, value) {
    if (!value) return;
    if (value.startsWith('update:')) {
      setDecisions((current) => ({
        ...current,
        [playerKey]: { action: 'update', jugador_id: value.replace('update:', '') },
      }));
    } else {
      setDecisions((current) => ({
        ...current,
        [playerKey]: { action: value },
      }));
    }
  }

  function decisionValue(player) {
    const decision = decisions[player.key];
    if (!decision) return 'skip';
    if (decision.action === 'update') return `update:${decision.jugador_id}`;
    return decision.action || 'skip';
  }

  function decisionOptions(player) {
    const options = [];
    if (player.accion === 'actualizar' && player.jugadorId) {
      options.push({
        value: `update:${player.jugadorId}`,
        label: `Actualizar: ${player.nombreCompleto}`,
      });
    }

    (player.candidatos || []).forEach((candidate) => {
      if (candidate.id !== player.jugadorId) {
        options.push({
          value: `update:${candidate.id}`,
          label: `Actualizar: ${candidate.nombreCompleto}`,
        });
      }
    });

    options.push({ value: 'skip', label: 'Omitir' });
    return options;
  }

  async function importFile() {
    if (!file) return;
    setState('importing');

    try {
      const data = await importTeamOsmolarity(file, team?.id, decisions);
      setResults(data);
      setState('done');
      router.refresh();
      notifications.show({
        color: 'green',
        title: 'Importación completada',
        message: `${data.resumen?.mediciones_guardadas || 0} registros guardados con éxito.`,
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Error importando datos',
        message: error.message,
      });
      setState('preview');
    }
  }

  const players = preview?.jugadores || [];
  const reviewCount = players.filter((player) => player.accion === 'revision').length;
  const errorCount = players.filter((player) => player.accion === 'error').length;
  const selectedUpdateCount = Object.values(decisions).filter((d) => d.action === 'update').length;

  return (
    <Paper radius="md" p="md" withBorder shadow="sm" bg="white">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon color="teal" variant="light" radius="md" size={40}>
              <IconUsers size={20} />
            </ThemeIcon>
            <Box>
              <Title order={4} c="dark.8">Importar CSV de Osmolaridad (Equipo)</Title>
              <Text size="xs" c="dimmed">
                Sube un archivo CSV de hidratación/osmolaridad grupal, asocia las mediciones a los jugadores del equipo y guárdalas en el historial.
              </Text>
            </Box>
          </Group>

          {state !== 'idle' && (
            <Button
              size="xs"
              radius="xl"
              variant="light"
              color="gray"
              leftSection={<IconRefresh size={14} />}
              onClick={reset}
              disabled={state === 'loading' || state === 'importing'}
            >
              Nuevo archivo
            </Button>
          )}
        </Group>

        {state === 'loading' && (
          <Paper p="xl" radius="md" bg="gray.0" withBorder style={{ borderStyle: 'dashed', textAlign: 'center' }}>
            <Stack align="center" gap="sm">
              <Loader color="teal" size="md" />
              <Text size="sm" fw={600}>Procesando archivo CSV...</Text>
              <Text size="xs" c="dimmed">Analizando nombres de jugadores y fechas de medición.</Text>
            </Stack>
          </Paper>
        )}

        {(state === 'idle' || state === 'error') && (
          <Box pos="relative">
            <Dropzone
              openRef={openRef}
              onDrop={handleDrop}
              accept={CSV_TYPES}
              maxSize={10 * 1024 ** 2}
              radius="md"
              activateOnClick={false}
              style={{
                border: '2px dashed var(--mantine-color-gray-4)',
                backgroundColor: 'var(--mantine-color-gray-0)',
                padding: '40px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ pointerEvents: 'none' }}>
                <Group justify="center">
                  <Dropzone.Accept>
                    <IconDownload size={50} color={theme.colors.blue[6]} stroke={1.5} />
                  </Dropzone.Accept>
                  <Dropzone.Reject>
                    <IconX size={50} color={theme.colors.red[6]} stroke={1.5} />
                  </Dropzone.Reject>
                  <Dropzone.Idle>
                    <IconCloudUpload size={50} stroke={1.5} color="var(--mantine-color-dimmed)" />
                  </Dropzone.Idle>
                </Group>

                <Text ta="center" fw={700} fz="lg" mt="xl">
                  <Dropzone.Accept>¡Suelta el archivo aquí!</Dropzone.Accept>
                  <Dropzone.Reject>Solo archivos CSV</Dropzone.Reject>
                  <Dropzone.Idle>Subir CSV (.csv)</Dropzone.Idle>
                </Text>

                <Text ta="center" size="sm" c="dimmed" mt={7}>
                  Arrastra y suelta el archivo o haz clic para seleccionarlo.
                </Text>
              </div>

              <Group justify="center" mt="md" gap="sm">
                <Button
                  size="xs"
                  radius="xl"
                  style={{ pointerEvents: 'all' }}
                  onClick={() => openRef.current?.()}
                  variant="light"
                >
                  Seleccionar archivo
                </Button>
                <Button
                  size="xs"
                  radius="xl"
                  style={{ pointerEvents: 'all' }}
                  onClick={downloadTemplate}
                  variant="outline"
                  color="teal"
                  leftSection={<IconDownload size={14} />}
                >
                  Descargar plantilla
                </Button>
              </Group>
            </Dropzone>
          </Box>
        )}

        {state === 'preview' && preview && (
          <Stack gap="md">
            <Group gap="xs" wrap="wrap">
              <Badge color="blue" variant="light">{preview.resumen.players} jugadores en el archivo</Badge>
              <Badge color="teal" variant="light">{preview.resumen.measurements} mediciones totales</Badge>
              {preview.resumen.skippedRows > 0 && (
                <Badge color="red" variant="light">{preview.resumen.skippedRows} filas omitidas por errores</Badge>
              )}
            </Group>

            {errorCount > 0 && (
              <Alert color="red" variant="light" icon={<IconAlertTriangle size={18} />}>
                Hay {errorCount} jugador{errorCount === 1 ? '' : 'es'} en el archivo que no existe{errorCount === 1 ? '' : 'n'} en el equipo y no tiene{errorCount === 1 ? '' : 'n'} coincidencias parciales. Estas filas se omitirán de forma obligatoria.
              </Alert>
            )}

            {reviewCount > 0 && (
              <Alert color="yellow" variant="light" icon={<IconAlertTriangle size={18} />}>
                Hay {reviewCount} jugador{reviewCount === 1 ? '' : 'es'} con coincidencias parciales. Asegúrate de asociar el jugador correcto o selecciona &quot;Omitir&quot; si no deseas guardar sus mediciones.
              </Alert>
            )}

            <ScrollArea h={400}>
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Jugador (Archivo)</Table.Th>
                    <Table.Th>Mediciones</Table.Th>
                    <Table.Th>Última Fecha</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ width: 320 }}>Acción / Mapeo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {players.map((player) => (
                    <Table.Tr key={player.key}>
                      <Table.Td fw={600}>{player.nombreCompleto}</Table.Td>
                      <Table.Td>{player.medicionesCount}</Table.Td>
                      <Table.Td>{player.ultimaFecha || '-'}</Table.Td>
                      <Table.Td>
                        <Badge color={actionColor(player.accion)} variant="light">
                          {actionLabel(player.accion)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {player.accion === 'error' ? (
                          <Select
                            size="xs"
                            radius="md"
                            data={[{ value: 'skip', label: 'Omitir (No existe)' }]}
                            value="skip"
                            disabled
                          />
                        ) : (
                          <Select
                            size="xs"
                            radius="md"
                            data={decisionOptions(player)}
                            value={decisionValue(player)}
                            onChange={(val) => setDecision(player.key, val)}
                            allowDeselect={false}
                          />
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Group justify="space-between" align="center" wrap="wrap">
              <Text size="xs" c="dimmed">
                Se importarán las mediciones de {selectedUpdateCount} jugadores.
              </Text>
              <Button
                size="xs"
                radius="xl"
                color="teal"
                leftSection={<IconCheck size={15} />}
                onClick={importFile}
                disabled={selectedUpdateCount === 0}
              >
                Confirmar e importar
              </Button>
            </Group>
          </Stack>
        )}

        {state === 'importing' && (
          <Paper p="xl" radius="md" bg="gray.0" withBorder style={{ borderStyle: 'dashed', textAlign: 'center' }}>
            <Stack align="center" gap="sm">
              <Loader color="blue" size="md" />
              <Text size="sm" fw={600}>Guardando datos de osmolaridad...</Text>
              <Text size="xs" c="dimmed">Actualizando el historial detallado de hidratación.</Text>
            </Stack>
          </Paper>
        )}

        {state === 'done' && results && (
          <Stack gap="md">
            <Group gap="xs" wrap="wrap">
              <Badge color="green" variant="light">{results.resumen.mediciones_guardadas} mediciones guardadas</Badge>
              {results.resumen.mediciones_omitidas > 0 && (
                <Badge color="gray" variant="light">{results.resumen.mediciones_omitidas} mediciones omitidas</Badge>
              )}
            </Group>

            <ScrollArea h={400}>
              <Table highlightOnHover verticalSpacing="xs">
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Jugador</Table.Th>
                    <Table.Th>Mediciones Procesadas</Table.Th>
                    <Table.Th>Estado de Carga</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {results.resultados.map((result) => (
                    <Table.Tr key={result.key}>
                      <Table.Td fw={600}>{result.nombre}</Table.Td>
                      <Table.Td>{result.mediciones_procesadas}</Table.Td>
                      <Table.Td>
                        <Badge color={actionColor(result.accion)} variant="light">
                          {result.status}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
