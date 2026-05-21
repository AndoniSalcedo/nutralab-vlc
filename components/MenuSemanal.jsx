'use client';

import { useState } from 'react';
import { 
  ActionIcon,
  Anchor,
  Paper, 
  Stack, 
  Group, 
  Title, 
  Text, 
  Button, 
  FileButton, 
  TextInput, 
  Badge, 
  SimpleGrid, 
  Box, 
  Divider,
  Select,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconCalendar,
  IconChefHat,
  IconClock,
  IconFlame,
  IconToolsKitchen,
  IconUpload,
} from '@tabler/icons-react';
import NothingFound from '@/components/NothingFound/NothingFound';

const DIAS_ORDEN = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function formatWeek(value) {
  if (!value) return 'Sin semana';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function DishLine({ label, value }) {
  return (
    <Group gap={6} align="flex-start" wrap="nowrap">
      <Text size="xs" c="dimmed" fw={800} style={{ flex: '0 0 24px' }}>
        {label}
      </Text>
      <Text size="sm" fw={550} c="dark.4" style={{ overflowWrap: 'anywhere' }}>
        {value || 'Sin registrar'}
      </Text>
    </Group>
  );
}

function TarjetaDia({ dia }) {
  return (
    <Paper
      radius="lg"
      p={{ base: 'sm', sm: 'md' }}
      withBorder
      shadow="sm"
      bg="white"
      style={{ minWidth: 0, height: '100%' }}
    >
      <Stack gap="sm" h="100%">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Title order={4} size="h5" fw={850} c="#24291f" lh={1.1}>
            {dia.dia}
          </Title>
          <ThemeIcon color="gray" variant="light" radius="xl" size={30}>
            <IconClock size={15} />
          </ThemeIcon>
        </Group>

        <Stack gap={6}>
          <Badge size="xs" color="orange" variant="light" radius="sm" leftSection={<IconToolsKitchen size={11} />}>
            Comida
          </Badge>
          <DishLine label="1º" value={dia.comida?.primero} />
          <DishLine label="2º" value={dia.comida?.segundo} />
          {dia.comida?.postre && <DishLine label="P" value={dia.comida.postre} />}
        </Stack>

        <Divider style={{ borderStyle: 'dashed' }} />

        <Stack gap={6}>
          <Badge size="xs" color="blue" variant="light" radius="sm" leftSection={<IconFlame size={11} />}>
            Cena
          </Badge>
          <DishLine label="1º" value={dia.cena?.primero} />
          <DishLine label="2º" value={dia.cena?.segundo} />
          {dia.cena?.postre && <DishLine label="P" value={dia.cena.postre} />}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function MenuSemanal({ menusIniciales }) {
  const [menus, setMenus] = useState(menusIniciales);
  const [selected, setSelected] = useState(menusIniciales[0] || null);
  const [uploading, setUploading] = useState(false);
  const [semana, setSemana] = useState(() => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
    return lunes.toISOString().split('T')[0];
  });

  async function handleUploadFile(file) {
    if (!file) return;
    setUploading(true); 
    const notificationId = 'menu-semanal-upload';
    notifications.show({
      id: notificationId,
      color: 'blue',
      title: 'IA procesando',
      message: 'La IA está leyendo e indexando el menú.',
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
    
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
      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'Menú actualizado',
        message: 'El menú semanal se ha procesado correctamente.',
        loading: false,
        autoClose: 4000,
        withCloseButton: true,
      });
    } catch (e) { 
      notifications.update({
        id: notificationId,
        color: 'red',
        title: 'Error al subir menú',
        message: e.message,
        loading: false,
        autoClose: 5000,
        withCloseButton: true,
      });
    } finally { 
      setUploading(false); 
    }
  }

  const diasOrdenados = selected ? [...selected.dias].sort((a, b) => DIAS_ORDEN.indexOf(a.dia) - DIAS_ORDEN.indexOf(b.dia)) : [];
  const weekOptions = menus.map((menu) => ({
    value: menu.semana,
    label: `Semana del ${formatWeek(menu.semana)}`,
  }));

  return (
    <Stack gap="lg">
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        shadow="sm"
        radius="xl"
        withBorder
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
          zIndex: 10,
          position: 'relative',
        }}
      >
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="sm" wrap="nowrap">
              <Tooltip label="Volver al panel" withArrow>
                <ActionIcon component={Anchor} href="/dashboard" variant="light" color="gray" radius="xl" size={42}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
              </Tooltip>
              <ThemeIcon color="teal" variant="light" radius="xl" size={42}>
                <IconChefHat size={21} />
              </ThemeIcon>
              <Box>
                <Title order={3} fw={850} c="#24291f" lh={1.1}>
                  Menú Ciudad Deportiva
                </Title>
                <Text size="xs" c="dimmed" mt={2}>
                  Comedor del primer equipo, comida y cena.
                </Text>
              </Box>
            </Group>

            <Group align="flex-end" gap="xs" wrap="wrap">
              <TextInput
                label="Semana"
                type="date"
                value={semana}
                onChange={(e) => setSemana(e.target.value)}
                leftSection={<IconCalendar size={16} />}
                size="sm"
                radius="xl"
                variant="filled"
              />
              <FileButton onChange={handleUploadFile} accept="image/*,.pdf" disabled={uploading}>
                {(props) => (
                  <Button
                    {...props}
                    loading={uploading}
                    leftSection={<IconUpload size={16} />}
                    color="blue"
                    radius="xl"
                    size="sm"
                  >
                    Subir menú
                  </Button>
                )}
              </FileButton>
            </Group>
          </Group>

          <Paper p={6} radius="xl" shadow="xs" withBorder bg="white" w="100%">
            <Group gap={8} w="100%" wrap="wrap" align="center">
              <Select
                placeholder="Selecciona una semana"
                leftSection={<IconCalendar size={16} style={{ opacity: 0.7 }} />}
                data={weekOptions}
                value={selected?.semana || null}
                onChange={(value) => {
                  const next = menus.find((menu) => menu.semana === value);
                  if (next) setSelected(next);
                }}
                disabled={menus.length === 0}
                variant="filled"
                radius="xl"
                size="sm"
                allowDeselect={false}
                style={{ flex: 1, minWidth: 240 }}
              />
            </Group>
          </Paper>
        </Stack>
      </Paper>

      {selected ? (
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Box>
              <Title order={4} fw={800} c="dark.4">
                Semana del {formatWeek(selected.semana)}
              </Title>
              <Text size="xs" c="dimmed">
                Platos extraídos y estructurados para planificación nutricional.
              </Text>
            </Box>
          </Group>
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
