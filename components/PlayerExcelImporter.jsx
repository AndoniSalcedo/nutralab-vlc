'use client';

import { useEffect, useRef, useState } from 'react';
import { Dropzone } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { importPlayerExcel } from '@/services/player';
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Progress,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  useMantineTheme,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconCloudUpload,
  IconDatabaseImport,
  IconDownload,
  IconFileSpreadsheet,
  IconRefresh,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

const EXCEL_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

function actionColor(action) {
  if (action === 'actualizar') return 'green';
  if (action === 'crear') return 'blue';
  if (action === 'revision') return 'yellow';
  if (action === 'omitido') return 'gray';
  if (action === 'error') return 'red';
  return 'dark';
}

function actionLabel(action) {
  if (action === 'actualizar') return 'Actualizar';
  if (action === 'crear') return 'Crear';
  if (action === 'revision') return 'Revisión';
  if (action === 'creado') return 'Creado';
  if (action === 'actualizado') return 'Actualizado';
  if (action === 'omitido') return 'Omitido';
  if (action === 'error') return 'Error';
  return action || '-';
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function initialDecisions(players) {
  return Object.fromEntries(
    (players || [])
      .filter((player) => player.accion === 'revision')
      .map((player) => [player.key, { action: 'skip' }])
  );
}

const BUSY_STATES = {
  loading: {
    color: 'teal',
    icon: IconFileSpreadsheet,
    title: 'Analizando Excel',
    subtitle: 'Leyendo hojas, fechas y mediciones del archivo.',
    stages: ['Hojas', 'Fechas', 'Duplicados', 'Vista previa'],
  },
  importing: {
    color: 'blue',
    icon: IconDatabaseImport,
    title: 'Guardando importación',
    subtitle: 'Creando jugadores y actualizando mediciones del equipo.',
    stages: ['Jugadores', 'Mediciones', 'Métricas', 'Dashboard'],
  },
};

function BusyImportState({ mode, fileName }) {
  const config = BUSY_STATES[mode] || BUSY_STATES.loading;
  const Icon = config.icon;
  const [progress, setProgress] = useState(14);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    setProgress(14);
    setStage(0);

    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(94, current + 9));
      setStage((current) => (current + 1) % config.stages.length);
    }, 650);

    return () => window.clearInterval(timer);
  }, [config.stages.length, mode]);

  return (
    <Paper
      radius="md"
      p={{ base: 'md', sm: 'lg' }}
      withBorder
      bg="gray.0"
      style={{
        overflow: 'hidden',
        borderStyle: 'dashed',
        position: 'relative',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon color={config.color} variant="light" radius="xl" size={46}>
              <Icon size={22} />
            </ThemeIcon>
            <Box style={{ minWidth: 0 }}>
              <Group gap="xs" wrap="nowrap">
                <Title order={4} c="dark.7" lh={1.1}>
                  {config.title}
                </Title>
                <Loader color={config.color} size="xs" />
              </Group>
              <Text size="xs" c="dimmed" truncate>
                {fileName || config.subtitle}
              </Text>
            </Box>
          </Group>
          <Badge color={config.color} variant="light" radius="sm">
            {Math.round(progress)}%
          </Badge>
        </Group>

        <Progress
          value={progress}
          color={config.color}
          radius="xl"
          size="md"
          animated
          striped
        />

        <Group gap="xs" wrap="wrap">
          {config.stages.map((label, index) => (
            <Badge
              key={label}
              color={index === stage ? config.color : 'gray'}
              variant={index === stage ? 'filled' : 'light'}
              radius="sm"
            >
              {label}
            </Badge>
          ))}
        </Group>

        <Text size="sm" c="dimmed">
          {config.stages[stage]} en curso...
        </Text>
      </Stack>
    </Paper>
  );
}

export default function PlayerExcelImporter({ team }) {
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

  async function requestPreview(nextFile) {
    setFile(nextFile);
    setState('loading');
    setResults(null);

    try {
      const data = await importPlayerExcel({ file: nextFile, modo: 'preview', teamId: team?.id });

      setFile(nextFile);
      setPreview(data);
      setDecisions(initialDecisions(data.jugadores));
      setState('preview');
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Error procesando Excel',
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
        [playerKey]: { ...current[playerKey], action: 'update', jugador_id: value.replace('update:', '') },
      }));
      return;
    }

    setDecisions((current) => ({
      ...current,
      [playerKey]: { ...current[playerKey], action: value },
    }));
  }

  function setFallbackDate(playerKey, measurementId, date) {
    setDecisions((current) => ({
      ...current,
      [playerKey]: {
        ...current[playerKey],
        fallbackDates: {
          ...(current[playerKey]?.fallbackDates || {}),
          [measurementId]: date,
        },
      },
    }));
  }

  function decisionValue(player) {
    const decision = decisions[player.key];
    if (!decision) return 'skip';
    if (decision.action === 'update') return `update:${decision.jugador_id}`;
    return decision.action || 'skip';
  }

  function decisionOptions(player) {
    return [
      ...(player.candidatos || []).map((candidate) => ({
        value: `update:${candidate.id}`,
        label: `Actualizar: ${candidate.nombreCompleto}${candidate.fecha_nacimiento ? ` (${formatDate(candidate.fecha_nacimiento)})` : ''}`,
      })),
      { value: 'create', label: `Crear: ${player.nombreCompleto}` },
      { value: 'skip', label: 'Omitir' },
    ];
  }

  async function importFile() {
    if (!file) return;
    setState('importing');

    try {
      const data = await importPlayerExcel({ file, modo: 'importar', teamId: team?.id, decisiones: decisions });

      setResults(data);
      setState('done');
      router.refresh();
      notifications.show({
        color: 'green',
        title: 'Importación completada',
        message: `${data.resumen?.jugadores_importados || 0} jugadores procesados correctamente.`,
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Error importando Excel',
        message: error.message,
      });
      setState('preview');
    }
  }

  const players = preview?.jugadores || [];
  const reviewCount = players.filter((player) => player.accion === 'revision').length;
  const selectedReviewCount = Object.values(decisions).filter((decision) => decision.action !== 'skip').length;

  return (
    <Paper radius="md" p="md" withBorder shadow="sm" bg="white">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon color="teal" variant="light" radius="md" size={40}>
              <IconUsers size={20} />
            </ThemeIcon>
            <Box>
              <Title order={4} c="dark.8">Importar Excel de jugadores</Title>
              <Text size="xs" c="dimmed">
                Detecta hojas de medición y hojas individuales, crea o actualiza jugadores y guarda sus métricas.
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

        {state === 'loading' ? (
          <BusyImportState mode="loading" fileName={file?.name} />
        ) : null}

        {state === 'idle' || state === 'error' ? (
          <Box pos="relative">
            <Dropzone
              openRef={openRef}
              onDrop={handleDrop}
              accept={EXCEL_TYPES}
              maxSize={30 * 1024 ** 2}
              radius="md"
              activateOnClick={false}
              style={{
                border: '2px dashed var(--mantine-color-gray-4)',
                backgroundColor: 'var(--mantine-color-gray-0)',
                padding: '40px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 150ms ease, background-color 150ms ease',
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
                  <Dropzone.Reject>Solo Excel</Dropzone.Reject>
                  <Dropzone.Idle>Subir Excel (.xls / .xlsx)</Dropzone.Idle>
                </Text>

                <Text ta="center" size="sm" c="dimmed" mt={7}>
                  Arrastra y suelta el archivo o haz clic para seleccionarlo.
                </Text>
              </div>

              <Button
                size="xs"
                radius="xl"
                style={{ pointerEvents: 'all', marginTop: 20 }}
                onClick={() => openRef.current?.()}
                variant="light"
              >
                Seleccionar archivo
              </Button>
            </Dropzone>
          </Box>
        ) : null}

        {state === 'preview' && preview ? (
          <Stack gap="md">
            <Group gap="xs" wrap="wrap">
              <Badge color="blue" variant="light">{preview.resumen.players} jugadores</Badge>
              <Badge color="teal" variant="light">{preview.resumen.measurements} mediciones</Badge>
              <Badge color="gray" variant="light">{preview.resumen.parsedSheets} hojas leídas</Badge>
              {preview.resumen.dateCorrections ? (
                <Badge color="yellow" variant="light">{preview.resumen.dateCorrections} fechas corregidas</Badge>
              ) : null}
              {preview.resumen.duplicateConflicts ? (
                <Badge color="orange" variant="light">{preview.resumen.duplicateConflicts} duplicados resueltos</Badge>
              ) : null}
            </Group>

            {reviewCount ? (
              <Alert color="yellow" variant="light" icon={<IconAlertTriangle size={18} />}>
                Hay {reviewCount} jugador{reviewCount === 1 ? '' : 'es'} que requiere{reviewCount === 1 ? '' : 'n'} revisión. Estos se omitirán por defecto, así que asegúrate de seleccionar una acción o rellenar los datos que falten si quieres importarlos.
              </Alert>
            ) : null}

            <ScrollArea>
              <Table striped highlightOnHover verticalSpacing="xs" style={{ minWidth: 900 }}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Jugador</Table.Th>
                    <Table.Th>Acción</Table.Th>
                    <Table.Th ta="center">Mediciones</Table.Th>
                    <Table.Th ta="center">Última fecha</Table.Th>
                    <Table.Th>Revisión / avisos</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {players.map((player) => (
                    <Table.Tr key={player.key}>
                      <Table.Td>
                        <Text fw={700} size="sm">{player.nombreCompleto}</Text>
                        <Text size="xs" c="dimmed">
                          {player.fechaNacimiento ? `Nac. ${formatDate(player.fechaNacimiento)}` : 'Sin fecha de nacimiento'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={actionColor(player.accion)} variant="light">
                          {actionLabel(player.accion)}
                        </Badge>
                        {player.matchReason ? (
                          <Text size="xs" c="dimmed" mt={4}>{player.matchReason}</Text>
                        ) : null}
                      </Table.Td>
                      <Table.Td ta="center" fw={700}>{player.medicionesCount}</Table.Td>
                      <Table.Td ta="center">{formatDate(player.ultimaFecha)}</Table.Td>
                      <Table.Td style={{ minWidth: 280 }}>
                        <Stack gap="xs">
                          {player.accion === 'revision' ? (
                            <Select
                              size="xs"
                              radius="md"
                              data={decisionOptions(player)}
                              value={decisionValue(player)}
                              onChange={(value) => setDecision(player.key, value)}
                              allowDeselect={false}
                            />
                          ) : player.warnings?.length ? (
                            <Text size="xs" c="dimmed" lineClamp={2}>
                              {player.warnings[0]}
                              {player.warningsCount > 1 ? ` (+${player.warningsCount - 1})` : ''}
                            </Text>
                          ) : (
                            <Text size="xs" c="dimmed">Sin avisos</Text>
                          )}
                          
                          {player.missingMeasurements?.length > 0 && (
                            <Stack gap={4} mt="xs">
                              <Text size="xs" fw={600} c="dark.3">Fechas faltantes:</Text>
                              {player.missingMeasurements.map((m) => (
                                <TextInput
                                  key={m.id}
                                  type="date"
                                  size="xs"
                                  radius="md"
                                  label={`${m.sheet} (Fila ${m.row})`}
                                  placeholder="Selecciona una fecha"
                                  value={decisions[player.key]?.fallbackDates?.[m.id] || ''}
                                  onChange={(e) => setFallbackDate(player.key, m.id, e.target.value)}
                                />
                              ))}
                            </Stack>
                          )}
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Group justify="space-between" align="center" wrap="wrap">
              <Text size="xs" c="dimmed">
                {reviewCount ? `${selectedReviewCount} de ${reviewCount} revisiones seleccionadas para importar.` : 'Todo listo para importar.'}
              </Text>
              <Button
                size="xs"
                radius="xl"
                color="teal"
                leftSection={<IconCheck size={15} />}
                onClick={importFile}
              >
                Confirmar e importar
              </Button>
            </Group>
          </Stack>
        ) : null}

        {state === 'importing' ? (
          <BusyImportState mode="importing" fileName={file?.name} />
        ) : null}

        {state === 'done' && results ? (
          <Stack gap="md">
            <Group gap="xs" wrap="wrap">
              <Badge color="green" variant="light">{results.resumen.jugadores_importados} jugadores importados</Badge>
              <Badge color="teal" variant="light">{results.resumen.mediciones_creadas} mediciones creadas</Badge>
              <Badge color="blue" variant="light">{results.resumen.mediciones_actualizadas} mediciones actualizadas</Badge>
              {results.resumen.errores ? <Badge color="red" variant="light">{results.resumen.errores} incidencias</Badge> : null}
            </Group>

            <ScrollArea>
              <Table highlightOnHover verticalSpacing="xs">
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Jugador</Table.Th>
                    <Table.Th ta="center">Acción</Table.Th>
                    <Table.Th ta="center">Mediciones</Table.Th>
                    <Table.Th>Estado</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {results.resultados.map((result) => (
                    <Table.Tr key={result.key}>
                      <Table.Td fw={600}>{result.nombre}</Table.Td>
                      <Table.Td ta="center">
                        <Badge color={actionColor(result.accion)} variant="light">
                          {actionLabel(result.accion)}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="center">
                        {Number(result.mediciones_creadas || 0) + Number(result.mediciones_actualizadas || 0)}
                      </Table.Td>
                      <Table.Td c={result.error ? 'red.6' : 'green.6'} fw={600}>
                        {result.error || 'Correcto'}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
