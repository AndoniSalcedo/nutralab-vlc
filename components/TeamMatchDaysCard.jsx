'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { Badge, Box, Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import Icon3D from '@/components/Icon3D';
import WidgetCard, { WidgetAside } from '@/components/widgets/WidgetCard';
import { listTeamMatchDays, setTeamMatchKickoff } from '@/actions/matchDayActions';
import { notifySaved } from '@/components/motion/notifySaved';
import { errorMessage } from '@/lib/actionError';
import { DEFAULT_KICKOFF, normalizeKickoff, scheduleFromHour } from '@/lib/nutrition/match-kickoff';

const SCHEDULE_LABELS = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

function countBySchedule(jugadores) {
  return jugadores.reduce((acc, j) => ({ ...acc, [j.horario]: (acc[j.horario] || 0) + 1 }), {});
}

function MatchDayRow({ day, readOnly, onSaved, teamId }) {
  const [hora, setHora] = useState(day.hora || '');
  const [saving, setSaving] = useState(false);
  useEffect(() => setHora(day.hora || ''), [day.hora]);

  const valid = normalizeKickoff(hora);
  const dirty = (valid || '') !== (day.hora || '') && (valid || hora === '');
  const bySchedule = countBySchedule(day.jugadores);
  const schedules = Object.keys(bySchedule);
  // Jugadores cuyo plan pauta otro horario: comerán según su plan, pero las horas no encajarán
  const mismatched = valid ? day.jugadores.filter((j) => j.horario !== scheduleFromHour(valid)) : [];
  const names = day.jugadores.map((j) => j.nombre).join(', ');

  const save = async (value) => {
    setSaving(true);
    try {
      const saved = await setTeamMatchKickoff(teamId, day.fecha, value);
      onSaved(day.fecha, saved.hora);
      notifySaved({ title: saved.hora ? `Partido a las ${saved.hora}` : 'Hora quitada', message: 'Los jugadores con partido ese día lo verán en su plan por horas.' });
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo guardar', message: errorMessage(error, 'Revisa la hora.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box px="sm" py={10} bg="gray.0" style={{ borderRadius: 14 }}>
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: '1 1 220px' }}>
          <Icon3D name="stadium" size={24} />
          <Box style={{ minWidth: 0 }}>
            <Text fz="sm" fw={700} c="dark.6" tt="capitalize" truncate>
              {dayjs(day.fecha).locale('es').format('dddd D MMM')}
            </Text>
            <Group gap={6} wrap="wrap">
              <Tooltip label={names} multiline maw={320} withArrow>
                <Text fz="xs" c="dimmed" style={{ cursor: 'help' }}>
                  {day.jugadores.length} {day.jugadores.length === 1 ? 'jugador' : 'jugadores'} con partido en su plan
                </Text>
              </Tooltip>
              {schedules.map((s) => (
                <Badge key={s} size="xs" variant="light" color="gray">
                  {SCHEDULE_LABELS[s]}{schedules.length > 1 ? ` · ${bySchedule[s]}` : ''}
                </Badge>
              ))}
            </Group>
          </Box>
        </Group>

        {readOnly ? (
          <Text fz="sm" fw={700} c={day.hora ? 'dark.6' : 'dimmed'}>
            {day.hora || `~${DEFAULT_KICKOFF[schedules[0]] || DEFAULT_KICKOFF.tarde}`}
          </Text>
        ) : (
          <Group gap="xs" align="flex-end" wrap="nowrap">
            <TimeInput
              aria-label="Hora de inicio"
              value={hora}
              onChange={(e) => {
                const { value } = e.currentTarget;
                setHora(value);
              }}
              variant="filled"
              radius="md"
              size="xs"
              w={110}
            />
            {dirty ? (
              <Button size="xs" radius="xl" color="lima" loading={saving} onClick={() => save(valid || '')}>
                Guardar
              </Button>
            ) : day.hora ? (
              <Button size="xs" radius="xl" variant="subtle" color="gray" loading={saving} onClick={() => { setHora(''); save(''); }}>
                Quitar
              </Button>
            ) : null}
          </Group>
        )}
      </Group>
      {!day.hora && (
        <Text fz={11} c="dimmed" mt={6}>
          Sin hora: se usa la orientativa de cada plan ({schedules.map((s) => `${SCHEDULE_LABELS[s].toLowerCase()} ${DEFAULT_KICKOFF[s]}`).join(', ')}).
        </Text>
      )}
      {mismatched.length > 0 && (
        <Text fz={11} c="orange.8" mt={6}>
          A las {valid} es partido de {SCHEDULE_LABELS[scheduleFromHour(valid)].toLowerCase()}, pero el plan de {mismatched.length === day.jugadores.length ? 'todos' : mismatched.map((j) => j.nombre).join(', ')} está pautado para otro horario: sus comidas siguen el plan. Si cambia el horario, rehaz su plan.
        </Text>
      )}
    </Box>
  );
}

/**
 * Próximos días de partido del equipo. Qué jugadores juegan y con qué horario lo deciden sus planes
 * nutricionales; aquí solo se fija la hora exacta de inicio de cada fecha, que afecta únicamente a
 * los jugadores cuyo plan marca ese día como partido.
 */
export default function TeamMatchDaysCard({ team, readOnly = false }) {
  const [days, setDays] = useState(null);

  useEffect(() => {
    if (!team?.id) return undefined;
    let alive = true;
    listTeamMatchDays(team.id)
      .then((rows) => { if (alive) setDays(rows || []); })
      .catch((error) => {
        console.error('Error cargando días de partido:', error);
        if (alive) setDays([]);
      });
    return () => { alive = false; };
  }, [team?.id]);

  const handleSaved = (fecha, hora) => {
    setDays((list) => list.map((d) => (d.fecha === fecha ? { ...d, hora } : d)));
  };

  return (
    <WidgetCard
      icon="tear_off_calendar"
      title="Próximos partidos"
      color="lima"
      aside={<WidgetAside color="salvia">{days?.length ?? '…'}</WidgetAside>}
      style={{ height: 'auto' }}
    >
      <Stack gap="sm">
        <Text fz="xs" c="dimmed" lh={1.4}>
          Los días de partido salen de los planes nutricionales de cada jugador (próximas 2 semanas).
          Pon la hora de inicio y esos jugadores verán su plan del día de partido por horas y recibirán
          los avisos a la hora real. A quien no tenga partido en su plan no le afecta.
        </Text>
        {days === null && <Text fz="xs" c="dimmed">Cargando…</Text>}
        {days?.length === 0 && (
          <Text fz="sm" c="dimmed">
            Ningún plan tiene días de partido en las próximas 2 semanas. Márcalos como «Partido» al crear el plan del jugador.
          </Text>
        )}
        {days?.map((day) => (
          <MatchDayRow key={day.fecha} day={day} teamId={team.id} readOnly={readOnly} onSaved={handleSaved} />
        ))}
      </Stack>
    </WidgetCard>
  );
}
