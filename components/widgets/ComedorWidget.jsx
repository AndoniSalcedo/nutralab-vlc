'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Group, Paper, Text } from '@mantine/core';
import WidgetCard, { WidgetAside } from './WidgetCard';

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
  const courses = todayDiningMenu
    ? [
      { label: 'Primero', value: todayDiningMenu.primero },
      { label: 'Segundo', value: todayDiningMenu.segundo },
      { label: 'Postre', value: todayDiningMenu.postre },
    ].filter((c) => c.value)
    : [];

  return (
    <WidgetCard
      id="widget-comedor"
      icon="fork_and_knife"
      title="Comedor Ciudad Deportiva"
      aside={todayDiningMenu ? <WidgetAside color="nutralabColor">13:00 – 15:30</WidgetAside> : null}
      footer="Supervisado por nutrición"
      footerAction={hasMenus ? 'Menú completo' : null}
      onClick={() => router.push(`/dashboard/jugador/${jugadorId}/nutricion/menu`)}
    >
      {courses.length > 0 ? (
        <Paper radius="md" bg="gray.0" withBorder style={{ borderColor: 'var(--mantine-color-gray-2)', overflow: 'hidden' }} mt="xs">
          {courses.map((course, idx) => (
            <Group
              key={course.label}
              gap="sm"
              wrap="nowrap"
              px="sm"
              py={8}
              style={{ borderTop: idx === 0 ? 0 : '1px solid var(--mantine-color-gray-2)' }}
            >
              <Text fz={10} fw={700} c="dimmed" tt="uppercase" lts={0.5} w={58} style={{ flexShrink: 0 }}>
                {course.label}
              </Text>
              <Text fz="sm" fw={500} c="dark.5" truncate style={{ flex: 1 }}>
                {course.value}
              </Text>
            </Group>
          ))}
        </Paper>
      ) : (
        <Paper p="md" radius="md" bg="gray.0" withBorder ta="center" style={{ borderColor: 'var(--mantine-color-gray-2)' }}>
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
    </WidgetCard>
  );
}
