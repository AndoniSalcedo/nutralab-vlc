'use client';

import { useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { importPlayerExcel } from '@/actions/playerActions';
import { downloadXlsx } from '@/lib/io/xlsx-download';
import { DateInput } from '@mantine/dates';
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
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconDatabaseImport,
  IconFileSpreadsheet,
  IconUsers,
} from '@/components/icons3d';
import {
  ImportActionBar,
  ImportDropzone,
  ImportRowCard,
  ImporterShell,
  SummaryBadges,
  useIsMobile,
} from '@/components/import/ImportParts';
import { useRouter } from 'next/navigation';
import { notifySaved } from '@/components/motion/notifySaved';
import { errorMessage } from '@/lib/actionError';

const EXCEL_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

function actionColor(action) {
  if (action === 'actualizar') return 'green';
  if (action === 'crear') return 'blue';
  if (action === 'revision') return 'yellow';
  if (action === 'omitido' || action === 'skip') return 'gray';
  if (action === 'error') return 'red';
  return 'dark';
}

function actionLabel(action) {
  if (action === 'actualizar') return 'Actualizar';
  if (action === 'crear') return 'Crear';
  if (action === 'revision') return 'Revisión';
  if (action === 'creado') return 'Creado';
  if (action === 'actualizado') return 'Actualizado';
  if (action === 'omitido' || action === 'skip') return 'Omitido';
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
            <ThemeIcon color={config.color} variant="light" radius="xl" size={40}>
              <Icon size={22} />
            </ThemeIcon>
            <Box style={{ minWidth: 0 }}>
              <Group gap="xs" wrap="nowrap">
                <Title order={4} fz={{ base: 'sm', sm: 'lg' }} c="dark.7" lh={1.1}>
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
  const isMobile = useIsMobile();
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

  async function downloadTemplate(e) {
    e.stopPropagation();
    try {
      const headers = [
        'Nombre',
        'Fecha nacimiento',
        'Fecha medicion',
        'Estatura (cm)',
        'Peso (Kg)',
        '% grasa FAULKNER',
        '% grasa YUHASZ',
        'Pliegue Bíceps',
        'Pliegue Tríceps',
        'Pliegue Subescapular',
        'Pliegue Cresta ilíaca',
        'Pliegue Suprailíaco',
        'Pliegue Abdominal',
        'Pliegue Pantorrilla',
        'Pliegue Muslo',
        'Suma 6 Pliegues',
        'Suma 8 Pliegues',
        'Peso Óseo',
        'Peso Residual',
        'Peso Graso',
        'Peso Muscular Lee&cols',
        '%Peso Muscular Lee&cols',
        'Peso Magro',
        'Peso deseable',
        'ENDO',
        'MESO',
        'ECTO',
        'Perímetro Brazo Contraído Derecho',
        'Perímetro Pantorrilla Derecha',
        'Perímetro Pantorrilla Izquierda',
        'Perímetro Muslo Derecho',
        'Perímetro Muslo Izquierdo'
      ];
      const sampleRow = [
        'Thierry Rendall',
        '03/06/1999',
        '04/04/2026',
        '178',
        '74.2',
        '10.5',
        '11.2',
        '4',
        '6',
        '8',
        '12',
        '10',
        '15',
        '7',
        '11',
        '62',
        '83',
        '12.4',
        '8.9',
        '7.8',
        '35.1',
        '47.3',
        '66.4',
        '73.5',
        '2.5',
        '4.8',
        '2.1',
        '32.5',
        '36.2',
        '36.1',
        '54.5',
        '54.3'
      ];
      const data = [headers, sampleRow];
      await downloadXlsx({
        filename: 'plantilla_jugadores_metricas.xlsx',
        sheetName: 'Mediciones',
        rows: data,
      });
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al generar plantilla',
        message: errorMessage(err)
      });
    }
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
        message: errorMessage(error),
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
    if (!decision) {
      if (player.jugadorId) return `update:${player.jugadorId}`;
      return 'skip';
    }
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

  function getEffectiveAction(player) {
    const decision = decisions[player.key];
    if (decision) {
      if (decision.action === 'update') return 'actualizar';
      return decision.action; // 'create' or 'skip'
    }
    if (player.accion === 'revision') {
      if (player.jugadorId) return 'actualizar';
      return 'skip';
    }
    return player.accion;
  }

  async function importFile() {
    if (!file) return;
    setState('importing');

    try {
      const data = await importPlayerExcel({ file, modo: 'importar', teamId: team?.id, decisiones: decisions });

      setResults(data);
      setState('done');
      router.refresh();
      notifySaved({
        color: 'green',
        title: 'Importación completada',
        message: `${data.resumen?.jugadores_importados || 0} jugadores procesados correctamente.`,
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Error importando Excel',
        message: errorMessage(error),
      });
      setState('preview');
    }
  }

  const players = preview?.jugadores || [];
  const reviewCount = players.filter((player) => player.accion === 'revision').length;
  const selectedReviewCount = Object.values(decisions).filter((decision) => decision.action !== 'skip').length;

  function missingDatesBlock(player) {
    if (!player.missingMeasurements?.length) return null;
    const filledCount = player.missingMeasurements.filter((m) => decisions[player.key]?.fallbackDates?.[m.id]).length;
    const totalCount = player.missingMeasurements.length;
    const allFilled = filledCount === totalCount;

    return (
      <Stack gap={4}>
        <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
          <Text size="xs" fw={600} c="dark.3">Fechas de medición faltantes</Text>
          <Badge size="xs" color={allFilled ? 'green' : 'orange'} variant="light" tt="none">
            {allFilled ? 'Resuelto' : `${filledCount} de ${totalCount}`}
          </Badge>
        </Group>
        {player.missingMeasurements.map((m) => (
          <DateInput
            key={m.id}
            size="xs"
            radius="md"
            label={`${m.sheet} (fila ${m.row})`}
            placeholder="Selecciona una fecha"
            value={dateValue(decisions[player.key]?.fallbackDates?.[m.id])}
            onChange={(dateVal) => setFallbackDate(player.key, m.id, dateInputToIso(dateVal))}
            valueFormat="DD/MM/YYYY"
            clearable
            popoverProps={{ zIndex: 2500, withinPortal: true }}
          />
        ))}
      </Stack>
    );
  }

  function reasonText(player) {
    if (!player.matchReason) return null;
    const allFilled = player.missingMeasurements?.length > 0 && player.missingMeasurements.every(
      (m) => decisions[player.key]?.fallbackDates?.[m.id]
    );
    return (
      <Text size="xs" c={allFilled ? 'green.6' : 'dimmed'} fw={allFilled ? 600 : 400}>
        {allFilled ? 'Fechas asignadas correctamente' : player.matchReason}
      </Text>
    );
  }

  function warningText(player) {
    if (!player.warnings?.length) return null;
    return (
      <Text size="xs" c="dimmed" lineClamp={2}>
        {player.warnings[0]}
        {player.warningsCount > 1 ? ` (+${player.warningsCount - 1})` : ''}
      </Text>
    );
  }

  function renderSelect(player) {
    return (
      <Select
        size="xs"
        radius="md"
        data={decisionOptions(player)}
        value={decisionValue(player)}
        onChange={(value) => setDecision(player.key, value)}
        allowDeselect={false}
        comboboxProps={{ zIndex: 2500, withinPortal: true }}
      />
    );
  }

  const statusBadge = (action) => (
    <Badge color={actionColor(action)} variant="light" radius="sm" tt="none">
      {actionLabel(action)}
    </Badge>
  );

  return (
    <ImporterShell
      icon={IconUsers}
      title="Excel de jugadores"
      description="Detecta hojas de medición y hojas individuales, crea o actualiza jugadores y guarda sus métricas."
      showReset={state !== 'idle'}
      resetDisabled={state === 'loading' || state === 'importing'}
      onReset={reset}
    >
      {state === 'loading' ? <BusyImportState mode="loading" fileName={file?.name} /> : null}

      {state === 'idle' || state === 'error' ? (
        <ImportDropzone
          openRef={openRef}
          onDrop={handleDrop}
          accept={EXCEL_TYPES}
          maxSize={30 * 1024 ** 2}
          idleLabel="Subir Excel (.xlsx)"
          rejectLabel="Solo Excel"
          onTemplate={downloadTemplate}
        />
      ) : null}

      {state === 'preview' && preview ? (
        <Stack gap="sm">
          <SummaryBadges
            items={[
              { label: `${preview.resumen.players} jugadores`, color: 'blue' },
              { label: `${preview.resumen.measurements} mediciones`, color: 'teal' },
              { label: `${preview.resumen.parsedSheets} hojas`, color: 'gray' },
              preview.resumen.dateCorrections && { label: `${preview.resumen.dateCorrections} fechas corregidas`, color: 'yellow' },
              preview.resumen.duplicateConflicts && { label: `${preview.resumen.duplicateConflicts} duplicados resueltos`, color: 'orange' },
            ]}
          />

          {reviewCount ? (
            <Alert color="yellow" variant="light" radius="md" p="xs" icon={<IconAlertTriangle size={16} />}>
              <Text size="xs">
                {reviewCount} jugador{reviewCount === 1 ? '' : 'es'} requiere{reviewCount === 1 ? '' : 'n'} revisión. Se omitirán salvo que elijas una acción o completes los datos que faltan.
              </Text>
            </Alert>
          ) : null}

          {isMobile ? (
            <Stack gap="xs">
              {players.map((player) => (
                <ImportRowCard
                  key={player.key}
                  title={player.nombreCompleto}
                  subtitle={player.fechaNacimiento ? `Nac. ${formatDate(player.fechaNacimiento)}` : 'Sin fecha de nacimiento'}
                  badge={statusBadge(getEffectiveAction(player))}
                  meta={[
                    { label: 'Mediciones', value: player.medicionesCount },
                    { label: 'Última', value: formatDate(player.ultimaFecha) },
                  ]}
                >
                  {reasonText(player)}
                  {player.accion === 'revision' ? renderSelect(player) : warningText(player)}
                  {missingDatesBlock(player)}
                </ImportRowCard>
              ))}
            </Stack>
          ) : (
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
                        <Stack gap={4} align="flex-start">
                          {statusBadge(getEffectiveAction(player))}
                          {reasonText(player)}
                        </Stack>
                      </Table.Td>
                      <Table.Td ta="center" fw={700}>{player.medicionesCount}</Table.Td>
                      <Table.Td ta="center">{formatDate(player.ultimaFecha)}</Table.Td>
                      <Table.Td style={{ minWidth: 280 }}>
                        <Stack gap="xs">
                          {player.accion === 'revision'
                            ? renderSelect(player)
                            : warningText(player) || <Text size="xs" c="dimmed">Sin avisos</Text>}
                          {missingDatesBlock(player)}
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}

          <ImportActionBar
            text={reviewCount ? `${selectedReviewCount} de ${reviewCount} revisiones se importarán.` : 'Todo listo para importar.'}
          >
            <Button size="sm" radius="xl" color="teal" leftSection={<IconCheck size={15} />} onClick={importFile}>
              Importar
            </Button>
          </ImportActionBar>
        </Stack>
      ) : null}

      {state === 'importing' ? <BusyImportState mode="importing" fileName={file?.name} /> : null}

      {state === 'done' && results ? (
        <Stack gap="sm">
          <SummaryBadges
            items={[
              { label: `${results.resumen.jugadores_importados} jugadores importados`, color: 'green' },
              { label: `${results.resumen.mediciones_creadas} mediciones creadas`, color: 'teal' },
              { label: `${results.resumen.mediciones_actualizadas} actualizadas`, color: 'blue' },
              results.resumen.errores && { label: `${results.resumen.errores} incidencias`, color: 'red' },
            ]}
          />

          {isMobile ? (
            <Stack gap="xs">
              {results.resultados.map((result) => (
                <ImportRowCard
                  key={result.key}
                  title={result.nombre}
                  badge={statusBadge(result.accion)}
                  meta={[
                    {
                      label: 'Mediciones',
                      value: Number(result.mediciones_creadas || 0) + Number(result.mediciones_actualizadas || 0),
                    },
                  ]}
                >
                  <Text size="xs" c={result.error ? 'red.6' : 'green.6'} fw={600}>
                    {result.error || 'Correcto'}
                  </Text>
                </ImportRowCard>
              ))}
            </Stack>
          ) : (
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
                      <Table.Td ta="center">{statusBadge(result.accion)}</Table.Td>
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
          )}
        </Stack>
      ) : null}
    </ImporterShell>
  );
}
