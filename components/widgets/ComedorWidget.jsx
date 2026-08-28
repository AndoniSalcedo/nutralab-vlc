'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconChefHat, IconClock, IconToolsKitchen } from '@tabler/icons-react';

export default function ComedorWidget({
  jugadorId,
  menus = [],
  selectedDate = new Date(),
}) {
  const router = useRouter();

  const todayDiningMenu = useMemo(() => {
    if (!menus || !Array.isArray(menus) || menus.length === 0) return null;
    const currentMenu = menus[0];
    if (!currentMenu?.dias || !Array.isArray(currentMenu.dias)) return null;

    const daysNoAccents = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const selDate = new Date(selectedDate);
    const dayIdx = selDate.getDay();
    const targetDay = daysNoAccents[dayIdx];

    const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const dayData = currentMenu.dias.find((d) => {
      const dName = normalize(d.dia);
      return dName === targetDay || dName.startsWith(targetDay.slice(0, 3));
    });

    if (!dayData?.comida) return null;
    const { primero, segundo, postre } = dayData.comida;
    if (!primero && !segundo && !postre) return null;
    return { primero, segundo, postre };
  }, [menus, selectedDate]);

  const hasMenus = Array.isArray(menus) && menus.length > 0;

  return (
    <Paper
      shadow="xs"
      radius="lg"
      p="md"
      bg="white"
      withBorder
      style={{
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onClick={() => router.push(`/dashboard/jugador/${jugadorId}/nutricion/menu`)}
    >
      {/* Cabecera con fondo blanco y acento naranja */}
      <Group justify="space-between" align="center" mb="sm">
        <Group gap="xs" align="center">
          <ThemeIcon color="orange" variant="light" size="sm" radius="md">
            <IconChefHat size={14} />
          </ThemeIcon>
          <Text fw={700} fz="sm" c="dark.5">
            Comedor Ciudad Deportiva
          </Text>
        </Group>
        {todayDiningMenu && (
          <Group gap={5} align="center" wrap="nowrap">
            <IconClock size={13} color="var(--mantine-color-orange-6)" />
            <Text fz="xs" fw={700} c="orange.8">
              13:00 - 15:30
            </Text>
          </Group>
        )}
      </Group>

      {/* Si hay menú publicado para hoy: Platos estructurados con acento naranja */}
      {todayDiningMenu ? (
        <Stack gap={8}>
          {todayDiningMenu.primero && (
            <Paper
              p="xs"
              radius="md"
              bg="gray.0"
              withBorder
              style={{ borderColor: 'var(--mantine-color-gray-2)' }}
            >
              <Group justify="space-between" align="center" wrap="nowrap">
                <Text fz="10px" fw={850} c="orange.8" tt="uppercase" style={{ flexShrink: 0 }}>
                  1º Base
                </Text>
                <Text fz="xs" fw={600} c="dark.7" truncate style={{ flex: 1, paddingLeft: 8 }}>
                  {todayDiningMenu.primero}
                </Text>
                <Text fz="10px" fw={600} c="dimmed" style={{ flexShrink: 0 }}>
                  Recarga
                </Text>
              </Group>
            </Paper>
          )}

          {todayDiningMenu.segundo && (
            <Paper
              p="xs"
              radius="md"
              bg="gray.0"
              withBorder
              style={{ borderColor: 'var(--mantine-color-gray-2)' }}
            >
              <Group justify="space-between" align="center" wrap="nowrap">
                <Text fz="10px" fw={850} c="orange.8" tt="uppercase" style={{ flexShrink: 0 }}>
                  2º Proteína
                </Text>
                <Text fz="xs" fw={600} c="dark.7" truncate style={{ flex: 1, paddingLeft: 8 }}>
                  {todayDiningMenu.segundo}
                </Text>
                <Text fz="10px" fw={600} c="dimmed" style={{ flexShrink: 0 }}>
                  Músculo
                </Text>
              </Group>
            </Paper>
          )}

          {todayDiningMenu.postre && (
            <Paper
              p="xs"
              radius="md"
              bg="gray.0"
              withBorder
              style={{ borderColor: 'var(--mantine-color-gray-2)' }}
            >
              <Group justify="space-between" align="center" wrap="nowrap">
                <Text fz="10px" fw={850} c="orange.8" tt="uppercase" style={{ flexShrink: 0 }}>
                  Postre
                </Text>
                <Text fz="xs" fw={600} c="dark.7" truncate style={{ flex: 1, paddingLeft: 8 }}>
                  {todayDiningMenu.postre}
                </Text>
                <Text fz="10px" fw={600} c="dimmed" style={{ flexShrink: 0 }}>
                  Vitalidad
                </Text>
              </Group>
            </Paper>
          )}
        </Stack>
      ) : (
        /* Estado limpio si no hay servicio o no hay menú */
        <Paper
          p="md"
          radius="md"
          bg="gray.0"
          withBorder
          ta="center"
          my="xs"
          style={{ borderColor: 'var(--mantine-color-gray-2)' }}
        >
          <ThemeIcon color="orange" variant="light" size={32} radius="md" mx="auto" mb={6}>
            <IconToolsKitchen size={18} />
          </ThemeIcon>
          <Text fz="xs" fw={700} c="dark.5">
            {!hasMenus ? 'Sin servicio de comedor' : 'Sin menú registrado para hoy'}
          </Text>
          <Text fz="10px" c="dimmed" mt={2}>
            {!hasMenus
              ? 'El equipo no tiene comedor registrado en la app'
              : 'No se ha publicado menú de comedor para este día'}
          </Text>
        </Paper>
      )}

      {/* Pie de tarjeta con fondo blanco */}
      <Group
        justify="space-between"
        align="center"
        mt="xs"
        pt="xs"
        style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}
      >
        <Text fz="10px" c="dimmed" fw={500}>
          Supervisado por nutrición
        </Text>
        {hasMenus && (
          <Text fz="10px" fw={700} c="orange.8">
            Menú completo →
          </Text>
        )}
      </Group>
    </Paper>
  );
}
