'use client';

import { Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { normalizeKickoff, scheduleFromHour, DEFAULT_KICKOFF } from '@/lib/nutrition/match-kickoff';

const MATCH_SCHEDULE_OPTIONS = [
  { label: 'Mañana', value: 'manana' },
  { label: 'Tarde', value: 'tarde' },
  { label: 'Noche', value: 'noche' },
];

/**
 * Horario y hora de inicio (opcional) de un día de partido del plan. Con hora exacta el horario
 * se deduce de ella; al elegir otro horario a mano se descarta la hora que ya no encaja.
 * `value` es preMatchConfig.partidos[dayKey]; `onChange` recibe el objeto del día actualizado.
 */
export default function MatchKickoffControl({ value, fallbackHorario = 'tarde', onChange }) {
  const hora = typeof value?.hora === 'string' ? value.hora : '';
  const validHora = normalizeKickoff(hora);
  const horario = validHora ? scheduleFromHour(validHora) : value?.horario || fallbackHorario;

  const handleHora = (event) => {
    const next = event.currentTarget.value;
    const valid = normalizeKickoff(next);
    onChange({ ...(value || {}), hora: next, horario: valid ? scheduleFromHour(valid) : horario });
  };

  const handleHorario = (next) => {
    const keepHora = validHora && scheduleFromHour(validHora) === next;
    onChange({ ...(value || {}), horario: next, hora: keepHora ? hora : '' });
  };

  return (
    <Group gap="sm" align="flex-end" wrap="wrap" style={{ flexGrow: 1, maxWidth: 420 }}>
      <Stack gap={2} style={{ flexGrow: 1, minWidth: 220 }}>
        <Text size="xs" fw={600} c="dimmed">Horario del partido</Text>
        <SegmentedControl size="xs" fullWidth data={MATCH_SCHEDULE_OPTIONS} value={horario} onChange={handleHorario} />
      </Stack>
      <TimeInput
        label="Hora de inicio"
        description={validHora ? 'Hora exacta' : `Opcional · si no, ${DEFAULT_KICKOFF[horario]}`}
        value={hora}
        onChange={handleHora}
        size="xs"
        w={130}
      />
    </Group>
  );
}
