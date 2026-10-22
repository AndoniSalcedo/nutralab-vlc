'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { ActionIcon, Box, Button, Group, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import Icon3D from '@/components/Icon3D';
import WidgetCard, { WidgetAside } from '@/components/widgets/WidgetCard';
import { listScheduledMatches, createScheduledMatch, deleteScheduledMatch } from '@/actions/matchDayActions';
import { notifySaved } from '@/components/motion/notifySaved';
import { errorMessage } from '@/lib/actionError';

const EMPTY_FORM = { fecha: null, hora: '18:30', rival: '', lugar: '' };

/**
 * Próximos partidos del equipo con hora de inicio. Con ellos cada jugador ve su plan
 * del día de partido por horas (y recibe los avisos) en lugar de la hora orientativa del plan.
 */
export default function ScheduledMatchesCard({ team, readOnly = false }) {
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!team?.id) return undefined;
    let alive = true;
    listScheduledMatches(team.id)
      .then((rows) => { if (alive) setMatches(rows || []); })
      .catch((error) => console.error('Error cargando próximos partidos:', error));
    return () => { alive = false; };
  }, [team?.id]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const created = await createScheduledMatch(team.id, { ...form, fecha: form.fecha ? dayjs(form.fecha).format('YYYY-MM-DD') : '' });
      setMatches((list) => [...list, created].sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)));
      setForm(EMPTY_FORM);
      notifySaved({ title: 'Partido programado', message: 'Los jugadores verán su plan de partido por horas.' });
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo guardar', message: errorMessage(error, 'Revisa la fecha y la hora.') });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteScheduledMatch(team.id, id);
      setMatches((list) => list.filter((m) => m.id !== id));
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo borrar', message: errorMessage(error) });
    }
  };

  return (
    <WidgetCard
      icon="tear_off_calendar"
      title="Próximos partidos"
      color="lima"
      aside={<WidgetAside color="salvia">{matches.length}</WidgetAside>}
      style={{ height: 'auto' }}
    >
      <Stack gap="sm">
        <Text fz="xs" c="dimmed" lh={1.4}>
          Con la hora exacta, cada jugador ve su plan del día de partido por horas y recibe avisos.
          {matches.length === 0 && ' Sin partidos programados se usa la hora orientativa del plan semanal.'}
        </Text>
        {matches.map((m) => (
          <Group key={m.id} justify="space-between" wrap="nowrap" px="sm" py={8} bg="gray.0" style={{ borderRadius: 14 }}>
            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
              <Icon3D name="stadium" size={24} />
              <Box style={{ minWidth: 0 }}>
                <Text fz="sm" fw={700} c="dark.6" truncate>{m.rival ? `vs ${m.rival}` : 'Partido'}</Text>
                <Text fz="xs" c="dimmed" tt="capitalize" truncate>
                  {dayjs(m.fecha).locale('es').format('dddd D MMM')} · {m.hora}{m.lugar ? ` · ${m.lugar}` : ''}
                </Text>
              </Box>
            </Group>
            {!readOnly && (
              <ActionIcon variant="subtle" color="gray" radius="xl" aria-label="Borrar partido" onClick={() => handleDelete(m.id)}>
                <IconTrash size={16} />
              </ActionIcon>
            )}
          </Group>
        ))}

        {!readOnly && (
          <SimpleGrid cols={{ base: 2, md: 5 }} spacing="xs">
            <DatePickerInput
              label="Fecha"
              placeholder="Elegir"
              value={form.fecha}
              onChange={(value) => setForm((f) => ({ ...f, fecha: value }))}
              minDate={dayjs().subtract(1, 'day').toDate()}
              valueFormat="D MMM YYYY"
              locale="es"
              variant="filled"
              radius="md"
              size="xs"
            />
            <TimeInput
              label="Hora"
              value={form.hora}
              onChange={(e) => setForm((f) => ({ ...f, hora: e.currentTarget.value }))}
              variant="filled"
              radius="md"
              size="xs"
            />
            <TextInput label="Rival" value={form.rival} onChange={(e) => setForm((f) => ({ ...f, rival: e.currentTarget.value }))} maxLength={80} variant="filled" radius="md" size="xs" />
            <TextInput label="Lugar" value={form.lugar} onChange={(e) => setForm((f) => ({ ...f, lugar: e.currentTarget.value }))} maxLength={80} variant="filled" radius="md" size="xs" />
            <Button mt={{ base: 0, md: 22 }} size="xs" radius="xl" color="lima" onClick={handleAdd} loading={saving} disabled={!form.fecha || !form.hora}>
              Añadir
            </Button>
          </SimpleGrid>
        )}
      </Stack>
    </WidgetCard>
  );
}
