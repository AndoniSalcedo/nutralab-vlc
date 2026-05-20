'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconCalendar, IconFileAnalytics, IconFileText, IconPlus, IconReportMedical, IconUpload } from '@tabler/icons-react';
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

function Semaforo({ p }) {
  const color = p.fuera_rango ? (p.valor > p.rango_max ? 'red' : 'orange') : 'green';
  const label = p.fuera_rango ? (p.valor > p.rango_max ? 'Alto' : 'Bajo') : 'Normal';

  return (
    <Group justify="space-between" align="center" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
      <Box style={{ flex: 1 }}>
        <Text fw={500} size="sm">{p.nombre}</Text>
        <Text size="xs" c="dimmed">Rango: {p.rango_min} - {p.rango_max} {p.unidad}</Text>
      </Box>
      <Group gap="xs">
        <Text fw={700} size="md" c={color}>{p.valor}</Text>
        <Text size="xs" c="dimmed" style={{ width: 40 }}>{p.unidad}</Text>
        <Badge variant="light" color={color} size="xs">{label}</Badge>
      </Group>
    </Group>
  );
}

const GRUPOS = {
  Hemograma: ['San-Leucocitos', 'San-Hematies', 'San-Hemoglobina', 'San-Hematocrito', 'San-Volumen Corp', 'San-Hb. Corpuscular', 'San-Plaquetas', 'San-Volumen plaquetar'],
  'Formula Leucocitaria': ['Lks-Segmentados', 'Lks-Basofilos', 'Lks-Eosinofilos', 'Lks-Linfocitos', 'Lks-Monocitos'],
  Bioquimica: ['Glu', 'Cre', 'Uri', 'Col', 'Tri', 'HDL', 'LDL', 'Got', 'Gpt', 'Ggt', 'Fer', 'Iron', 'Transf', 'Vit'],
  Otros: [],
};

function agrupar(params = []) {
  const grupos = { Hemograma: [], 'Formula Leucocitaria': [], Bioquimica: [], Otros: [] };
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
  const [error, setError] = useState('');
  const [fecha, setFecha] = useState('');
  const fileRef = useRef(null);

  const sorted = useMemo(
    () => [...analiticas].sort((a, b) => String(b.fecha_extraccion || '').localeCompare(String(a.fecha_extraccion || ''))),
    [analiticas]
  );
  const selected = sorted.find((a) => String(a.id) === String(currentId)) || sorted[0] || null;
  const parametros = selected?.parametros || [];
  const grupos = selected ? agrupar(parametros) : {};
  const totalFuera = parametros.filter((p) => p.fuera_rango).length;

  function startUpload() {
    setUploadOpen(true);
    setError('');
    setFecha('');
  }

  function cancelUpload() {
    setUploadOpen(false);
    setError('');
  }

  async function handleUpload(e) {
    if (readOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
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
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <Stack gap="lg">
      <Paper p="md" bg="white" shadow="xs" radius="lg" withBorder>
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <ThemeIcon color="blue" variant="light" radius="xl" size="lg">
                <IconReportMedical size={20} />
              </ThemeIcon>
              <Title order={3} fw={800} c="dark.4">Analíticas</Title>
            </Group>

            {!readOnly && (
              <Button size="xs" radius="xl" leftSection={<IconPlus size={14} />} onClick={startUpload}>
                Añadir PDF
              </Button>
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

      {error && !uploadOpen && (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      )}

      <Modal
        opened={uploadOpen && !readOnly}
        onClose={cancelUpload}
        title="Subir analítica"
        size="lg"
      >
        <Stack gap="md">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />}>
              {error}
            </Alert>
          )}

          <Group gap="xs" align="flex-end">
            <TextInput
              label="Fecha extracción"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={{ flex: 1, minWidth: 220 }}
            />
            <Button size="xs" radius="xl" leftSection={<IconUpload size={16} />} onClick={() => fileRef.current?.click()} loading={uploading}>
              Subir PDF
            </Button>
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
          </Group>

          {uploading && (
            <Alert color="blue" icon={<IconFileText size={16} />}>
              Extrayendo parámetros con IA... puede tardar unos segundos.
            </Alert>
          )}
        </Stack>
      </Modal>

      <Box p="md">
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
          <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Paper p="sm" radius="md" withBorder shadow="xs" style={{ borderLeft: '4px solid var(--mantine-color-blue-filled)' }}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Parámetros</Text>
              <Text fw={800} size="xl">{parametros.length}</Text>
            </Paper>
            <Paper p="sm" radius="md" withBorder shadow="xs" style={{ borderLeft: `4px solid ${totalFuera > 0 ? 'var(--mantine-color-red-filled)' : 'var(--mantine-color-green-filled)'}` }}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Fuera de rango</Text>
              <Text fw={800} size="xl" c={totalFuera > 0 ? 'red' : 'green'}>{totalFuera}</Text>
            </Paper>
            <Paper p="sm" radius="md" withBorder shadow="xs" style={{ borderLeft: '4px solid var(--mantine-color-gray-5)' }}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Fecha</Text>
              <Group gap="xs" pt={4}>
                <IconCalendar size={16} color="var(--mantine-color-gray-5)" />
                <Text fw={800} size="md">{fechaLabel(selected.fecha_extraccion)}</Text>
              </Group>
            </Paper>
          </SimpleGrid>

          {Object.entries(grupos).map(([grupo, params]) => params.length > 0 && (
            <BentoCard key={grupo} title={grupo} icon={IconFileText} color="blue">
              <Stack gap={0}>
                {params.map((p) => <Semaforo key={p.nombre} p={p} />)}
              </Stack>
            </BentoCard>
          ))}
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
