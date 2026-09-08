'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconClock, IconToolsKitchen } from '@/components/icons3d';
import Icon3D from '@/components/Icon3D';

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
          <Icon3D name="cup" size={28} />
          <Text fw={700} fz="sm" c="dark.5">
            Comedor Ciudad Deportiva
          </Text>
        </Group>
        {todayDiningMenu && (
          <Group gap={5} align="center" wrap="nowrap">
            <IconClock size={13} color="var(--mantine-color-nutralabColor-8)" />
            <Text fz="xs" fw={600} c="nutralabColor.8">
              13:00 - 15:30
            </Text>
          </Group>
        )}
      </Group>

      {/* Si hay menú publicado para hoy: Platos estructurados */}
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
                <Text fz="xs" fw={700} c="dark.5" tt="uppercase" style={{ flexShrink: 0 }}>
                  1º Base
                </Text>
                <Text fz="sm" fw={500} c="dark.4" truncate style={{ flex: 1, paddingLeft: 8 }}>
                  {todayDiningMenu.primero}
                </Text>
                <Text fz="xs" fw={500} c="dimmed" style={{ flexShrink: 0 }}>
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
                <Text fz="xs" fw={700} c="dark.5" tt="uppercase" style={{ flexShrink: 0 }}>
                  2º Proteína
                </Text>
                <Text fz="sm" fw={500} c="dark.4" truncate style={{ flex: 1, paddingLeft: 8 }}>
                  {todayDiningMenu.segundo}
                </Text>
                <Text fz="xs" fw={500} c="dimmed" style={{ flexShrink: 0 }}>
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
                <Text fz="xs" fw={700} c="dark.5" tt="uppercase" style={{ flexShrink: 0 }}>
                  Postre
                </Text>
                <Text fz="sm" fw={500} c="dark.4" truncate style={{ flex: 1, paddingLeft: 8 }}>
                  {todayDiningMenu.postre}
                </Text>
                <Text fz="xs" fw={500} c="dimmed" style={{ flexShrink: 0 }}>
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
          <ThemeIcon color="nutralabColor" variant="light" size={32} radius="md" mx="auto" mb={6}>
            <IconToolsKitchen size={18} />
          </ThemeIcon>
          <Text fz="xs" fw={700} c="dark.5">
            {!hasMenus ? 'Sin servicio de comedor' : 'Sin menú registrado para hoy'}
          </Text>
          <Text fz="xs" c="dimmed" mt={2}>
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
        <Text fz="xs" c="dimmed" fw={500}>
          Supervisado por nutrición
        </Text>
        {hasMenus && (
          <Text fz="xs" fw={600} c="dark.4">
            Menú completo →
          </Text>
        )}
      </Group>
    </Paper>
  );
}
