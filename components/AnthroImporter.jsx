'use client';

import { useRef, useState } from 'react';
import { Dropzone } from '@mantine/dropzone';
import { IconCloudUpload, IconDownload, IconX, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
import { 
  Group, 
  Text, 
  Button, 
  useMantineTheme, 
  Box, 
  Stack, 
  Paper, 
  Title, 
  Table, 
  Checkbox, 
  Badge, 
  Alert, 
  ScrollArea 
} from '@mantine/core';

export default function AnthroImporter() {
  const openRef = useRef(null);
  const theme = useMantineTheme();
  const [estado, setEstado] = useState('idle');
  const [jugadores, setJugadores] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [resultados, setResultados] = useState([]);
  const [error, setError] = useState('');
  const [archivo, setArchivo] = useState(null);

  const EXCEL_TYPES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  async function handleDrop(files) {
    const file = files[0];
    if (!file) return;
    setArchivo(file);
    setEstado('cargando');
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('modo', 'preview');
    try {
      const res = await fetch('/api/import-anthro', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el archivo');
      setJugadores(data.jugadores);
      setSeleccionados(new Set(data.jugadores.map((j) => j._nombre_completo)));
      setEstado('preview');
    } catch (err) {
      setError(err.message);
      setEstado('error');
    }
  }

  function toggleSeleccion(nombre) {
    setSeleccionados(prev => { 
      const next = new Set(prev); 
      if (next.has(nombre)) {
        next.delete(nombre);
      } else {
        next.add(nombre);
      }
      return next; 
    });
  }

  function toggleTodos() {
    if (seleccionados.size === jugadores.length) setSeleccionados(new Set());
    else setSeleccionados(new Set(jugadores.map(j => j._nombre_completo)));
  }

  async function handleImportar() {
    if (!archivo || seleccionados.size === 0) return;
    setEstado('importando');
    const fd = new FormData();
    fd.append('file', archivo);
    fd.append('modo', 'importar');
    fd.append('seleccionados', JSON.stringify(Array.from(seleccionados)));
    try {
      const res = await fetch('/api/import-anthro', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultados(data.resultados);
      setEstado('done');
    } catch (err) { 
      setError(err.message); 
      setEstado('error'); 
    }
  }

  function resetear() {
    setEstado('idle'); 
    setJugadores([]); 
    setSeleccionados(new Set()); 
    setResultados([]); 
    setError(''); 
    setArchivo(null);
  }

  const fmt = (v, dec = 1) => v != null ? Number(v).toFixed(dec) : '—';

  return (
    <Paper radius="md" p="md" withBorder shadow="sm" bg="white">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <div>
            <Title order={4} c="dark.8">Importar antropometrías</Title>
            <Text size="xs" c="dimmed">Excel del club - Última medición por jugador</Text>
          </div>
          {estado !== 'idle' && (
            <Button variant="light" color="gray" size="xs" radius="xl" onClick={resetear}>
              Nuevo archivo
            </Button>
          )}
        </Group>

        {estado === 'idle' && (
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
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--mantine-color-blue-4)';
                e.currentTarget.style.backgroundColor = 'var(--mantine-color-blue-0)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)';
                e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
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
                  <Dropzone.Idle>Subir antropometría (.xls / .xlsx)</Dropzone.Idle>
                </Text>

                <Text ta="center" size="sm" c="dimmed" mt={7}>
                  Arrastra y suelta el archivo o haz clic para seleccionarlo.
                </Text>
              </div>

              <Button
                size="xs"
                radius="xl"
                style={{ pointerEvents: 'all', marginTop: '20px' }}
                onClick={() => openRef.current?.()}
                variant="light"
              >
                Seleccionar archivo
              </Button>
            </Dropzone>
          </Box>
        )}

        {estado === 'cargando' && (
          <Box py="xl" ta="center">
            <Text c="dimmed" size="sm">Procesando Excel...</Text>
          </Box>
        )}

        {estado === 'error' && (
          <Alert color="red" icon={<IconAlertTriangle size={16} />} radius="md">
            {error}
          </Alert>
        )}

        {estado === 'preview' && jugadores.length > 0 && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="xs" c="dimmed" fw={600}>
                {jugadores.length} jugadores detectados — {seleccionados.size} seleccionados
              </Text>
              <Button variant="light" color="blue" size="xs" radius="xl" onClick={toggleTodos}>
                {seleccionados.size === jugadores.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </Button>
            </Group>

            <ScrollArea>
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th style={{ width: 40 }}></Table.Th>
                    <Table.Th>Jugador</Table.Th>
                    <Table.Th ta="center">Fecha</Table.Th>
                    <Table.Th ta="center">Altura</Table.Th>
                    <Table.Th ta="center">Peso</Table.Th>
                    <Table.Th ta="center">% Grasa</Table.Th>
                    <Table.Th ta="center">Masa magra</Table.Th>
                    <Table.Th ta="center">S6 pliegues</Table.Th>
                    <Table.Th ta="center">Somatotipo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {jugadores.map((j) => {
                    const sel = seleccionados.has(j._nombre_completo);
                    return (
                      <Table.Tr 
                        key={j._nombre_completo} 
                        onClick={() => toggleSeleccion(j._nombre_completo)}
                        style={{ cursor: 'pointer', opacity: sel ? 1 : 0.5 }}
                      >
                        <Table.Td onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={sel} onChange={() => toggleSeleccion(j._nombre_completo)} />
                        </Table.Td>
                        <Table.Td fw={600}>{j._nombre_completo}</Table.Td>
                        <Table.Td ta="center" c="dimmed">{j.fecha_ultima_medicion ?? '-'}</Table.Td>
                        <Table.Td ta="center">{j.altura_cm ? `${j.altura_cm} cm` : '-'}</Table.Td>
                        <Table.Td ta="center">{j.peso_kg ? `${fmt(j.peso_kg)} kg` : '-'}</Table.Td>
                        <Table.Td ta="center">
                          <Badge 
                            color={(j.porcentaje_grasa_faulkner ?? 0) > 14 ? 'red' : (j.porcentaje_grasa_faulkner ?? 0) > 11 ? 'yellow' : 'green'} 
                            variant="light"
                          >
                            {fmt(j.porcentaje_grasa_faulkner)}%
                          </Badge>
                        </Table.Td>
                        <Table.Td ta="center">{j.masa_magra_kg ? `${fmt(j.leanMass || j.masa_magra_kg)} kg` : '-'}</Table.Td>
                        <Table.Td ta="center">{fmt(j.suma_6_pliegues)} mm</Table.Td>
                        <Table.Td ta="center" c="dimmed">
                          {j.endomorfia != null ? `${fmt(j.endomorfia)}-${fmt(j.mesomorfia)}-${fmt(j.ectomorfia)}` : '-'}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Group justify="flex-end">
              <Button onClick={handleImportar} disabled={seleccionados.size === 0} color="blue" size="xs" radius="xl">
                Importar {seleccionados.size} jugador{seleccionados.size !== 1 ? 'es' : ''}
              </Button>
            </Group>
          </Stack>
        )}

        {estado === 'importando' && (
          <Box py="xl" ta="center">
            <Text c="dimmed" size="sm">Actualizando datos en Supabase...</Text>
          </Box>
        )}

        {estado === 'done' && (
          <Stack gap="md">
            <Alert color="green" icon={<IconCheck size={16} />} title="Importación completada">
              {resultados.filter(r => !r.error).length} jugadores han sido actualizados con éxito.
            </Alert>

            <ScrollArea>
              <Table highlightOnHover verticalSpacing="xs">
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Jugador</Table.Th>
                    <Table.Th ta="center">Acción</Table.Th>
                    <Table.Th>Estado / Error</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {resultados.map((r, i) => (
                    <Table.Tr key={i}>
                      <Table.Td fw={500}>{r.nombre}</Table.Td>
                      <Table.Td ta="center">
                        <Badge color={r.accion === 'creado' ? 'blue' : 'green'} variant="light">
                          {r.accion}
                        </Badge>
                      </Table.Td>
                      <Table.Td c={r.error ? 'red.6' : 'green.6'} fw={500}>
                        {r.error ?? 'Correcto (OK)'}
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
