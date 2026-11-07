'use client';

import { useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { previewTeamOsmolarity, importTeamOsmolarity } from '@/actions/hydrationActions';
import { Alert, Badge, Button, Loader, Paper, ScrollArea, Select, Stack, Table, Text } from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconUsers } from '@/components/icons3d';
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

function formatDate(value) {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initialDecisions(players) {
  const decs = {};
  (players || []).forEach((player) => {
    if (player.accion === 'actualizar') {
      decs[player.key] = { action: 'update', jugador_id: player.jugadorId };
    } else if (player.accion === 'revision' && player.candidatos?.length === 1) {
      // Una sola coincidencia parcial ("Danjuma" → "Arnaut Danjuma"): se propone, el usuario puede cambiarla.
      decs[player.key] = { action: 'update', jugador_id: player.candidatos[0].id };
    } else {
      decs[player.key] = { action: 'skip' };
    }
  });
  return decs;
}

export default function TeamOsmolarityImporter({ team }) {
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
        message: errorMessage(err)
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
    const suggested = [];
    const seen = new Set();
    const add = (list, id, nombre) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      list.push({ value: `update:${id}`, label: `Actualizar: ${nombre}` });
    };

    if (player.accion === 'actualizar' && player.jugadorId) {
      const match = (preview?.plantilla || []).find((p) => p.id === player.jugadorId);
      add(suggested, player.jugadorId, match?.nombreCompleto || player.nombreCompleto);
    }
    (player.candidatos || []).forEach((candidate) => add(suggested, candidate.id, candidate.nombreCompleto));

    const rest = [];
    (preview?.plantilla || []).forEach((p) => add(rest, p.id, p.nombreCompleto));

    const groups = [];
    if (suggested.length) groups.push({ group: 'Sugeridos', items: suggested });
    if (rest.length) groups.push({ group: suggested.length ? 'Resto de la plantilla' : 'Plantilla', items: rest });
    groups.push({ group: 'Otras', items: [{ value: 'skip', label: 'Omitir' }] });
    return groups;
  }

  async function importFile() {
    if (!file) return;
    setState('importing');

    try {
      const data = await importTeamOsmolarity(file, team?.id, decisions);
      setResults(data);
      setState('done');
      router.refresh();
      notifySaved({
        color: 'green',
        title: 'Importación completada',
        message: `${data.resumen?.mediciones_guardadas || 0} registros guardados con éxito.`,
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Error importando datos',
        message: errorMessage(error),
      });
      setState('preview');
    }
  }

  const players = preview?.jugadores || [];
  const reviewCount = players.filter((player) => player.accion === 'revision').length;
  const errorCount = players.filter((player) => player.accion === 'error').length;
  const selectedUpdateCount = Object.values(decisions).filter((d) => d.action === 'update').length;

  function renderSelect(player) {
    return (
      <Select
        size="xs"
        radius="md"
        data={decisionOptions(player)}
        value={decisionValue(player)}
        onChange={(val) => setDecision(player.key, val)}
        allowDeselect={false}
        searchable
        nothingFoundMessage="Sin resultados"
        comboboxProps={{ zIndex: 2500, withinPortal: true }}
      />
    );
  }

  const statusBadge = (action, label) => (
    <Badge color={actionColor(action)} variant="light" radius="sm" tt="none">
      {label ?? actionLabel(action)}
    </Badge>
  );

  return (
    <ImporterShell
      icon={IconUsers}
      title="Osmolaridad del equipo (CSV)"
      description="Sube el CSV del osmómetro, asocia cada medición a un jugador del equipo y guárdala en su historial."
      showReset={state !== 'idle'}
      resetDisabled={state === 'loading' || state === 'importing'}
      onReset={reset}
    >
      {(state === 'loading' || state === 'importing') && (
        <Paper p="xl" radius="lg" bg="gray.0" withBorder style={{ borderStyle: 'dashed', textAlign: 'center' }}>
          <Stack align="center" gap="sm">
            <Loader color={state === 'loading' ? 'teal' : 'blue'} size="md" />
            <Text size="sm" fw={600}>
              {state === 'loading' ? 'Procesando archivo CSV...' : 'Guardando datos de osmolaridad...'}
            </Text>
            <Text size="xs" c="dimmed">
              {state === 'loading'
                ? 'Analizando nombres de jugadores y fechas de medición.'
                : 'Actualizando el historial de hidratación.'}
            </Text>
          </Stack>
        </Paper>
      )}

      {(state === 'idle' || state === 'error') && (
        <ImportDropzone
          openRef={openRef}
          onDrop={handleDrop}
          accept={CSV_TYPES}
          maxSize={10 * 1024 ** 2}
          idleLabel="Subir CSV (.csv)"
          rejectLabel="Solo archivos CSV"
          onTemplate={downloadTemplate}
        />
      )}

      {state === 'preview' && preview && (
        <Stack gap="sm">
          <SummaryBadges
            items={[
              { label: `${preview.resumen.players} jugadores`, color: 'blue' },
              { label: `${preview.resumen.measurements} mediciones`, color: 'teal' },
              preview.resumen.skippedRows > 0 && { label: `${preview.resumen.skippedRows} filas con errores`, color: 'red' },
            ]}
          />

          {errorCount > 0 && (
            <Alert color="red" variant="light" radius="md" p="xs" icon={<IconAlertTriangle size={16} />}>
              <Text size="xs">
                {errorCount} jugador{errorCount === 1 ? '' : 'es'} sin coincidencias en el equipo. Se omitirán salvo que les asignes un jugador de la plantilla.
              </Text>
            </Alert>
          )}

          {reviewCount > 0 && (
            <Alert color="yellow" variant="light" radius="md" p="xs" icon={<IconAlertTriangle size={16} />}>
              <Text size="xs">
                {reviewCount} jugador{reviewCount === 1 ? '' : 'es'} con coincidencia parcial. Revisa el jugador propuesto o elige &quot;Omitir&quot;.
              </Text>
            </Alert>
          )}

          {isMobile ? (
            <Stack gap="xs">
              {players.map((player) => (
                <ImportRowCard
                  key={player.key}
                  title={player.nombreCompleto}
                  badge={statusBadge(player.accion)}
                  meta={[
                    { label: 'Mediciones', value: player.medicionesCount },
                    { label: 'Última', value: formatDate(player.ultimaFecha) },
                  ]}
                >
                  {renderSelect(player)}
                </ImportRowCard>
              ))}
            </Stack>
          ) : (
            <ScrollArea.Autosize mah={400}>
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Jugador (archivo)</Table.Th>
                    <Table.Th ta="center">Mediciones</Table.Th>
                    <Table.Th>Última fecha</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ width: 320 }}>Acción / mapeo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {players.map((player) => (
                    <Table.Tr key={player.key}>
                      <Table.Td fw={600}>{player.nombreCompleto}</Table.Td>
                      <Table.Td ta="center">{player.medicionesCount}</Table.Td>
                      <Table.Td>{formatDate(player.ultimaFecha)}</Table.Td>
                      <Table.Td>{statusBadge(player.accion)}</Table.Td>
                      <Table.Td>{renderSelect(player)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea.Autosize>
          )}

          <ImportActionBar text={`Se importarán las mediciones de ${selectedUpdateCount} jugador${selectedUpdateCount === 1 ? '' : 'es'}.`}>
            <Button
              size="sm"
              radius="xl"
              color="teal"
              leftSection={<IconCheck size={15} />}
              onClick={importFile}
              disabled={selectedUpdateCount === 0}
            >
              Importar
            </Button>
          </ImportActionBar>
        </Stack>
      )}

      {state === 'done' && results && (
        <Stack gap="sm">
          <SummaryBadges
            items={[
              { label: `${results.resumen.mediciones_guardadas} mediciones guardadas`, color: 'green' },
              results.resumen.mediciones_omitidas > 0 && { label: `${results.resumen.mediciones_omitidas} omitidas`, color: 'gray' },
            ]}
          />

          {isMobile ? (
            <Stack gap="xs">
              {results.resultados.map((result) => (
                <ImportRowCard
                  key={result.key}
                  title={result.nombre}
                  badge={statusBadge(result.accion, result.status)}
                  meta={[{ label: 'Mediciones', value: result.mediciones_procesadas }]}
                />
              ))}
            </Stack>
          ) : (
            <ScrollArea.Autosize mah={400}>
              <Table highlightOnHover verticalSpacing="xs">
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Jugador</Table.Th>
                    <Table.Th ta="center">Mediciones procesadas</Table.Th>
                    <Table.Th>Estado</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {results.resultados.map((result) => (
                    <Table.Tr key={result.key}>
                      <Table.Td fw={600}>{result.nombre}</Table.Td>
                      <Table.Td ta="center">{result.mediciones_procesadas}</Table.Td>
                      <Table.Td>{statusBadge(result.accion, result.status)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea.Autosize>
          )}
        </Stack>
      )}
    </ImporterShell>
  );
}
