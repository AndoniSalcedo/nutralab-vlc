'use client';

import { useState, useRef } from 'react';
import { 
  Paper, 
  Stack, 
  Group, 
  Title, 
  Text, 
  Button, 
  Badge, 
  SimpleGrid, 
  Box,
  UnstyledButton,
  TextInput,
  Alert
} from '@mantine/core';
import { IconUpload, IconFileText, IconAlertCircle, IconCalendar } from '@tabler/icons-react';
import { BentoCard } from './Bento/BentoItem';

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

export default function AnaliticasTab({ jugadorId, analiticasIniciales }) {
  const [analiticas, setAnaliticas] = useState(analiticasIniciales);
  const [selected, setSelected] = useState(analiticasIniciales[0] || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fecha, setFecha] = useState('');
  const fileRef = useRef(null);

  const GRUPOS = {
    'Hemograma': ['San-Leucocitos','San-Hematies','San-Hemoglobina','San-Hematocrito','San-Volumen Corp','San-Hb. Corpuscular','San-Plaquetas','San-Volumen plaquetar'],
    'Formula Leucocitaria': ['Lks-Segmentados','Lks-Basofilos','Lks-Eosinofilos','Lks-Linfocitos','Lks-Monocitos'],
    'Bioquimica': ['Glu','Cre','Uri','Col','Tri','HDL','LDL','Got','Gpt','Ggt','Fer','Iron','Transf','Vit'],
    'Otros': [],
  };

  function agrupar(params) {
    const grupos = { Hemograma: [], 'Formula Leucocitaria': [], Bioquimica: [], Otros: [] };
    params.forEach(p => {
      let asignado = false;
      for (const [grupo, prefijos] of Object.entries(GRUPOS)) {
        if (prefijos.some(pre => p.nombre.includes(pre))) { grupos[grupo].push(p); asignado = true; break; }
      }
      if (!asignado) grupos['Otros'].push(p);
    });
    return grupos;
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('jugador_id', String(jugadorId));
      fd.append('fecha_extraccion', fecha);
      const res = await fetch('/api/upload-analitica', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnaliticas(prev => [data.analitica, ...prev]);
      setSelected(data.analitica);
    } catch (e) { setError(e.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  const grupos = selected ? agrupar(selected.parametros) : {};
  const totalFuera = selected ? selected.parametros.filter(p => p.fuera_rango).length : 0;

  return (
    <Stack gap="lg">
      <Paper radius="lg" p="md" withBorder shadow="sm">
        <Group justify="space-between">
          <Title order={4}>Analíticas de sangre</Title>
          <Group gap="xs">
            <TextInput 
              type="date" 
              value={fecha} 
              onChange={e => setFecha(e.target.value)} 
              size="xs"
              placeholder="Fecha extracción"
            />
            <Button 
              leftSection={<IconUpload size={16} />} 
              onClick={() => fileRef.current?.click()} 
              loading={uploading}
              size="xs"
              variant="filled"
            >
              Subir PDF
            </Button>
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
          </Group>
        </Group>
        {error && (
          <Alert color="red" mt="md" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}
        {uploading && (
          <Alert color="blue" mt="md" icon={<IconFileText size={16} />}>
            Extrayendo parámetros con IA... puede tardar unos segundos.
          </Alert>
        )}
      </Paper>

      {analiticas.length === 0 ? (
        <Paper p="xl" radius="lg" withBorder shadow="sm" style={{ textAlign: 'center' }}>
          <Text c="dimmed">No hay analíticas registradas. Sube el PDF del laboratorio para comenzar.</Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" align="flex-start">
          <Stack gap="md" style={{ gridColumn: 'span 1' }}>
            <Title order={5} c="dimmed" tt="uppercase" lts={0.5}>Historial</Title>
            {analiticas.map(a => (
              <UnstyledButton 
                key={a.id} 
                onClick={() => setSelected(a)}
                p="md"
                radius="md"
                style={{ 
                  border: '1px solid ' + (selected?.id === a.id ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-gray-3)'),
                  backgroundColor: selected?.id === a.id ? 'var(--mantine-color-blue-light)' : 'white',
                  transition: 'all 0.2s'
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Box>
                    <Text fw={700} size="sm">{a.fecha_extraccion || 'Sin fecha'}</Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>{a.pdf_nombre}</Text>
                  </Box>
                  <IconCalendar size={16} color="var(--mantine-color-gray-5)" />
                </Group>
              </UnstyledButton>
            ))}
          </Stack>

          {selected && (
            <Stack gap="lg" style={{ gridColumn: 'span 2' }}>
              <SimpleGrid cols={3}>
                <Paper p="sm" radius="md" withBorder shadow="xs" style={{ borderLeft: '4px solid var(--mantine-color-blue-filled)' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Parámetros</Text>
                  <Text fw={800} size="xl">{selected.parametros.length}</Text>
                </Paper>
                <Paper p="sm" radius="md" withBorder shadow="xs" style={{ borderLeft: '4px solid ' + (totalFuera > 0 ? 'var(--mantine-color-red-filled)' : 'var(--mantine-color-green-filled)') }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Fuera de Rango</Text>
                  <Text fw={800} size="xl" c={totalFuera > 0 ? 'red' : 'green'}>{totalFuera}</Text>
                </Paper>
                <Paper p="sm" radius="md" withBorder shadow="xs" style={{ borderLeft: '4px solid var(--mantine-color-gray-5)' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Fecha</Text>
                  <Text fw={800} size="md" pt={4}>{selected.fecha_extraccion || '-'}</Text>
                </Paper>
              </SimpleGrid>

              {Object.entries(grupos).map(([grupo, params]) => params.length > 0 && (
                <BentoCard key={grupo} title={grupo} icon={IconFileText} color="blue">
                  <Stack gap={0}>
                    {params.map(p => <Semaforo key={p.nombre} p={p} />)}
                  </Stack>
                </BentoCard>
              ))}
            </Stack>
          )}
        </SimpleGrid>
      )}
    </Stack>
  );
}