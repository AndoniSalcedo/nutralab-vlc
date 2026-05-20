'use client';

import { useState } from 'react';
import { 
  Paper, 
  Stack, 
  Group, 
  Title, 
  Text, 
  Button, 
  FileButton, 
  TextInput, 
  Alert, 
  Badge, 
  SimpleGrid, 
  Box, 
  Divider 
} from '@mantine/core';
import { IconCalendar, IconUpload, IconToolsKitchen, IconFlame, IconInfoCircle } from '@tabler/icons-react';
import NothingFound from '@/components/NothingFound/NothingFound';

const DIAS_ORDEN = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function TarjetaDia({ dia }) {
  return (
    <Paper radius="md" p="md" withBorder shadow="xs" bg="white" style={{ minWidth: 0 }}>
      <Stack gap="xs">
        <Title order={4} size="h5" fw={800} c="dark.7">
          {dia.dia}
        </Title>
        
        <Box>
          <Badge size="xs" color="orange" variant="light" mb={4} leftSection={<IconToolsKitchen size={10} />}>
            COMIDA
          </Badge>
          <Stack gap={2}>
            {dia.comida.primero ? (
              <Text size="sm" fw={500} c="dark.6">1º {dia.comida.primero}</Text>
            ) : (
              <Text size="sm" c="dimmed" fs="italic">Sin primero</Text>
            )}
            {dia.comida.segundo && (
              <Text size="sm" fw={500} c="dark.6">2º {dia.comida.segundo}</Text>
            )}
            {dia.comida.postre && (
              <Text size="xs" c="dimmed">🍎 {dia.comida.postre}</Text>
            )}
          </Stack>
        </Box>
        
        <Divider style={{ borderStyle: 'dashed' }} />
        
        <Box>
          <Badge size="xs" color="indigo" variant="light" mb={4} leftSection={<IconFlame size={10} />}>
            CENA
          </Badge>
          <Stack gap={2}>
            {dia.cena.primero ? (
              <Text size="sm" fw={500} c="dark.6">1º {dia.cena.primero}</Text>
            ) : (
              <Text size="sm" c="dimmed" fs="italic">Sin primero</Text>
            )}
            {dia.cena.segundo && (
              <Text size="sm" fw={500} c="dark.6">2º {dia.cena.segundo}</Text>
            )}
            {dia.cena.postre && (
              <Text size="xs" c="dimmed">🍎 {dia.cena.postre}</Text>
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function MenuSemanal({ menusIniciales }) {
  const [menus, setMenus] = useState(menusIniciales);
  const [selected, setSelected] = useState(menusIniciales[0] || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [semana, setSemana] = useState(() => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
    return lunes.toISOString().split('T')[0];
  });

  async function handleUploadFile(file) {
    if (!file) return;
    setUploading(true); 
    setError('');
    
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('semana', semana);
      
      const res = await fetch('/api/menu-semanal', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir el archivo');
      
      setMenus(prev => {
        const filtered = prev.filter(m => m.semana !== data.menu.semana);
        return [data.menu, ...filtered].sort((a, b) => b.semana.localeCompare(a.semana));
      });
      setSelected(data.menu);
    } catch (e) { 
      setError(e.message); 
    } finally { 
      setUploading(false); 
    }
  }

  const diasOrdenados = selected ? [...selected.dias].sort((a, b) => DIAS_ORDEN.indexOf(a.dia) - DIAS_ORDEN.indexOf(b.dia)) : [];

  return (
    <Stack gap="lg">
      
      {/* Tarjeta de Carga */}
      <Paper radius="md" p="md" withBorder shadow="xs" bg="white">
        <Stack gap="md">
          <Group justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <Title order={4} c="dark.8">Subir menú semanal</Title>
              <Text size="xs" c="dimmed">
                Foto o PDF del menú del comedor · La IA extrae automáticamente los platos de cada día
              </Text>
            </div>
            
            <Group align="flex-end" gap="xs" style={{ flexWrap: 'wrap' }}>
              <TextInput
                label="Semana del:"
                type="date"
                value={semana}
                onChange={(e) => setSemana(e.target.value)}
                leftSection={<IconCalendar size={16} />}
                size="sm"
                radius="md"
              />
              <FileButton onChange={handleUploadFile} accept="image/*,.pdf" disabled={uploading}>
                {(props) => (
                  <Button 
                    {...props} 
                    loading={uploading} 
                    leftSection={<IconUpload size={16} />}
                    color="blue" 
                    radius="xl"
                    size="xs"
                  >
                    Subir foto / PDF
                  </Button>
                )}
              </FileButton>
            </Group>
          </Group>

          {error && (
            <Alert color="red" icon={<IconInfoCircle size={16} />} radius="md">
              {error}
            </Alert>
          )}

          {uploading && (
            <Alert color="blue" icon={<IconInfoCircle size={16} />} radius="md" title="IA Procesando">
              La Inteligencia Artificial está leyendo e indexando el menú. Este proceso puede tardar unos segundos...
            </Alert>
          )}
        </Stack>
      </Paper>

      {/* Selector de semanas guardadas */}
      {menus.length > 1 && (
        <Group gap="xs" style={{ flexWrap: 'wrap' }}>
          {menus.map(m => (
            <Button
              key={m.semana}
              onClick={() => setSelected(m)}
              variant={selected?.semana === m.semana ? 'filled' : 'light'}
              color="blue"
              radius="xl"
              size="xs"
            >
              Semana {m.semana}
            </Button>
          ))}
        </Group>
      )}

      {/* Grid de días */}
      {selected ? (
        <Stack gap="xs">
          <Text size="xs" c="dimmed" fw={600}>
            Menú de la semana del {selected.semana} · {selected.dias.length} días estructurados
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4, lg: 7 }} spacing="md">
            {diasOrdenados.map(dia => (
              <TarjetaDia key={dia.dia} dia={dia} />
            ))}
          </SimpleGrid>
        </Stack>
      ) : (
        <NothingFound
          withPaper
          icon={IconToolsKitchen}
          title="Sin menús"
          description="No hay menús registrados. Sube la foto o PDF del menú de esta semana para empezar."
        />
      )}
    </Stack>
  );
}
